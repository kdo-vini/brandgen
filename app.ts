import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import axios from "axios";
import { Vibrant } from "node-vibrant/node";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  IMAGEN_NEGATIVE_PROMPT,
  buildAssetParts,
  buildCopyPrompt,
  buildCriticPrompt,
  buildImagePromptFromBrief,
  buildRegenerationPrompt,
  buildStrategyPrompt,
  buildVisualBriefPrompt,
  normalizeProductType,
  PROMPT_VERSIONS,
  type AssetReference,
  type CreativeCritic,
  type ImageModelType,
  type StrategyPlan,
  type VisualBrief,
} from "./serverPrompting";
import type { MarketerPreferences } from "./src/lib/marketerControls";

// ─── Stripe + Supabase admin ─────────────────────────────────────────────────

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" })
  : null;

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
  : null;

const PLAN_LIMITS_SERVER = {
  free: { imageGenerationsPerMonth: 3, textGenerationsPerMonth: 15 },
  pro: { imageGenerationsPerMonth: 40, textGenerationsPerMonth: 150 },
} as const;

async function getServerUserPlan(userId: string): Promise<"free" | "pro"> {
  if (!supabaseAdmin) return "free";
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return "free";
  const active = data.status === "active" || data.status === "trialing";
  return active && data.plan === "pro" ? "pro" : "free";
}

async function getServerUsage(userId: string, month: string) {
  if (!supabaseAdmin) return { text_generations: 0, image_generations: 0 };
  const { data } = await supabaseAdmin
    .from("usage_tracking")
    .select("text_generations, image_generations")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();
  return data ?? { text_generations: 0, image_generations: 0 };
}

async function incrementUsage(
  userId: string,
  month: string,
  field: "text" | "image",
) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.rpc("increment_usage", {
    p_user_id: userId,
    p_month: month,
    p_text_generations: field === "text" ? 1 : 0,
    p_image_generations: field === "image" ? 1 : 0,
  });
}

// ─── Express app ─────────────────────────────────────────────────────────────

const app = express();
app.use(cors());

// Stripe webhook needs raw body — register BEFORE express.json()
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err: any) {
      console.error("[Stripe webhook] signature error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: "DB not configured" });
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = sub.items.data[0]?.current_period_end;
          await supabaseAdmin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan: "pro",
              status: sub.status,
              current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
              cancel_at_period_end: sub.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        }
      }

      if (event.type === "customer.subscription.updated") {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (userId) {
          const periodEnd = sub.items.data[0]?.current_period_end;
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: sub.status,
              plan: sub.status === "active" || sub.status === "trialing" ? "pro" : "free",
              current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
              cancel_at_period_end: sub.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", sub.id);
        }
      }

      if (event.type === "customer.subscription.deleted") {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled",
            plan: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
      }

      if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (
          invoice.parent?.subscription_details?.subscription ?? null
        ) as string | null;
        if (subId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subId);
        }
      }
    } catch (err) {
      console.error("[Stripe webhook] handler error:", err);
    }

    res.json({ received: true });
  },
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─── Color helpers ───────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function deduplicateColors(colors: string[], threshold = 40): string[] {
  const result: string[] = [];
  for (const color of colors) {
    if (!result.some((r) => colorDistance(r, color) < threshold)) {
      result.push(color);
    }
  }
  return result;
}

function extractCssHexColors(html: string, limit = 60): string[] {
  const hexSet = new Set<string>();
  const matches = html.match(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g) || [];
  for (const m of matches) {
    hexSet.add(m.toUpperCase());
    if (hexSet.size >= limit) break;
  }
  return Array.from(hexSet);
}

async function extractColorsFromImageBuffer(
  buffer: Buffer,
): Promise<{ colors: string[]; primaryColor: string; secondaryColor: string }> {
  const vibrant = new Vibrant(buffer);
  const palette = await vibrant.getPalette();

  const swatches = [
    palette.Vibrant,
    palette.DarkVibrant,
    palette.LightVibrant,
    palette.Muted,
    palette.DarkMuted,
    palette.LightMuted,
  ]
    .filter(Boolean)
    .map((s) => s!.hex);

  const primaryColor =
    palette.Vibrant?.hex || palette.Muted?.hex || swatches[0] || "#000000";
  const secondaryColor =
    palette.Muted?.hex || palette.LightVibrant?.hex || swatches[1] || "#ffffff";

  return { colors: swatches, primaryColor, secondaryColor };
}

// ─────────────────────────────────────────────────────────────────────────────

