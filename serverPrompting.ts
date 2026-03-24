import axios from "axios";
import { createPartFromBase64, Type } from "@google/genai";
import {
  normalizeMarketerPreferences,
  type CtaIntensity,
  type EmojiUsage,
  type MarketerPreferences,
  type PostObjective,
  type ToneOverride,
} from "./src/lib/marketerControls.js";
import { getFewShotExamples } from "./src/lib/fewShotBank.js";

export type ImageModelType = "imagen" | "nanoBanana";

export type AssetReference = {
  id?: string;
  url: string;
  filename?: string | null;
  type?: string | null;
};

export type StrategyPlan = {
  objective: string;
  angle: string;
  copyApproach: string;
  captionBlueprint: string;
  emotionalVector: string;
  rationale: string;
  imageText: string;
};

export type VisualBrief = {
  modelRecommendation: ImageModelType;
  visualGoal: string;
  composition: string;
  layout: string;
  background: string;
  productRole: string;
  textTreatment: string;
  avoid: string[];
};

export type CreativeCritic = {
  overallScore: number;
  brandFit: number;
  categoryFit: number;
  clarity: number;
  originality: number;
  conversionReadiness: number;
  aiSlopRisk: number;
  verdict: string;
  recommendedFix: string;
  notes: string[];
};

type CopyApproachResolved =
  | "direct"
  | "storytelling"
  | "educational"
  | "proof"
  | "provocative";

type CaptionBlueprint = "short" | "medium" | "story" | "list";
type EmojiPolicyResolved = "none" | "minimal" | "moderate";

export const PROMPT_VERSIONS = {
  strategy: "1.0",
  copy: "1.0",
  visual: "1.0",
  critic: "1.0",
} as const;

export const IMAGEN_NEGATIVE_PROMPT =
  "phone mockup, browser chrome, fake app screen, placeholder brand, lorem ipsum, duplicated product, warped food, unreadable typography, long paragraphs, clipart, cartoon icons, distorted hands, cropped hero product, extra borders";

export function normalizeKey(value?: string | null): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function normalizeProductType(value?: string | null): string {
  const normalized = normalizeKey(value);

  if (
    ["saas", "sistema", "system", "software", "app", "platform"].includes(
      normalized,
    )
  ) {
    return "saas";
  }

  if (
    ["ecommerce", "e-commerce", "loja", "store", "shop"].includes(normalized)
  ) {
    return "ecommerce";
  }

  if (
    [
      "food",
      "comida",
      "restaurante",
      "hamburgueria",
      "cafeteria",
      "gastro",
    ].includes(normalized)
  ) {
    return "food";
  }

  if (
    [
      "service",
      "servico",
      "servicos",
      "consultoria",
      "agencia",
      "agency",
    ].includes(normalized)
  ) {
    return "service";
  }

  return "other";
}

export function hexToColorName(hex: string) {
  const cleanHex = (hex || "#000000").replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;

  if (max - min < 30) {
    if (lightness > 0.85) return "white";
    if (lightness > 0.6) return "light gray";
    if (lightness > 0.4) return "gray";
    return "near black";
  }

  let hue = 0;
  const delta = max - min;

  if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
  else if (max === g) hue = ((b - r) / delta + 2) * 60;
  else hue = ((r - g) / delta + 4) * 60;

  const saturation = delta / 255;
  const colorName =
    hue < 15 || hue >= 345
      ? "red"
      : hue < 45
        ? "orange"
        : hue < 70
          ? "yellow"
          : hue < 160
            ? "green"
            : hue < 200
              ? "teal"
              : hue < 260
                ? "blue"
                : hue < 290
                  ? "purple"
                  : "pink";

  let prefix =
    lightness < 0.25
      ? "very dark "
      : lightness < 0.4
        ? "dark "
        : lightness > 0.85
          ? "very light "
          : lightness > 0.75
            ? "light "
            : "";

  if (saturation < 0.3) prefix += "muted ";
  else if (saturation > 0.7) prefix += "vivid ";

  return prefix + colorName;
}

function resolveObjective(
  selectedObjective: PostObjective,
  postType: string,
): Exclude<PostObjective, "auto"> {
  if (selectedObjective !== "auto") {
    return selectedObjective;
  }

  const key = normalizeKey(postType);

  if (
    key.includes("lancamento") ||
    key.includes("novidade") ||
    key.includes("evento") ||
    key.includes("webinar")
  ) {
    return "launch";
  }

  if (
    key.includes("oferta") ||
    key.includes("cta") ||
    key.includes("oferta direta")
  ) {
    return "conversion";
  }

  if (
    key.includes("dica") ||
    key.includes("tutorial") ||
    key.includes("mito") ||
    key.includes("numero") ||
    key.includes("resultado") ||
    key.includes("depoimento") ||
    key.includes("prova social") ||
    key.includes("antes") ||
    key.includes("depois")
  ) {
    return "consideration";
  }

  if (key.includes("bastidores")) {
    return "retention";
  }

  if (key.includes("oferta") || key.includes("relampago") || key.includes("promo")) {
    return "offer";
  }

  if (key.includes("autoridade") || key.includes("resultado") && key.includes("numero")) {
    return "authority";
  }

  if (key.includes("comunidade") || key.includes("pergunta") || key.includes("enquete")) {
    return "community";
  }

  if (key.includes("evento") || key.includes("webinar")) {
    return "local_traffic";
  }

  return "awareness";
}

