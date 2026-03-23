import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import axios from "axios";
import { Vibrant } from "node-vibrant/node";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import {
  IMAGEN_NEGATIVE_PROMPT,
  appendPromptGuardrails,
  buildAssetParts,
  buildContentPrompt,
  buildRegenerationPrompt,
  normalizeProductType,
  type AssetReference,
  type ImageModelType,
} from "./serverPrompting";
import type { MarketerPreferences } from "./src/lib/marketerControls";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

function toSafeJson(text?: string | null) {
  return JSON.parse(text || "{}");
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

    const targetImage =
      images.find((img) => img.toLowerCase().includes("logo")) || images[0];

    let colors: string[] = [];
    let primaryColor = "#000000";
    let secondaryColor = "#ffffff";

    if (targetImage) {
      try {
        const imageResponse = await axios.get(targetImage, {
          responseType: "arraybuffer",
          timeout: 5000,
        });

        const vibrant = new Vibrant(
          Buffer.from(imageResponse.data, "binary"),
        );
        const palette = await vibrant.getPalette();

        if (palette.Vibrant) colors.push(palette.Vibrant.hex);
        if (palette.Muted) colors.push(palette.Muted.hex);
        if (palette.DarkVibrant) colors.push(palette.DarkVibrant.hex);
        if (palette.LightVibrant) colors.push(palette.LightVibrant.hex);
        if (palette.DarkMuted) colors.push(palette.DarkMuted.hex);

        primaryColor = palette.Vibrant?.hex || primaryColor;
        secondaryColor =
          palette.Muted?.hex || palette.LightVibrant?.hex || secondaryColor;
      } catch (error) {
        console.error("Error extracting colors", error);
      }
    }

    res.json({
      url,
      title,
      description: metaDescription || ogDescription,
      headlines: `${h1} ${h2}`.trim(),
      body_text: paragraphs,
      colors,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      logo_url: targetImage,
    });
  } catch (error: any) {
    console.error("Scrape error:", error.message);
    res.status(500).json({ error: error.message });
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
      model: "gemini-3.1-pro-preview",
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

app.post("/api/generate", async (req, res) => {
  try {
    const {
      brand,
      postType,
      postVisualHint,
      format,
      imageStyle,
      includeText,
      regenerateField,
      currentContent,
      selectedAssets = [],
      imageModelType = "imagen",
      marketerPreferences,
    } = req.body as {
      brand: any;
      postType: string;
      postVisualHint?: string;
      format: string;
      imageStyle: string;
      includeText: boolean;
      regenerateField?: string;
      currentContent?: Record<string, string>;
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

      const regenResponse = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: assetParts.length ? [regenPrompt, ...assetParts] : regenPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { [regenerateField]: { type: Type.STRING } },
            required: [regenerateField],
          },
        },
      });

      const regenResult = toSafeJson(regenResponse.text);

      if (regenResult.image_prompt) {
        regenResult.image_prompt = appendPromptGuardrails({
          prompt: regenResult.image_prompt,
          hook: currentContent.hook || "",
          includeText,
          language: brandWithNormalizedType.language || "pt-BR",
          imageModelType,
          hasAssets: safeAssets.length > 0,
        });
      }

      return res.json({ ...currentContent, ...regenResult });
    }

    const prompt = buildContentPrompt({
      brand: brandWithNormalizedType,
      postType,
      postVisualHint,
      format,
      imageStyle,
      includeText,
      imageModelType,
      selectedAssets: safeAssets,
      marketerPreferences,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: assetParts.length ? [prompt, ...assetParts] : prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hook: { type: Type.STRING },
            caption: { type: Type.STRING },
            cta: { type: Type.STRING },
            hashtags: { type: Type.STRING },
            image_prompt: { type: Type.STRING },
          },
          required: ["hook", "caption", "cta", "hashtags", "image_prompt"],
        },
      },
    });

    const content = toSafeJson(response.text);
    content.hook = (content.hook || "").trim();
    content.caption = (content.caption || "").trim();
    content.cta = (content.cta || "").trim();
    content.hashtags = (content.hashtags || "").trim();
    content.image_prompt = appendPromptGuardrails({
      prompt: content.image_prompt || "",
      hook: content.hook || "",
      includeText,
      language: brandWithNormalizedType.language || "pt-BR",
      imageModelType,
      hasAssets: safeAssets.length > 0,
    });

    res.json(content);
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
    } = req.body as {
      prompt: string;
      imageModel: string;
      aspectRatio: string;
      imageSize: string;
      modelType: ImageModelType;
      referenceImages?: AssetReference[];
    };

    if (!prompt || !imageModel) {
      return res
        .status(400)
        .json({ error: "prompt and imageModel required" });
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

      return res.json({ imageBase64: imgBytes });
    }

    const referenceParts = safeReferences.length
      ? await buildAssetParts(safeReferences, 3)
      : [];

    const response = await ai.models.generateContent({
      model: imageModel,
      contents: referenceParts.length ? [prompt, ...referenceParts] : prompt,
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

    res.json({ imageBase64: imagePart.inlineData.data });
  } catch (error: any) {
    console.error("Image error:", error);
    res.status(500).json({ error: error.message || "Erro ao gerar imagem" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