function toSafeJson(text?: string | null) {
  const raw = (text || "").trim();

  if (!raw) {
    return {};
  }

  const withoutFence = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(withoutFence || "{}");
}

function buildMultimodalContents(prompt: string, assetParts: any[]) {
  return assetParts.length ? [...assetParts, prompt] : prompt;
}

async function generateStructuredObject<T>({
  ai,
  prompt,
  schema,
  assetParts = [],
}: {
  ai: GoogleGenAI;
  prompt: string;
  schema: Record<string, unknown>;
  assetParts?: any[];
}) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro-preview-03-25",
    contents: buildMultimodalContents(prompt, assetParts),
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  return toSafeJson(response.text) as T;
}

app.post("/api/scrape", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $("title").text() || "";
    const metaDescription = $('meta[name="description"]').attr("content") || "";
    const ogDescription =
      $('meta[property="og:description"]').attr("content") || "";

    const h1 = $("h1")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .join(" | ");

    const h2 = $("h2")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .slice(0, 5)
      .join(" | ");

    const paragraphs = $("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .join(" ")
      .slice(0, 500);

    const images: string[] = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (!src) return;

      try {
        images.push(new URL(src, url).href);
      } catch {
        // Ignore invalid image URLs.
      }
    });

    // Build candidates: logo img → favicon → og:image → first img
    const logoImg =
      images.find((img) => img.toLowerCase().includes("logo")) ||
      $("img[alt*='logo' i], img[class*='logo' i], img[id*='logo' i]")
        .first()
        .attr("src") ||
      null;

    const faviconHref =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href") ||
      null;
    const faviconUrl = faviconHref
      ? (() => { try { return new URL(faviconHref, url).href; } catch { return null; } })()
      : null;

    const ogImage = $('meta[property="og:image"]').attr("content") || null;

    const imageCandidates = [logoImg, ogImage, faviconUrl, images[0]].filter(
      (v): v is string => !!v,
    );

    let colors: string[] = [];
    let primaryColor = "#000000";
    let secondaryColor = "#ffffff";

    // Extract colors from the first reachable image candidate
    for (const candidate of imageCandidates) {
      try {
        const imageResponse = await axios.get(candidate, {
          responseType: "arraybuffer",
          timeout: 5000,
        });
        const extracted = await extractColorsFromImageBuffer(
          Buffer.from(imageResponse.data, "binary"),
        );
        colors = extracted.colors;
        primaryColor = extracted.primaryColor;
        secondaryColor = extracted.secondaryColor;
        break;
      } catch {
        // Try next candidate
      }
    }

    // Supplement with CSS hex colors so whites/blacks/brand neutrals are captured
    const cssColors = extractCssHexColors(html);
    colors = deduplicateColors([...colors, ...cssColors]).slice(0, 10);

    res.json({
      url,
      title,
      description: metaDescription || ogDescription,
      headlines: `${h1} ${h2}`.trim(),
      body_text: paragraphs,
      colors,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      logo_url: logoImg || ogImage,
    });
  } catch (error: any) {
    console.error("Scrape error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/extract-image-colors", async (req, res) => {
  try {
    const { imageBase64 } = req.body as { imageBase64: string };
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 required" });
    }

    const buffer = Buffer.from(imageBase64, "base64");
    const { colors, primaryColor, secondaryColor } =
      await extractColorsFromImageBuffer(buffer);

    res.json({
      colors: deduplicateColors(colors),
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    });
  } catch (error: any) {
    console.error("Extract image colors error:", error);
    res.status(500).json({ error: error.message || "Erro ao extrair cores da imagem" });
  }
});