function resolveCopyApproach(
  objective: Exclude<PostObjective, "auto">,
  postType: string,
): CopyApproachResolved {
  const key = normalizeKey(postType);

  if (
    key.includes("numero") ||
    key.includes("resultado") ||
    key.includes("depoimento") ||
    key.includes("prova social")
  ) {
    return "proof";
  }

  if (key.includes("dica") || key.includes("tutorial") || key.includes("mito")) {
    return "educational";
  }

  if (key.includes("bastidores") || key.includes("founder")) {
    return "storytelling";
  }

  if (key.includes("dor do cliente") || key.includes("pergunta")) {
    return "provocative";
  }

  if (objective === "awareness" || objective === "launch") {
    return "provocative";
  }

  return "direct";
}

function resolveCaptionBlueprint(
  objective: Exclude<PostObjective, "auto">,
  postType: string,
  copyApproach: CopyApproachResolved,
): CaptionBlueprint {
  const key = normalizeKey(postType);

  if (copyApproach === "storytelling") return "story";
  if (copyApproach === "educational") return "list";

  if (
    objective === "conversion" ||
    objective === "launch" ||
    key.includes("oferta") ||
    key.includes("cta")
  ) {
    return "short";
  }

  return "medium";
}

function resolveCtaIntensity(
  selectedIntensity: CtaIntensity,
  objective: Exclude<PostObjective, "auto">,
): Exclude<CtaIntensity, "auto"> {
  if (selectedIntensity !== "auto") {
    return selectedIntensity;
  }

  if (objective === "conversion" || objective === "launch") {
    return "hard";
  }

  if (objective === "awareness") {
    return "soft";
  }

  return "medium";
}

function resolveEmojiUsage(
  selectedEmojiUsage: EmojiUsage,
  brandEmojiStyle?: string | null,
  productType?: string | null,
): EmojiPolicyResolved {
  if (selectedEmojiUsage !== "followBrand") {
    return selectedEmojiUsage;
  }

  const productKey = normalizeProductType(productType);
  const brandSignal = normalizeKey(brandEmojiStyle);

  if (productKey === "saas") {
    return "none";
  }

  if (brandSignal === "heavy" || brandSignal === "moderate") {
    return "moderate";
  }

  return "minimal";
}

function getCaptionCharacterLimit(captionBlueprint: CaptionBlueprint) {
  switch (captionBlueprint) {
    case "short":
      return 220;
    case "story":
      return 420;
    case "list":
      return 320;
    default:
      return 300;
  }
}

function getObjectiveGuidance(objective: Exclude<PostObjective, "auto">) {
  switch (objective) {
    case "awareness":
      return "Win attention fast, create memorability, and keep the ask light.";
    case "consideration":
      return "Reduce doubt, explain value clearly, and make the brand feel credible.";
    case "conversion":
      return "Turn attention into action with a clear offer, gain, or next step.";
    case "retention":
      return "Re-engage people who already know the brand with relevance and warmth.";
    case "launch":
      return "Make the post feel new, timely, and worth noticing right now.";
    case "offer":
      return "Communicate the offer clearly and make the value immediately obvious. Prioritize the gain over the conditions.";
    case "authority":
      return "Position the brand as a credible reference. Use evidence, process insight, or informed perspective.";
    case "community":
      return "Invite participation, spark conversation, and make the audience feel seen and part of something.";
    case "local_traffic":
      return "Drive physical presence. Make the where and when concrete, and the reason to show up compelling.";
    case "seasonal":
      return "Tie the message to the timely moment. Make the brand feel present and relevant right now.";
  }
}

function getCopyApproachGuidance(copyApproach: CopyApproachResolved) {
  switch (copyApproach) {
    case "direct":
      return "Get to the point quickly, keep the benefit visible, and avoid warm-up that wastes attention.";
    case "storytelling":
      return "Open with a concrete situation, create momentum, then land the payoff and CTA.";
    case "educational":
      return "Teach one useful thing clearly and make it easy to scan at a glance.";
    case "proof":
      return "Anchor the message in believable evidence, result, trust, or product truth.";
    case "provocative":
      return "Use contrast, a sharp angle, or a pattern interrupt without sounding like clickbait.";
  }
}

function getCaptionBlueprintGuidance(captionBlueprint: CaptionBlueprint) {
  switch (captionBlueprint) {
    case "short":
      return "Keep the caption lean and fast, one compact block or two short lines.";
    case "story":
      return "Structure the caption as setup, tension, payoff, then CTA.";
    case "list":
      return "Make the caption scannable with steps, bullets, or short stacked lines.";
    default:
      return "Use two short blocks with enough context to persuade without dragging.";
  }
}

function getToneGuidance(
  toneOverride: ToneOverride,
  brandTone?: string | null,
) {
  const baseTone = brandTone || "natural";

  switch (toneOverride) {
    case "casual":
      return `Sound lighter and closer than the base brand tone (${baseTone}), without turning sloppy.`;
    case "premium":
      return `Sound more polished and restrained than the base brand tone (${baseTone}).`;
    case "technical":
      return `Sound more precise and informed than the base brand tone (${baseTone}).`;
    case "sales":
      return `Sound more commercial than the base brand tone (${baseTone}), but stay believable.`;
    default:
      return `Stay aligned to the base brand tone (${baseTone}) and keep it publish-ready.`;
  }
}

function getEmojiGuidance(emojiUsage: EmojiPolicyResolved) {
  switch (emojiUsage) {
    case "none":
      return "Use zero emojis anywhere in hook, caption, CTA, and hashtags.";
    case "minimal":
      return "Use at most one emoji in the full copy package, only if it improves tone or readability.";
    case "moderate":
      return "Use a few emojis only when natural, never stacked, never as filler.";
  }
}

function getCtaGuidance(ctaIntensity: Exclude<CtaIntensity, "auto">) {
  switch (ctaIntensity) {
    case "soft":
      return "Invite the next step gently, without pressure.";
    case "hard":
      return "Use a direct CTA with clear action and urgency only when the context supports it.";
    default:
      return "Use a clear CTA that is assertive without sounding pushy.";
  }
}

function getPostTypePlaybook(postType: string) {
  const key = normalizeKey(postType);

  if (key.includes("dor do cliente")) {
    return {
      copyGoal:
        "Lead with a pain the customer instantly recognizes and then pivot toward relief.",
      visualGoal:
        "Show the category pain in a plausible, product-led way instead of defaulting to a generic sad portrait.",
    };
  }

  if (key.includes("solucao") || key.includes("produto")) {
    return {
      copyGoal:
        "Position the brand as the practical solution and make the payoff obvious.",
      visualGoal:
        "Make the product or service the hero with cleaner framing and direct value communication.",
    };
  }

  if (key.includes("lancamento") || key.includes("novidade")) {
    return {
      copyGoal: "Sound new, sharp, and worth paying attention to right now.",
      visualGoal:
        "Create a launch moment with energy, reveal, and premium focus on the hero subject.",
    };
  }

  if (key.includes("oferta")) {
    return {
      copyGoal:
        "Communicate the offer fast and make the value immediately legible.",
      visualGoal:
        "Build a promotional piece with strong hierarchy, room for price or benefit, and instant readability.",
    };
  }

  if (key.includes("prova social") || key.includes("depoimento")) {
    return {
      copyGoal:
        "Build trust with believable proof, testimonial energy, or grounded result framing.",
      visualGoal:
        "Use warmth, trust cues, and a composition that feels credible rather than staged stock-photo happy.",
    };
  }

  if (key.includes("bastidores") || key.includes("founder")) {
    return {
      copyGoal:
        "Feel human and close to the brand without becoming diary-like or self-indulgent.",
      visualGoal:
        "Show a believable behind-the-scenes moment with warmth and brand intimacy.",
    };
  }

  if (key.includes("antes") || key.includes("depois")) {
    return {
      copyGoal: "Make the transformation obvious and easy to compare.",
      visualGoal:
        "Use side-by-side comparison or clear transformation cues without clutter.",
    };
  }

  if (key.includes("numero") || key.includes("resultado")) {
    return {
      copyGoal: "Anchor the idea on one meaningful number or measurable outcome.",
      visualGoal:
        "Make the number the hero with data-led clarity and premium polish.",
    };
  }

  if (key.includes("pergunta") || key.includes("enquete")) {
    return {
      copyGoal:
        "Spark curiosity and mental participation with one sharp question.",
      visualGoal:
        "Use a bold but minimal composition that makes the question feel intentional.",
    };
  }

  if (key.includes("dica") || key.includes("tutorial")) {
    return {
      copyGoal: "Teach one useful thing clearly and fast.",
      visualGoal:
        "Bias toward clarity, callouts, demonstration, or simple step-based composition.",
    };
  }

  if (key.includes("mito")) {
    return {
      copyGoal: "Create contrast between the wrong belief and the better answer.",
      visualGoal:
        "Show duality, contrast, or split composition that helps the idea land instantly.",
    };
  }

  if (key.includes("citacao") || key.includes("inspiracional")) {
    return {
      copyGoal: "Deliver one memorable line with emotional resonance and restraint.",
      visualGoal:
        "Make typography and atmosphere do the work with premium restraint.",
    };
  }

  if (key.includes("cta") || key.includes("oferta direta")) {
    return {
      copyGoal:
        "Be direct, commercial, and explicit about the desired next action.",
      visualGoal:
        "Single-minded conversion piece with one obvious action zone and strong hierarchy.",
    };
  }

  if (key.includes("evento") || key.includes("webinar")) {
    return {
      copyGoal:
        "Explain the event quickly and make attendance feel worthwhile.",
      visualGoal:
        "Create an announcement layout with clear date/time hierarchy and polished organization.",
    };
  }

  return {
    copyGoal:
      "Create a strong branded social post aligned to the product category and post goal.",
    visualGoal:
      "Compose the image so the message is readable fast and the piece feels intentionally designed.",
  };
}