app.post("/api/analyze-instagram", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body as {
      imageBase64: string;
      mimeType?: string;
    };
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 required" });
    }

    // Extract colors from the screenshot
    const buffer = Buffer.from(imageBase64, "base64");
    const { colors, primaryColor, secondaryColor } =
      await extractColorsFromImageBuffer(buffer);

    // Analyze with Gemini Vision using the same pattern as /api/generate
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const imagePart = { inlineData: { mimeType, data: imageBase64 } };

    const prompt = `Você é um especialista em branding. Analise este print de perfil do Instagram e extraia as informações da marca com base no que está visível: nome, bio, posts, estética visual e tom de comunicação.

Retorne APENAS JSON com os campos abaixo. Responda sempre em pt-BR.
- brand_name: nome da conta ou marca
- product_type: um de [saas, ecommerce, food, service, other]
- tone: um de [formal, casual, bold, friendly]
- target_audience: para quem é essa marca, 1 frase
- value_proposition: o que ela oferece de valor, 1 frase
- key_pain: dor que ela resolve, 1 frase
- language: um de [pt-BR, en, es]
- emoji_style: um de [minimal, moderate, heavy]
- description: resumo da marca com base na bio e posts visíveis, máximo 2 frases
- keywords: array de 3 a 5 palavras-chave relevantes`;

    const analysis = await generateStructuredObject<Record<string, unknown>>({
      ai,
      prompt,
      schema: {
        type: Type.OBJECT,
        properties: {
          brand_name: { type: Type.STRING },
          product_type: { type: Type.STRING },
          tone: { type: Type.STRING },
          target_audience: { type: Type.STRING },
          value_proposition: { type: Type.STRING },
          key_pain: { type: Type.STRING },
          language: { type: Type.STRING },
          emoji_style: { type: Type.STRING },
          description: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          "brand_name",
          "product_type",
          "tone",
          "target_audience",
          "value_proposition",
          "key_pain",
          "language",
          "emoji_style",
        ],
      },
      assetParts: [imagePart],
    });

    analysis.product_type = normalizeProductType(analysis.product_type as string);

    res.json({
      ...analysis,
      colors: deduplicateColors(colors),
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    });
  } catch (error: any) {
    console.error("Analyze Instagram error:", error);
    res.status(500).json({
      error: error.message || "Não consegui analisar a imagem. Tenta de novo?",
    });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { scraped } = req.body;
    if (!scraped) {
      return res.status(400).json({ error: "scraped data required" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const prompt = `Analyze this brand based on extracted website data and return valid JSON only.

Website data:
- URL: ${scraped.url}
- Title: ${scraped.title}
- Description: ${scraped.description}
- Headlines: ${scraped.headlines}
- Body text: ${scraped.body_text}
- Colors: ${scraped.colors?.join(", ")}

Return:
- brand_name
- product_type: use only one of [saas, ecommerce, food, service, other]
- tone: use only one of [formal, casual, bold, friendly]
- target_audience: 1 sentence in pt-BR
- value_proposition: 1 sentence in pt-BR
- key_pain: 1 sentence in pt-BR
- language: use only one of [pt-BR, en, es]
- emoji_style: use only one of [minimal, moderate, heavy]

Prefer pt-BR whenever the site appears to be Brazilian.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro-preview-03-25",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand_name: { type: Type.STRING },
            product_type: { type: Type.STRING },
            tone: { type: Type.STRING },
            target_audience: { type: Type.STRING },
            value_proposition: { type: Type.STRING },
            key_pain: { type: Type.STRING },
            language: { type: Type.STRING },
            emoji_style: { type: Type.STRING },
          },
          required: [
            "brand_name",
            "product_type",
            "tone",
            "target_audience",
            "value_proposition",
            "key_pain",
            "language",
            "emoji_style",
          ],
        },
      },
    });

    const analysis = toSafeJson(response.text);
    analysis.product_type = normalizeProductType(analysis.product_type);
    res.json(analysis);
  } catch (error: any) {
    console.error("Analyze API Error!", JSON.stringify(error, null, 2));
    res.status(500).json({
      error: error.message || "A IA travou na analise. Tenta de novo?",
    });
  }
});

const strategySchema = {
  type: Type.OBJECT,
  properties: {
    objective: { type: Type.STRING },
    angle: { type: Type.STRING },
    copyApproach: { type: Type.STRING },
    captionBlueprint: { type: Type.STRING },
    emotionalVector: { type: Type.STRING },
    rationale: { type: Type.STRING },
    imageText: { type: Type.STRING },
  },
  required: [
    "objective",
    "angle",
    "copyApproach",
    "captionBlueprint",
    "emotionalVector",
    "rationale",
    "imageText",
  ],
};

const copySchema = {
  type: Type.OBJECT,
  properties: {
    hook: { type: Type.STRING },
    caption: { type: Type.STRING },
    cta: { type: Type.STRING },
    hashtags: { type: Type.STRING },
  },
  required: ["hook", "caption", "cta", "hashtags"],
};

const visualBriefSchema = {
  type: Type.OBJECT,
  properties: {
    modelRecommendation: { type: Type.STRING },
    visualGoal: { type: Type.STRING },
    composition: { type: Type.STRING },
    layout: { type: Type.STRING },
    background: { type: Type.STRING },
    productRole: { type: Type.STRING },
    textTreatment: { type: Type.STRING },
    avoid: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "modelRecommendation",
    "visualGoal",
    "composition",
    "layout",
    "background",
    "productRole",
    "textTreatment",
    "avoid",
  ],
};

const criticSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER },
    brandFit: { type: Type.NUMBER },
    categoryFit: { type: Type.NUMBER },
    clarity: { type: Type.NUMBER },
    originality: { type: Type.NUMBER },
    conversionReadiness: { type: Type.NUMBER },
    aiSlopRisk: { type: Type.NUMBER },
    verdict: { type: Type.STRING },
    recommendedFix: { type: Type.STRING },
    notes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "overallScore",
    "brandFit",
    "categoryFit",
    "clarity",
    "originality",
    "conversionReadiness",
    "aiSlopRisk",
    "verdict",
    "recommendedFix",
    "notes",
  ],
};

app.post("/api/generate", async (req, res) => {
  try {
    const {
      brand,
      postType,
      format,
      imageStyle,
      includeText,
      regenerateField,
      currentContent,
      selectedAssets = [],
      imageModelType = "nanoBanana",
      marketerPreferences,
    } = req.body as {
      brand: any;
      postType: string;
      format: string;
      imageStyle: string;
      includeText: boolean;
      regenerateField?: string;
      currentContent?: Record<string, any>;
      selectedAssets?: AssetReference[];
      imageModelType?: ImageModelType;
      marketerPreferences?: Partial<MarketerPreferences> | null;
    };

    if (!brand) {
      return res.status(400).json({ error: "brand required" });
    }

    const safeAssets = Array.isArray(selectedAssets)
      ? selectedAssets.filter((asset) => asset?.url)
      : [];

    const brandWithNormalizedType = {
      ...brand,
      product_type: normalizeProductType(brand.product_type),
    };

    const assetParts = safeAssets.length
      ? await buildAssetParts(safeAssets, 3)
      : [];

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    if (regenerateField && currentContent) {
      const regenPrompt = buildRegenerationPrompt({
        field: regenerateField,
        brand: brandWithNormalizedType,
        postType,
        format,
        imageStyle,
        includeText,
        imageModelType,
        selectedAssets: safeAssets,
        currentContent,
        marketerPreferences,
      });

      const regenResult = await generateStructuredObject<Record<string, string>>({
        ai,
        prompt: regenPrompt,
        schema: {
          type: Type.OBJECT,
          properties: { [regenerateField]: { type: Type.STRING } },
          required: [regenerateField],
        },
        assetParts,
      });

      return res.json({ ...currentContent, ...regenResult });
    }

    const strategy = await generateStructuredObject<StrategyPlan>({
      ai,
      prompt: buildStrategyPrompt({
        brand: brandWithNormalizedType,
        postType,
        format,
        imageStyle,
        includeText,
        selectedAssets: safeAssets,
        marketerPreferences,
      }),
      schema: strategySchema,
      assetParts,
    });

    const copy = await generateStructuredObject<{
      hook: string;
      caption: string;
      cta: string;
      hashtags: string;
    }>({
      ai,
      prompt: buildCopyPrompt({
        brand: brandWithNormalizedType,
        postType,
        includeText,
        strategy,
        marketerPreferences,
      }),
      schema: copySchema,
    });

    const visualBrief = await generateStructuredObject<VisualBrief>({
      ai,
      prompt: buildVisualBriefPrompt({
        brand: brandWithNormalizedType,
        postType,
        format,
        imageStyle,
        imageModelType,
        selectedAssets: safeAssets,
        strategy,
        copy,
      }),
      schema: visualBriefSchema,
      assetParts,
    });

    const imagePrompt = buildImagePromptFromBrief({
      brand: brandWithNormalizedType,
      format,
      imageStyle,
      includeText,
      imageModelType,
      selectedAssets: safeAssets,
      strategy,
      copy,
      visualBrief,
    });

    const critic = await generateStructuredObject<CreativeCritic>({
      ai,
      prompt: buildCriticPrompt({
        brand: brandWithNormalizedType,
        strategy,
        copy,
        visualBrief,
        imagePrompt,
      }),
      schema: criticSchema,
    });

    res.json({
      hook: (copy.hook || "").trim(),
      caption: (copy.caption || "").trim(),
      cta: (copy.cta || "").trim(),
      hashtags: (copy.hashtags || "").trim(),
      image_text: (strategy.imageText || "").trim(),
      image_prompt: imagePrompt,
      strategy,
      visual_brief: {
        ...visualBrief,
        avoid: Array.isArray(visualBrief.avoid)
          ? visualBrief.avoid.filter(Boolean)
          : [],
      },
      critic: {
        ...critic,
        notes: Array.isArray(critic.notes) ? critic.notes.filter(Boolean) : [],
      },
      prompt_versions: PROMPT_VERSIONS,
    });
  } catch (error: any) {
    console.error("Generate error:", error);
    res.status(500).json({ error: error.message || "Erro ao gerar conteudo" });
  }
});

app.post("/api/image", async (req, res) => {
  try {
    const {
      prompt,
      imageModel,
      aspectRatio,
      imageSize,
      modelType,
      referenceImages = [],
      userId,
    } = req.body as {
      prompt: string;
      imageModel: string;
      aspectRatio: string;
      imageSize: string;
      modelType: ImageModelType;
      referenceImages?: AssetReference[];
      userId?: string;
    };

    if (!prompt || !imageModel) {
      return res
        .status(400)
        .json({ error: "prompt and imageModel required" });
    }

    // Server-side image quota check
    if (userId && supabaseAdmin) {
      const month = new Date().toISOString().slice(0, 7);
      const plan = await getServerUserPlan(userId);
      const usageData = await getServerUsage(userId, month);
      const limit = PLAN_LIMITS_SERVER[plan].imageGenerationsPerMonth;
      if (usageData.image_generations >= limit) {
        return res.status(429).json({
          error: "Limite de imagens do plano atingido",
          code: "IMAGE_LIMIT_REACHED",
          plan,
          limit,
          used: usageData.image_generations,
        });
      }
    }

    const safeReferences = Array.isArray(referenceImages)
      ? referenceImages.filter((asset) => asset?.url).slice(0, 3)
      : [];

    if (modelType === "imagen" && safeReferences.length > 0) {
      return res.status(400).json({
        error:
          "Pra editar usando assets reais, escolhe um modelo Nano Banana.",
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    if (modelType === "imagen") {
      const imagenPrompt = `${prompt.trim()} Avoid: ${IMAGEN_NEGATIVE_PROMPT}.`;

      const response = await ai.models.generateImages({
        model: imageModel,
        prompt: imagenPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio,
          outputMimeType: "image/png",
        },
      });

      const imgBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (!imgBytes) {
        throw new Error("Nenhuma imagem gerada");
      }

      if (userId) {
        const month = new Date().toISOString().slice(0, 7);
        await incrementUsage(userId, month, "image").catch(() => {});
      }
      return res.json({ imageBase64: imgBytes });
    }

    const referenceParts = safeReferences.length
      ? await buildAssetParts(safeReferences, 3)
      : [];

    const response = await ai.models.generateContent({
      model: imageModel,
      contents: buildMultimodalContents(prompt, referenceParts),
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: { aspectRatio, imageSize },
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.data,
    );

    if (!imagePart?.inlineData?.data) {
      throw new Error("Nenhuma imagem gerada");
    }

    if (userId) {
      const month = new Date().toISOString().slice(0, 7);
      await incrementUsage(userId, month, "image").catch(() => {});
    }
    res.json({ imageBase64: imagePart.inlineData.data });
  } catch (error: any) {
    console.error("Image error:", error);
    res.status(500).json({ error: error.message || "Erro ao gerar imagem" });
  }
});

// ─── Stripe routes ────────────────────────────────────────────────────────────

app.post("/api/stripe/checkout", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  const { userId, userEmail } = req.body as {
    userId: string;
    userEmail: string;
  };
  if (!userId || !userEmail) {
    return res.status(400).json({ error: "userId and userEmail required" });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return res.status(500).json({ error: "STRIPE_PRO_PRICE_ID not configured" });
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  try {
    // Find or skip existing customer
    let customerId: string | undefined;
    if (supabaseAdmin) {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .maybeSingle();
      customerId = sub?.stripe_customer_id ?? undefined;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: userId },
      subscription_data: { metadata: { user_id: userId } },
      success_url: `${appUrl}/?checkout=success`,
      cancel_url: `${appUrl}/?checkout=cancel`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("[Stripe checkout] error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/stripe/portal", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  const { userId } = req.body as { userId: string };
  if (!userId) return res.status(400).json({ error: "userId required" });

  if (!supabaseAdmin) return res.status(500).json({ error: "DB not configured" });

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    return res.status(404).json({ error: "No Stripe customer found" });
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: appUrl,
    });
    res.json({ url: session.url });
  } catch (err: any) {
    console.error("[Stripe portal] error:", err);
    res.status(500).json({ error: err.message });
  }
});

export { app };