function getImageStylePlaybook(imageStyle: string) {
  const key = normalizeKey(imageStyle);

  if (key.includes("canva")) {
    return "Clean, modern commercial aesthetic. Focus on beautiful, realistic product photography with vibrant brand colors. Create natural negative space for typography. The product must look real, high-quality, and appetizing. DO NOT overcomplicate the composition with random graphic shapes or complex banners.";
  }
  if (key.includes("fotografico") || key.includes("realista")) {
    return "Photorealistic materials, believable depth, professional lighting, and natural detail.";
  }
  if (key.includes("dark")) {
    return "Dark premium mood, near-black surfaces, controlled glow, and rich contrast.";
  }
  if (key.includes("gradiente")) {
    return "Gradient-led composition with modern energy and clean motion-inspired accents.";
  }
  if (key.includes("minimalista") || key.includes("clean")) {
    return "Minimal composition, fewer elements, clean negative space, and premium restraint.";
  }
  if (key.includes("cinematografico") || key.includes("estudio")) {
    return "Studio-grade hero lighting, cinematic depth, premium highlights, and precise framing.";
  }
  if (key.includes("neon") || key.includes("futurista")) {
    return "Futuristic mood with luminous accents, glossy materials, and deliberate digital drama.";
  }

  return "Polished branded visual with strong hierarchy and premium finish.";
}

function getProductVisualGuidance(productType: string) {
  switch (normalizeProductType(productType)) {
    case "saas":
      return "Show utility, workflow, interface fragments, or digital clarity. Avoid fake dashboard gibberish and generic corporate stock scenes.";
    case "ecommerce":
      return "Show the product clearly with retail polish, packaging cues, and a conversion-friendly hero composition.";
    case "food":
      return "Keep the food appetizing, believable, and texture-rich. The product should be the hero, not a prop inside a phone mockup.";
    case "service":
      return "Show outcome, expert-led context, or believable customer interaction rather than abstract business imagery.";
    default:
      return "Show a believable hero subject tied to the brand's actual offer.";
  }
}

function getAssetContext(selectedAssets: AssetReference[]) {
  if (!selectedAssets.length) {
    return {
      text: "No reference assets are attached.",
      hasAssets: false,
    };
  }

  const assetList = selectedAssets
    .map((asset, index) => {
      const label = asset.filename || `asset-${index + 1}`;
      const type = asset.type || "reference";
      return `- Asset ${index + 1}: ${label} (${type})`;
    })
    .join("\n");

  return {
    text: `Reference assets are attached and should affect the creative direction.\n${assetList}`,
    hasAssets: true,
  };
}

function getStyleSafetyRules({
  imageStyle,
  productType,
  postType,
}: {
  imageStyle: string;
  productType: string;
  postType: string;
}) {
  const styleKey = normalizeKey(imageStyle);
  const productKey = normalizeProductType(productType);
  const postKey = normalizeKey(postType);
  const rules: string[] = [];

  if (styleKey.includes("canva")) {
    rules.push(
      "Generate a high-quality product photo with clean negative space for text overlays, rather than cluttered graphic design templates.",
    );
    rules.push(
      "Never use phones, tablets, browser windows, wall posters, or social app screenshots as the main framing device.",
    );
  }

  rules.push(
    "Never use placeholder branding such as BRAND, LOGO, lorem ipsum, fake website UI, or generic badge text.",
  );

  if (productKey === "food") {
    rules.push(
      "Keep the food product as the hero and make it look craveable, believable, and high quality.",
    );
    rules.push(
      "Do not show deformed, parody, bitten-with-a-face, or novelty versions of the food unless humor was explicitly requested.",
    );
  }

  if (productKey === "food" && postKey.includes("dor do cliente")) {
    rules.push(
      "Show the pain through bad quality, artificial look, poor texture, or disappointing presentation instead of a sad person holding food.",
    );
  }

  if (productKey === "saas") {
    rules.push(
      "Do not rely on random glowing UI panels or meaningless futuristic dashboards.",
    );
  }

  return rules;
}

function formatLayout(format: string) {
  const key = normalizeKey(format);

  if (key.includes("story") || key.includes("1920")) {
    return "vertical Instagram story or reel cover layout";
  }

  if (key.includes("feed") || key.includes("1080x1080")) {
    return "square Instagram feed layout";
  }

  return "social media layout";
}

function quoteText(value?: string | null) {
  return (value || "").replace(/"/g, '\\"').trim();
}

function buildBrandContextBlock(brand: any) {
  const productType = normalizeProductType(brand.product_type);
  return `- Brand name: ${brand.name}
- Product type: ${productType}
- Tone of voice: ${brand.tone || "natural"}
- Target audience: ${brand.target_audience || "Not specified"}
- Value proposition: ${brand.value_proposition || "Not specified"}
- Key pain: ${brand.key_pain || "Not specified"}
- Description: ${brand.description || "Not specified"}
- Headlines from site: ${brand.headlines || "None"}
- Body text from site: ${brand.body_text || "None"}
- Keywords: ${brand.keywords?.join(", ") || "None"}
- Primary color mood: ${hexToColorName(brand.primary_color || "#000000")}
- Secondary color mood: ${hexToColorName(brand.secondary_color || "#ffffff")}
- Language: ${brand.language || "pt-BR"}
- Brand emoji signal: ${brand.emoji_style || "unknown"}
- Available proof (use only this, never invent proof): ${brand.prova_disponivel || "Not specified"}
- Claim restrictions (never fabricate these): ${brand.claim_restrictions || "Not specified"}`;
}

export async function fetchImageData(url: string) {
  if (url.startsWith("data:")) {
    const [metadata, data] = url.split(",");
    const mimeType = metadata.match(/data:(.*?);base64/)?.[1] || "image/png";
    return { base64: data, mimeType };
  }

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 15000,
  });

  const mimeType =
    response.headers["content-type"]?.split(";")[0] || "image/png";

  return {
    base64: Buffer.from(response.data).toString("base64"),
    mimeType,
  };
}

export async function buildAssetParts(
  selectedAssets: AssetReference[],
  maxAssets = 3,
) {
  const limitedAssets = selectedAssets.slice(0, maxAssets);
  return Promise.all(
    limitedAssets.map(async (asset) => {
      const { base64, mimeType } = await fetchImageData(asset.url);
      return createPartFromBase64(base64, mimeType);
    }),
  );
}

export function buildStrategyPrompt({
  brand,
  postType,
  format,
  imageStyle,
  includeText,
  selectedAssets,
  marketerPreferences,
}: {
  brand: any;
  postType: string;
  format: string;
  imageStyle: string;
  includeText: boolean;
  selectedAssets: AssetReference[];
  marketerPreferences?: Partial<MarketerPreferences> | null;
}) {
  const preferences = normalizeMarketerPreferences(marketerPreferences);
  const productType = normalizeProductType(brand.product_type);
  const resolvedObjective = resolveObjective(preferences.objective, postType);
  const copyApproach = resolveCopyApproach(resolvedObjective, postType);
  const captionBlueprint = resolveCaptionBlueprint(
    resolvedObjective,
    postType,
    copyApproach,
  );
  const ctaIntensity = resolveCtaIntensity(
    preferences.ctaIntensity,
    resolvedObjective,
  );
  const emojiPolicy = resolveEmojiUsage(
    preferences.emojiUsage,
    brand.emoji_style,
    productType,
  );
  const assetContext = getAssetContext(selectedAssets);
  const postTypePlaybook = getPostTypePlaybook(postType);

  const fewShotExamples = getFewShotExamples(productType, postType);
  const fewShotBlock =
    fewShotExamples.length > 0
      ? `\n<few_shot_examples>\n${fewShotExamples
          .map(
            (ex, i) =>
              `<example index="${i + 1}">\n` +
              `  <angle>${ex.angle}</angle>\n` +
              `  <hook_snippet>${ex.hook.split(" ").slice(0, 25).join(" ")}${ex.hook.split(" ").length > 25 ? "…" : ""}</hook_snippet>\n` +
              `  <image_text>${ex.imageText}</image_text>\n` +
              `</example>`,
          )
          .join("\n")}\n</few_shot_examples>`
      : "";

  return `<role>
You are a senior Brazilian creative strategist for social media brands.
</role>

<goal>
Build the creative strategy before any final copy or image prompt is written.
</goal>

<brand_context>
${buildBrandContextBlock(brand)}
</brand_context>

<post_context>
- Post type: ${postType}
- Format: ${format}
- Layout type: ${formatLayout(format)}
- Image style request: ${imageStyle}
- Product visual guidance: ${getProductVisualGuidance(productType)}
- Post copy goal: ${postTypePlaybook.copyGoal}
- Post visual goal: ${postTypePlaybook.visualGoal}
- Requested objective: ${preferences.objective}
- Resolved objective: ${resolvedObjective}
- Objective guidance: ${getObjectiveGuidance(resolvedObjective)}
- Resolved copy approach: ${copyApproach}
- Copy approach guidance: ${getCopyApproachGuidance(copyApproach)}
- Resolved caption blueprint: ${captionBlueprint}
- Caption guidance: ${getCaptionBlueprintGuidance(captionBlueprint)}
- Resolved CTA intensity: ${ctaIntensity}
- CTA guidance: ${getCtaGuidance(ctaIntensity)}
- Tone guidance: ${getToneGuidance(preferences.toneOverride, brand.tone)}
- Emoji policy: ${emojiPolicy}
- Emoji guidance: ${getEmojiGuidance(emojiPolicy)}
- Include text in image: ${includeText ? "yes" : "no"}
- Extra notes from marketer: ${preferences.creativeNotes || "None"}
- Manual angle override: ${preferences.angleOverride || "None"}
</post_context>

<asset_context>
${assetContext.text}
</asset_context>
${preferences.campaignBrief ? `
<campaign_brief priority="high">
  The user described exactly what they want to post (in their own words):
  "${preferences.campaignBrief}"

  IMPORTANT: Parse this brief carefully. Extract:
  - The specific product(s), price(s), dates, promotions, or bundles mentioned
  - The implied post type (e.g., "promoção/oferta" → Oferta relâmpago or CTA direta)
  - Use these specifics as ground truth for copy — do NOT invent prices or details not mentioned
  - The post type selected in the UI (${postType}) is a soft suggestion; override it if the brief clearly implies a different type
</campaign_brief>
` : ""}${fewShotBlock}
<rules>
- Think like a strategist, not a copy generator.
${preferences.campaignBrief ? `- IMPORTANT: A campaign brief was provided. Use the exact products, prices, dates, and bundles mentioned in it as the foundation for the strategy.\n` : ""}${preferences.angleOverride ? `- IMPORTANT: The marketer has manually specified an angle. Use it as the angle for this post exactly as written: "${preferences.angleOverride}"` : "- The angle must feel like something a good Brazilian marketer would intentionally choose."}
- Avoid generic AI logic, fake urgency, fake proof, and placeholder thinking.
- If assets are attached, let them affect the strategy instead of ignoring them.
- If the product type is food, avoid turning the concept into a sad portrait by default.
- If include text in image is false, imageText must be an empty string.
- If include text in image is true, imageText must be short, easy to read, and suitable for on-image typography.
</rules>

<output_format>
Return valid JSON only with:
- objective
- angle
- copyApproach
- captionBlueprint
- emotionalVector
- rationale
- imageText
</output_format>`;
}

export function buildCopyPrompt({
  brand,
  postType,
  includeText,
  strategy,
  marketerPreferences,
}: {
  brand: any;
  postType: string;
  includeText: boolean;
  strategy: StrategyPlan;
  marketerPreferences?: Partial<MarketerPreferences> | null;
}) {
  const preferences = normalizeMarketerPreferences(marketerPreferences);
  const productType = normalizeProductType(brand.product_type);
  const emojiPolicy = resolveEmojiUsage(
    preferences.emojiUsage,
    brand.emoji_style,
    productType,
  );
  const captionBlueprint =
    (normalizeKey(strategy.captionBlueprint) as CaptionBlueprint) || "medium";
  const captionLimit = getCaptionCharacterLimit(captionBlueprint);
  const hookLimit = includeText ? "max 6 words" : "max 10 words";
  const strategyObjective =
    (normalizeKey(strategy.objective) as Exclude<PostObjective, "auto">) ||
    resolveObjective(preferences.objective, postType);

  return `<role>
You are a senior Brazilian copywriter focused on real social media publishing.
</role>

<goal>
Write final PT-BR copy based on the approved strategy.
</goal>

<brand_context>
${buildBrandContextBlock(brand)}
</brand_context>

<strategy>
- Objective: ${strategy.objective}
- Angle: ${strategy.angle}
- Copy approach: ${strategy.copyApproach}
- Caption blueprint: ${strategy.captionBlueprint}
- Emotional vector: ${strategy.emotionalVector}
- Rationale: ${strategy.rationale}
- Image text: ${strategy.imageText || "None"}
</strategy>

<post_context>
- Post type: ${postType}
- Tone guidance: ${getToneGuidance(preferences.toneOverride, brand.tone)}
- Emoji policy: ${emojiPolicy}
- Emoji guidance: ${getEmojiGuidance(emojiPolicy)}
- CTA guidance: ${getCtaGuidance(
    resolveCtaIntensity(preferences.ctaIntensity, strategyObjective),
  )}
- Extra notes from marketer: ${preferences.creativeNotes || "None"}
${preferences.campaignBrief ? `- Campaign brief (user's own words): "${preferences.campaignBrief}"` : ""}
</post_context>

<rules>
- Write in natural PT-BR unless the brand language clearly says otherwise.
- Do not invent prices, discounts, numbers, claims, awards, deadlines, testimonials, or guarantees.
${preferences.campaignBrief ? `- IMPORTANT: A campaign brief was provided. Use the exact prices, products, dates, and bundles from it — do NOT paraphrase or generalize these specifics.` : ""}
- Do not default to emojis or storytelling unless the strategy supports it.
- Avoid generic AI phrases, hollow inspiration, and translated-English marketing tone.
- Hook: ${hookLimit}.
- Caption: max ${captionLimit} characters, with natural line breaks when helpful.
- CTA: one short line.
- Hashtags: 5 to 8 relevant hashtags as a single string, no emojis, no ultra-generic filler.
- If imageText exists, keep the hook and caption coherent with it, but do not force them to be identical.
</rules>

<output_format>
Return valid JSON only with:
- hook
- caption
- cta
- hashtags
</output_format>`;
}

export function buildVisualBriefPrompt({
  brand,
  postType,
  format,
  imageStyle,
  imageModelType,
  selectedAssets,
  strategy,
  copy,
}: {
  brand: any;
  postType: string;
  format: string;
  imageStyle: string;
  imageModelType: ImageModelType;
  selectedAssets: AssetReference[];
  strategy: StrategyPlan;
  copy: {
    hook: string;
    caption: string;
    cta: string;
    hashtags: string;
  };
}) {
  const productType = normalizeProductType(brand.product_type);
  const postTypePlaybook = getPostTypePlaybook(postType);
  const assetContext = getAssetContext(selectedAssets);
  const styleSafetyRules = getStyleSafetyRules({
    imageStyle,
    productType,
    postType,
  });
  const modelRecommendation =
    assetContext.hasAssets ? "nanoBanana" : imageModelType;

  return `<role>
You are a senior art director for performance creative and brand social design.
</role>

<goal>
Turn the approved strategy and copy into a strong visual brief for image generation.
</goal>

<brand_context>
${buildBrandContextBlock(brand)}
</brand_context>

<strategy>
- Objective: ${strategy.objective}
- Angle: ${strategy.angle}
- Emotional vector: ${strategy.emotionalVector}
- Rationale: ${strategy.rationale}
- Image text: ${strategy.imageText || "None"}
</strategy>

<copy>
- Hook: ${copy.hook}
- Caption: ${copy.caption}
- CTA: ${copy.cta}
</copy>

<visual_context>
- Post type: ${postType}
- Format: ${format}
- Layout type: ${formatLayout(format)}
- Requested style: ${imageStyle}
- Style playbook: ${getImageStylePlaybook(imageStyle)}
- Product visual guidance: ${getProductVisualGuidance(productType)}
- Post visual goal: ${postTypePlaybook.visualGoal}
- Recommended execution model: ${modelRecommendation}
</visual_context>

<asset_context>
${assetContext.text}
</asset_context>

<rules>
- Keep all fields short, maximum 1-2 sentences. Image generation models need concise, visual prompts, not complex design instructions.
- Prioritize stunning, photorealistic product visibility over layered graphic design layouts.
- Do NOT describe complex graphic templates (like split screens, multiple badges, or UI). Image models fail at graphic design. Keep the composition simple: great product, great lighting, and natural blank space for text.
- If assets are attached, preserve the real product identity and let the product stay recognizable as the absolute hero without being distorted by heavy graphic overlays.
- If image text exists, the textTreatment must support exactly that text but keep it clean and integrated seamlessly without asking for complex banners.
- Never propose placeholder branding, fake website chrome, or random UI filler.
- Avoid generic sad portraits for pain-point posts unless the marketer explicitly asked for that route.
- Follow these safety rules:
${styleSafetyRules.map((rule) => `- ${rule}`).join("\n")}
</rules>

<output_format>
Return valid JSON only with:
- modelRecommendation
- visualGoal
- composition
- layout
- background
- productRole
- textTreatment
- avoid (array of short strings)
</output_format>`;
}

export function buildImagePromptFromBrief({
  brand,
  format,
  imageStyle,
  imageModelType,
  includeText,
  selectedAssets,
  strategy,
  copy,
  visualBrief,
}: {
  brand: any;
  format: string;
  imageStyle: string;
  imageModelType: ImageModelType;
  includeText: boolean;
  selectedAssets: AssetReference[];
  strategy: StrategyPlan;
  copy: {
    hook: string;
    cta: string;
  };
  visualBrief: VisualBrief;
}) {
  const layout = formatLayout(format);
  const productType = normalizeProductType(brand.product_type);
  const exactText = includeText
    ? quoteText(strategy.imageText || copy.hook)
    : "";
  const avoidList = [...visualBrief.avoid];
  const styleSafetyRules = getStyleSafetyRules({
    imageStyle,
    productType,
    postType: strategy.angle,
  });

  styleSafetyRules.forEach((rule) => {
    if (!avoidList.includes(rule)) {
      avoidList.push(rule);
    }
  });

  const intro =
    selectedAssets.length > 0 && imageModelType === "nanoBanana"
      ? "Use the attached reference images as the absolute source of truth for the real product. Preserve recognizable shape, materials, and product identity."
      : "Create a high-quality product photo or backdrop ready for social media overlays.";

  const textRule = includeText
    ? `Render exactly this PT-BR text in the artwork: "${exactText}". Keep it very simple, bold, and fully legible without cluttering the image with UI badges.`
    : "Do not render any text, letters, captions, or typography in the image. Keep it purely visual.";

  const prompt = `${intro}
Layout: ${layout}.
Visual goal: ${visualBrief.visualGoal}
Composition: ${visualBrief.composition}
Background: ${visualBrief.background}
Product role: ${visualBrief.productRole}
${includeText ? `Text treatment: ${visualBrief.textTreatment}` : ""}
Style guidance: ${getImageStylePlaybook(imageStyle)}
Product guidance: ${getProductVisualGuidance(productType)}
Brand color mood: ${hexToColorName(brand.primary_color || "#000000")} and ${hexToColorName(brand.secondary_color || "#ffffff")}
Creative angle: ${strategy.angle}
Emotional vector: ${strategy.emotionalVector}
${textRule}
Final note: Result must look like an ultra-premium photograph or render, not a cheap AI collage.
Avoid: ${avoidList.join(", ")}, cluttered layouts, unnecessary UI elements.`;

  return prompt.replace(/\s+/g, " ").trim();
}

export function buildCriticPrompt({
  brand,
  strategy,
  copy,
  visualBrief,
  imagePrompt,
}: {
  brand: any;
  strategy: StrategyPlan;
  copy: {
    hook: string;
    caption: string;
    cta: string;
    hashtags: string;
  };
  visualBrief: VisualBrief;
  imagePrompt: string;
}) {
  return `<role>
You are a creative director reviewing AI-generated marketing work for a Brazilian brand.
</role>

<goal>
Score the creative package before it ships.
</goal>

<brand_context>
${buildBrandContextBlock(brand)}
</brand_context>

<creative_package>
- Strategy objective: ${strategy.objective}
- Strategy angle: ${strategy.angle}
- Strategy rationale: ${strategy.rationale}
- Hook: ${copy.hook}
- Caption: ${copy.caption}
- CTA: ${copy.cta}
- Hashtags: ${copy.hashtags}
- Visual goal: ${visualBrief.visualGoal}
- Composition: ${visualBrief.composition}
- Layout: ${visualBrief.layout}
- Background: ${visualBrief.background}
- Product role: ${visualBrief.productRole}
- Text treatment: ${visualBrief.textTreatment}
- Avoid list: ${visualBrief.avoid.join(", ")}
- Final image prompt: ${imagePrompt}
</creative_package>

<rules>
- Give scores from 0 to 10.
- Penalize placeholder branding, generic AI thinking, fabricated proof, weak category fit, and translated-English tone.
- Evaluate whether this feels like something a solid Brazilian marketing team would actually publish.
- notes must be short, practical, and in PT-BR.
- verdict should be a short PT-BR summary.
- recommendedFix should be the single most important fix if the piece feels weak.
</rules>

<output_format>
Return valid JSON only with:
- overallScore
- brandFit
- categoryFit
- clarity
- originality
- conversionReadiness
- aiSlopRisk
- verdict
- recommendedFix
- notes
</output_format>`;
}

export function buildRegenerationPrompt({
  field,
  brand,
  postType,
  format,
  imageStyle,
  includeText,
  imageModelType,
  selectedAssets,
  currentContent,
  marketerPreferences,
}: {
  field: string;
  brand: any;
  postType: string;
  format: string;
  imageStyle: string;
  includeText: boolean;
  imageModelType: ImageModelType;
  selectedAssets: AssetReference[];
  currentContent: Record<string, any>;
  marketerPreferences?: Partial<MarketerPreferences> | null;
}) {
  const preferences = normalizeMarketerPreferences(marketerPreferences);
  const resolvedObjective = resolveObjective(preferences.objective, postType);
  const emojiPolicy = resolveEmojiUsage(
    preferences.emojiUsage,
    brand.emoji_style,
    brand.product_type,
  );
  const assetContext = getAssetContext(selectedAssets);
  const currentStrategy = currentContent.strategy
    ? JSON.stringify(currentContent.strategy)
    : "No structured strategy available.";
  const currentVisualBrief = currentContent.visual_brief
    ? JSON.stringify(currentContent.visual_brief)
    : "No structured visual brief available.";
  const imageText = currentContent.image_text || currentContent.hook || "";
  const styleSafetyRules = getStyleSafetyRules({
    imageStyle,
    productType: brand.product_type,
    postType,
  });

  const fieldLabel: Record<string, string> = {
    hook: includeText ? "hook in PT-BR, max 6 words" : "hook in PT-BR, max 10 words",
    caption: "caption in PT-BR with stronger polish and clarity",
    cta: "one-line CTA in PT-BR",
    hashtags: "5 to 8 relevant hashtags in one string with no emojis",
    image_prompt: `English image prompt for the ${imageModelType} workflow`,
  };

  return `<role>
You are refining one approved field of a Brazilian social post.
</role>

<goal>
Regenerate only the requested field while keeping the rest of the creative direction coherent.
</goal>

<brand_context>
${buildBrandContextBlock(brand)}
</brand_context>

<post_context>
- Post type: ${postType}
- Objective: ${resolvedObjective}
- Format: ${format}
- Image style: ${imageStyle}
- Selected image workflow: ${imageModelType}
- Tone guidance: ${getToneGuidance(preferences.toneOverride, brand.tone)}
- Emoji policy: ${emojiPolicy}
- CTA guidance: ${getCtaGuidance(
    resolveCtaIntensity(preferences.ctaIntensity, resolvedObjective),
  )}
- Extra notes: ${preferences.creativeNotes || "None"}
</post_context>

<asset_context>
${assetContext.text}
</asset_context>

<current_content>
- Hook: ${currentContent.hook || ""}
- Caption: ${currentContent.caption || ""}
- CTA: ${currentContent.cta || ""}
- Hashtags: ${currentContent.hashtags || ""}
- Image text: ${imageText}
- Current image prompt: ${currentContent.image_prompt || ""}
- Strategy JSON: ${currentStrategy}
- Visual brief JSON: ${currentVisualBrief}
</current_content>

<rules>
- Return valid JSON only with the key "${field}".
- Regenerate only the ${fieldLabel[field] || field}.
- Keep the brand, strategy, and category fit coherent.
- Make the new version materially different from the current one.
- Do not invent prices, discounts, claims, fake proof, or placeholder branding.
- If field is image_prompt and includeText is true, render exactly this text in the image: "${quoteText(
    imageText,
  )}".
- If field is image_prompt and includeText is false, explicitly forbid text in the image.
- If field is image_prompt and assets exist, preserve the real product identity from the attached references.
- Follow these style safety rules:
${styleSafetyRules.map((rule) => `- ${rule}`).join("\n")}
</rules>`;
}

// ─── Gemini response schemas ──────────────────────────────────────────────────

export const strategySchema = {
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

export const copySchema = {
  type: Type.OBJECT,
  properties: {
    hook: { type: Type.STRING },
    caption: { type: Type.STRING },
    cta: { type: Type.STRING },
    hashtags: { type: Type.STRING },
  },
  required: ["hook", "caption", "cta", "hashtags"],
};

export const visualBriefSchema = {
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

export const criticSchema = {
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
