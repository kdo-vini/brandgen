import axios from "axios";
import { createPartFromBase64 } from "@google/genai";
import {
  normalizeMarketerPreferences,
  type CaptionStyle,
  type CopyApproach,
  type CtaIntensity,
  type EmojiUsage,
  type MarketerPreferences,
  type ToneOverride,
} from "./src/lib/marketerControls";

export type ImageModelType = "imagen" | "nanoBanana";

export type AssetReference = {
  id?: string;
  url: string;
  filename?: string | null;
  type?: string | null;
};

export const IMAGEN_NEGATIVE_PROMPT =
  "phone mockup, browser chrome, extra borders, duplicated products, floating text blocks, long paragraphs, unreadable typography, warped letters, clipart, cartoon icons, low detail, blurry subject, distorted hands, cropped product, cut off packaging";

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
    [
      "saas",
      "sistema",
      "system",
      "software",
      "app",
      "platform",
    ].includes(normalized)
  ) {
    return "saas";
  }

  if (
    ["ecommerce", "e-commerce", "loja", "store", "shop"].includes(
      normalized,
    )
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

export function hexToColorName(hex: string): string {
  const cleanHex = hex.replace("#", "");
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

export function getPostTypePlaybook(postType: string) {
  const key = normalizeKey(postType);

  if (key.includes("dor do cliente")) {
    return {
      copyGoal:
        "Lead with the pain and name a problem the customer instantly recognizes.",
      visualGoal:
        "Build tension first: a before-state, frustration, contrast, emotional clarity, and a visible problem scenario.",
      ctaStyle:
        "Invite the user to escape the pain with a practical next step.",
    };
  }

  if (key.includes("solucao") || key.includes("produto")) {
    return {
      copyGoal:
        "Position the brand as the practical solution and make the transformation obvious.",
      visualGoal:
        "Make the product or service the hero, clean framing, brighter lighting, and clear value demonstration.",
      ctaStyle:
        "Push the audience toward trying, booking, or exploring the solution.",
    };
  }

  if (key.includes("lancamento") || key.includes("novidade")) {
    return {
      copyGoal: "Sound new, energetic, and worth paying attention to now.",
      visualGoal:
        "Launch energy, bold focal point, movement, reveal moment, and premium excitement.",
      ctaStyle: "Use urgency and novelty to drive immediate action.",
    };
  }

  if (key.includes("oferta relampago")) {
    return {
      copyGoal:
        "Communicate the offer fast and make the user feel the clock ticking.",
      visualGoal:
        "High contrast promo composition with room for one short offer headline and a strong urgency cue.",
      ctaStyle: "Use a direct CTA with time pressure.",
    };
  }

  if (key.includes("prova social") || key.includes("depoimento")) {
    return {
      copyGoal: "Build trust with a real result, quote, or customer win.",
      visualGoal:
        "Warm, human, trustworthy portrait or testimonial-led composition with social proof cues.",
      ctaStyle: "Invite the audience to trust the brand or see similar results.",
    };
  }

  if (key.includes("bastidores") || key.includes("founder")) {
    return {
      copyGoal: "Feel human, authentic, and founder-close.",
      visualGoal:
        "Behind-the-scenes realism, candid atmosphere, workspace or production context, and lifestyle warmth.",
      ctaStyle: "Invite conversation, connection, or a softer conversion step.",
    };
  }

  if (key.includes("antes") || key.includes("depois")) {
    return {
      copyGoal: "Make the transformation unmistakable.",
      visualGoal:
        "Two-state storytelling with a clear before/after contrast and balanced comparison layout.",
      ctaStyle: "Prompt the user to imagine their own transformation.",
    };
  }

  if (key.includes("numero") || key.includes("resultado")) {
    return {
      copyGoal: "Anchor the post on one impressive number or measurable outcome.",
      visualGoal:
        "Make the number the hero, with a data-led composition, clarity, trust, and premium polish.",
      ctaStyle: "Invite the audience to learn how to achieve the same result.",
    };
  }

  if (key.includes("pergunta") || key.includes("enquete")) {
    return {
      copyGoal: "Spark curiosity and make the audience answer mentally.",
      visualGoal:
        "Minimal but intriguing composition that supports one bold question and a conversational tone.",
      ctaStyle: "Ask for a reply, opinion, or DM.",
    };
  }

  if (key.includes("dica") || key.includes("tutorial")) {
    return {
      copyGoal: "Teach one useful thing clearly and fast.",
      visualGoal:
        "Instructional layout, educational clarity, callouts, arrows, steps, or a demonstrative setup.",
      ctaStyle: "Invite the audience to save, share, or apply the tip.",
    };
  }

  if (key.includes("mito")) {
    return {
      copyGoal: "Create contrast between a wrong belief and the correct answer.",
      visualGoal:
        "Duality composition with visible contrast between myth and truth sides.",
      ctaStyle: "Push the audience to rethink the topic or learn more.",
    };
  }

  if (key.includes("citacao") || key.includes("inspiracional")) {
    return {
      copyGoal: "Deliver one memorable line with emotional resonance.",
      visualGoal:
        "Typography-led composition with atmosphere, texture, softness, and premium restraint.",
      ctaStyle: "Use a light CTA, usually save, share, or follow.",
    };
  }

  if (key.includes("cta") || key.includes("oferta direta")) {
    return {
      copyGoal: "Be direct, commercial, and very clear about the next action.",
      visualGoal:
        "Single-minded conversion piece with strong focal hierarchy and one obvious action zone.",
      ctaStyle: "Use a hard CTA with low ambiguity.",
    };
  }

  if (key.includes("evento") || key.includes("webinar")) {
    return {
      copyGoal: "Explain the event and make the signup feel worthwhile.",
      visualGoal:
        "Structured announcement layout with date/time hierarchy and a polished event feel.",
      ctaStyle: "Drive registration or attendance.",
    };
  }

  return {
    copyGoal:
      "Create a sharp Instagram post aligned to the brand and the funnel stage.",
    visualGoal:
      "Compose the image so the message is instantly readable and visually premium.",
    ctaStyle: "Use a CTA that matches the content and audience intent.",
  };
}

export function getImageStylePlaybook(imageStyle: string) {
  const key = normalizeKey(imageStyle);

  if (key.includes("canva")) {
    return "Premium social design, polished hierarchy, clean brand blocks, smart spacing, and a layout that feels publish-ready.";
  }
  if (key.includes("fotografico") || key.includes("realista")) {
    return "Photorealistic image, believable materials, professional lighting, real-world textures, and natural depth.";
  }
  if (key.includes("dark")) {
    return "Dark premium aesthetic, near-black surfaces, controlled glow, rich contrast, and a cinematic luxury finish.";
  }
  if (key.includes("gradiente")) {
    return "Bold gradient-led composition, energetic color transitions, smooth lighting, and modern motion-inspired shapes.";
  }
  if (key.includes("minimalista") || key.includes("clean")) {
    return "Minimal composition, fewer elements, strong negative space, clean hierarchy, and premium restraint.";
  }
  if (key.includes("cinematografico") || key.includes("estudio")) {
    return "Studio-grade cinematic lighting, hero framing, premium highlights, mood, and lens-aware realism.";
  }
  if (key.includes("neon") || key.includes("futurista")) {
    return "Futuristic neon styling, luminous accents, glossy materials, moody contrast, and a high-end digital feel.";
  }

  return "Polished branded social visual with strong hierarchy and premium finish.";
}

export function getProductVisualGuidance(productType: string) {
  switch (normalizeProductType(productType)) {
    case "saas":
      return "Use interface, device, dashboard, workflow, or digital product metaphors when relevant. Avoid generic corporate stock scenes.";
    case "ecommerce":
      return "Show the product clearly, with retail polish, packaging cues, and a conversion-friendly hero composition.";
    case "food":
      return "Respect the actual food appearance, appetizing textures, believable ingredients, and strong product hero treatment.";
    case "service":
      return "Show outcome, transformation, expert-led context, or a believable customer interaction instead of abstract stock visuals.";
    default:
      return "Show a believable hero subject tied to the brand's real offer.";
  }
}

export function getAssetContext(selectedAssets: AssetReference[]) {
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
    text: `Reference assets are attached. Inspect them carefully and use the real product details from the images.\n${assetList}`,
    hasAssets: true,
  };
}

function resolveCopyApproach(
  selectedApproach: CopyApproach,
  postType: string,
): CopyApproach {
  if (selectedApproach !== "auto") {
    return selectedApproach;
  }

  const key = normalizeKey(postType);

  if (key.includes("bastidores") || key.includes("founder")) {
    return "storytelling";
  }

  if (key.includes("dica") || key.includes("tutorial")) {
    return "educational";
  }

  if (
    key.includes("prova social") ||
    key.includes("depoimento") ||
    key.includes("numero") ||
    key.includes("resultado")
  ) {
    return "proof";
  }

  if (
    key.includes("pergunta") ||
    key.includes("enquete") ||
    key.includes("mito") ||
    key.includes("dor do cliente")
  ) {
    return "provocative";
  }

  return "direct";
}

function resolveCaptionStyle(
  selectedStyle: CaptionStyle,
  postType: string,
  copyApproach: CopyApproach,
): CaptionStyle {
  if (selectedStyle !== "auto") {
    return selectedStyle;
  }

  const key = normalizeKey(postType);

  if (copyApproach === "storytelling") {
    return "miniStory";
  }

  if (copyApproach === "educational") {
    return "list";
  }

  if (
    key.includes("oferta relampago") ||
    key.includes("cta") ||
    key.includes("oferta direta") ||
    key.includes("pergunta") ||
    key.includes("enquete")
  ) {
    return "short";
  }

  return "medium";
}

function resolveCtaIntensity(
  selectedIntensity: CtaIntensity,
  postType: string,
): CtaIntensity {
  if (selectedIntensity !== "auto") {
    return selectedIntensity;
  }

  const key = normalizeKey(postType);

  if (
    key.includes("oferta relampago") ||
    key.includes("cta") ||
    key.includes("oferta direta") ||
    key.includes("lancamento") ||
    key.includes("evento") ||
    key.includes("webinar")
  ) {
    return "hard";
  }

  if (
    key.includes("citacao") ||
    key.includes("inspiracional") ||
    key.includes("pergunta") ||
    key.includes("enquete") ||
    key.includes("bastidores")
  ) {
    return "soft";
  }

  return "medium";
}

function resolveEmojiUsage(
  selectedEmojiUsage: EmojiUsage,
  brandEmojiStyle?: string | null,
): EmojiUsage {
  if (selectedEmojiUsage !== "followBrand") {
    return selectedEmojiUsage;
  }

  const brandSignal = normalizeKey(brandEmojiStyle);
  if (brandSignal === "moderate" || brandSignal === "heavy") {
    return "moderate";
  }

  return "minimal";
}

function getCopyApproachGuidance(copyApproach: CopyApproach) {
  switch (copyApproach) {
    case "direct":
      return "Lead with the value fast, cut the warm-up, and keep every sentence pulling the reader toward the point.";
    case "storytelling":
      return "Open with a concrete moment or tension, then reveal the shift or payoff before landing the CTA.";
    case "educational":
      return "Teach one useful insight clearly, with strong logic, concrete takeaways, and easy scanning.";
    case "proof":
      return "Anchor the post in trust, evidence, results, or believable proof rather than abstract promises.";
    case "provocative":
      return "Use contrast, a sharp opinion, or a pattern interrupt that sparks curiosity without sounding like clickbait.";
    default:
      return "Choose the strongest structure for the post goal instead of defaulting to generic AI storytelling.";
  }
}

function getCopyApproachVisualGuidance(copyApproach: CopyApproach) {
  switch (copyApproach) {
    case "direct":
      return "Use a cleaner, conversion-first composition with one hero focal point and less narrative clutter.";
    case "storytelling":
      return "Show a scene with emotional context, a sense of moment, and visible before/after or tension/payoff cues.";
    case "educational":
      return "Bias toward instructional clarity, demonstration, callouts, and a layout that feels easy to understand at a glance.";
    case "proof":
      return "Prioritize trust cues, realism, testimonial energy, proof artifacts, and a grounded outcome-first visual.";
    case "provocative":
      return "Build contrast, tension, and pattern interruption with a bold focal choice and immediate visual curiosity.";
    default:
      return "Let the copy angle shape the composition so the visual feels purpose-built for this post.";
  }
}

function getToneGuidance(
  toneOverride: ToneOverride,
  brandTone?: string | null,
) {
  const baseTone = brandTone || "natural";

  switch (toneOverride) {
    case "casual":
      return `Sound closer, lighter, and more conversational than the base brand tone (${baseTone}), without becoming sloppy.`;
    case "premium":
      return `Sound more polished, restrained, and premium than the base brand tone (${baseTone}). Avoid hype, slang overload, and noisy punctuation.`;
    case "technical":
      return `Sound more precise, informed, and credibility-led than the base brand tone (${baseTone}). Prefer clarity over charm.`;
    case "sales":
      return `Sound more conversion-oriented than the base brand tone (${baseTone}), but stay truthful and avoid spammy sales cliches.`;
    default:
      return `Stay aligned to the brand's core tone (${baseTone}) while keeping it natural and publish-ready.`;
  }
}

function getEmojiGuidance(emojiUsage: EmojiUsage) {
  switch (emojiUsage) {
    case "none":
      return "Use zero emojis anywhere in the hook, caption, CTA, and hashtags.";
    case "minimal":
      return "Use at most one emoji in the full post package, and only if it genuinely improves tone or readability.";
    case "moderate":
      return "Use a few emojis only when natural, never stacked, never on every line, and never as filler.";
    default:
      return "Do not assume emojis are needed. Use them only when clearly helpful.";
  }
}

function getCaptionGuidance(captionStyle: CaptionStyle) {
  switch (captionStyle) {
    case "short":
      return "Keep the caption lean, punchy, and quick to read. One compact block or two short lines max.";
    case "medium":
      return "Use two short blocks with enough context to persuade without dragging.";
    case "miniStory":
      return "Structure the caption like a mini story: setup, tension, payoff, then CTA.";
    case "list":
      return "Make the caption highly scannable with short lines, bullets, or numbered steps when appropriate.";
    default:
      return "Choose the caption structure that best fits the post goal.";
  }
}

function getCaptionCharacterLimit(captionStyle: CaptionStyle) {
  switch (captionStyle) {
    case "short":
      return 220;
    case "miniStory":
      return 420;
    case "list":
      return 360;
    default:
      return 320;
  }
}

function getCtaGuidance(ctaIntensity: CtaIntensity) {
  switch (ctaIntensity) {
    case "soft":
      return "Use a low-pressure CTA that invites the next step without forcing urgency.";
    case "hard":
      return "Use a direct, conversion-first CTA with urgency only if the context truly supports it.";
    default:
      return "Use a clear CTA that is assertive but not pushy.";
  }
}

export function appendPromptGuardrails({
  prompt,
  hook,
  includeText,
  language,
  imageModelType,
  hasAssets,
}: {
  prompt: string;
  hook: string;
  includeText: boolean;
  language: string;
  imageModelType: ImageModelType;
  hasAssets: boolean;
}) {
  let finalPrompt = prompt.trim();

  if (includeText && hook) {
    finalPrompt += ` Render the exact headline text "${hook}" in ${language} with bold, clean, fully legible typography.`;
  } else {
    finalPrompt += " Do not render any text, letters, captions, or typography in the image.";
  }

  if (hasAssets && imageModelType === "nanoBanana") {
    finalPrompt +=
      " Use the attached reference image(s) as the source of truth for the product identity, preserving the real shape, materials, and recognizable details.";
  }

  return finalPrompt;
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

export function buildContentPrompt({
  brand,
  postType,
  postVisualHint,
  format,
  imageStyle,
  includeText,
  imageModelType,
  selectedAssets,
  marketerPreferences,
}: {
  brand: any;
  postType: string;
  postVisualHint?: string;
  format: string;
  imageStyle: string;
  includeText: boolean;
  imageModelType: ImageModelType;
  selectedAssets: AssetReference[];
  marketerPreferences?: Partial<MarketerPreferences> | null;
}) {
  const brandLanguage = brand.language || "pt-BR";
  const productType = normalizeProductType(brand.product_type);
  const postTypePlaybook = getPostTypePlaybook(postType);
  const stylePlaybook = getImageStylePlaybook(imageStyle);
  const productVisualGuidance = getProductVisualGuidance(productType);
  const assetContext = getAssetContext(selectedAssets);
  const normalizedPreferences =
    normalizeMarketerPreferences(marketerPreferences);
  const effectiveCopyApproach = resolveCopyApproach(
    normalizedPreferences.copyApproach,
    postType,
  );
  const effectiveCaptionStyle = resolveCaptionStyle(
    normalizedPreferences.captionStyle,
    postType,
    effectiveCopyApproach,
  );
  const effectiveCtaIntensity = resolveCtaIntensity(
    normalizedPreferences.ctaIntensity,
    postType,
  );
  const effectiveEmojiUsage = resolveEmojiUsage(
    normalizedPreferences.emojiUsage,
    brand.emoji_style,
  );
  const copyApproachGuidance = getCopyApproachGuidance(
    effectiveCopyApproach,
  );
  const copyApproachVisualGuidance = getCopyApproachVisualGuidance(
    effectiveCopyApproach,
  );
  const toneGuidance = getToneGuidance(
    normalizedPreferences.toneOverride,
    brand.tone,
  );
  const emojiGuidance = getEmojiGuidance(effectiveEmojiUsage);
  const captionGuidance = getCaptionGuidance(effectiveCaptionStyle);
  const captionCharacterLimit = getCaptionCharacterLimit(
    effectiveCaptionStyle,
  );
  const ctaGuidance = getCtaGuidance(effectiveCtaIntensity);
  const hookRule = includeText
    ? "max 5 words and short enough to render cleanly on-image"
    : "max 10 words";

  return `You are creating an Instagram post for a Brazilian brand. Return valid JSON only.

Brand kit:
- Name: ${brand.name}
- Product type: ${productType}
- Tone of voice: ${brand.tone}
- Target audience: ${brand.target_audience}
- Value proposition: ${brand.value_proposition}
- Key pain: ${brand.key_pain}
- Description: ${brand.description || ""}
- Headlines from site: ${brand.headlines || ""}
- Body text from site: ${brand.body_text || ""}
- Keywords: ${brand.keywords?.join(", ") || ""}
- Primary color: ${hexToColorName(brand.primary_color)}
- Secondary color: ${hexToColorName(brand.secondary_color)}
- Language: ${brandLanguage}
- Brand emoji signal from site scan: ${brand.emoji_style || "unknown"} (soft hint only)

Post brief:
- Post type: ${postType}
- Copy goal: ${postTypePlaybook.copyGoal}
- Visual goal: ${postTypePlaybook.visualGoal}
- CTA style: ${postTypePlaybook.ctaStyle}
- Post-specific visual hint: ${postVisualHint || "Adapt the composition to the post type."}
- Image style: ${imageStyle}
- Image style playbook: ${stylePlaybook}
- Product visual guidance: ${productVisualGuidance}
- Format: ${format}
- Model family for image prompt: ${imageModelType}

Marketing direction:
- Requested copy approach: ${normalizedPreferences.copyApproach}
- Effective copy approach for this post: ${effectiveCopyApproach}
- Copy approach guidance: ${copyApproachGuidance}
- Requested caption style: ${normalizedPreferences.captionStyle}
- Effective caption style: ${effectiveCaptionStyle}
- Caption guidance: ${captionGuidance}
- Requested CTA intensity: ${normalizedPreferences.ctaIntensity}
- Effective CTA intensity: ${effectiveCtaIntensity}
- CTA guidance: ${ctaGuidance}
- Requested tone override: ${normalizedPreferences.toneOverride}
- Tone guidance: ${toneGuidance}
- Requested emoji policy: ${normalizedPreferences.emojiUsage}
- Effective emoji policy: ${effectiveEmojiUsage}
- Emoji guidance: ${emojiGuidance}
- Extra notes from marketer: ${normalizedPreferences.creativeNotes || "None"}

Asset context:
${assetContext.text}

Return a JSON object with:
- hook: short first line in ${brandLanguage}, ${hookRule}
- caption: complete caption in ${brandLanguage}, max ${captionCharacterLimit} chars, with natural line breaks
- cta: one short CTA line in ${brandLanguage}
- hashtags: 8 to 10 relevant hashtags as a single string
- image_prompt: a detailed prompt in English for the image model

Rules:
1. The hook, caption, and CTA must sound natural for Brazilian social media unless the brand language is explicitly different.
2. ${
    includeText
      ? "If typography is included, the image_prompt must instruct the image model to render exactly the same hook text you generated."
      : "The image_prompt must explicitly forbid any text in the final image."
  }
3. The image_prompt must adapt the composition to the post type and style, not use a one-size-fits-all layout.
4. The image_prompt must describe subject, composition, background, lighting, depth, and finishing details.
5. The image must be the final post artwork, not a phone mockup, browser screenshot, or framed social preview.
6. Avoid clipart, cartoon icons, flat generic vectors, or fake dashboard gibberish.
7. Never include hex codes in the image_prompt.
8. ${
    assetContext.hasAssets && imageModelType === "nanoBanana"
      ? "Because reference assets are attached, write image_prompt as an edit/composite instruction that preserves the real product identity from the reference images while improving scene, styling, and layout."
      : "Write image_prompt as a text-to-image prompt."
  }
9. ${
    assetContext.hasAssets
      ? "When describing the product, use the actual product identity from the attached images instead of inventing a different item."
      : "Invent a scene that stays faithful to the brand and product type."
  }
10. If includeText is true, prefer one short headline zone only. Never ask for paragraphs of text inside the image.
11. Follow the marketer direction exactly. Do not default to storytelling, hype, or emojis unless the direction calls for it.
12. Avoid generic AI phrasing, empty buzzwords, repeated exclamation marks, and stacked emojis.
13. Do not invent discounts, deadlines, prices, statistics, testimonials, or guarantees unless they are present in the brand context or marketer notes.
14. If proof is weak, keep the copy qualitative and believable instead of fabricating specifics.
15. Let the copy approach shape the visual direction too: ${copyApproachVisualGuidance}
16. Keep hashtags relevant to the niche and offer. Avoid ultra-generic tags like #marketing or #success unless they are genuinely useful.
17. Do not put emojis in the hashtags string.`;
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
  currentContent: Record<string, string>;
  marketerPreferences?: Partial<MarketerPreferences> | null;
}) {
  const brandLanguage = brand.language || "pt-BR";
  const postTypePlaybook = getPostTypePlaybook(postType);
  const stylePlaybook = getImageStylePlaybook(imageStyle);
  const assetContext = getAssetContext(selectedAssets);
  const normalizedPreferences =
    normalizeMarketerPreferences(marketerPreferences);
  const effectiveCopyApproach = resolveCopyApproach(
    normalizedPreferences.copyApproach,
    postType,
  );
  const effectiveCaptionStyle = resolveCaptionStyle(
    normalizedPreferences.captionStyle,
    postType,
    effectiveCopyApproach,
  );
  const effectiveCtaIntensity = resolveCtaIntensity(
    normalizedPreferences.ctaIntensity,
    postType,
  );
  const effectiveEmojiUsage = resolveEmojiUsage(
    normalizedPreferences.emojiUsage,
    brand.emoji_style,
  );
  const fieldLabel: Record<string, string> = {
    hook: `hook in ${brandLanguage}, ${includeText ? "max 5 words and image-friendly" : "max 10 words"}`,
    caption: `caption in ${brandLanguage}, max ${getCaptionCharacterLimit(effectiveCaptionStyle)} chars`,
    cta: `one-line CTA in ${brandLanguage}`,
    hashtags: "8 to 10 relevant hashtags in one string, no emojis",
    image_prompt: "image prompt in English",
  };

  return `You are refining one field of an Instagram post. Return valid JSON only with the key "${field}".

Current approved content:
- Hook: ${currentContent.hook || ""}
- Caption: ${currentContent.caption || ""}
- CTA: ${currentContent.cta || ""}
- Hashtags: ${currentContent.hashtags || ""}

Context:
- Brand name: ${brand.name}
- Product type: ${normalizeProductType(brand.product_type)}
- Tone: ${brand.tone}
- Audience: ${brand.target_audience}
- Post type: ${postType}
- Copy goal: ${postTypePlaybook.copyGoal}
- Visual goal: ${postTypePlaybook.visualGoal}
- Format: ${format}
- Image style: ${imageStyle}
- Style playbook: ${stylePlaybook}
- Model family for image prompt: ${imageModelType}
- Effective copy approach: ${effectiveCopyApproach}
- Copy guidance: ${getCopyApproachGuidance(effectiveCopyApproach)}
- Effective caption style: ${effectiveCaptionStyle}
- Caption guidance: ${getCaptionGuidance(effectiveCaptionStyle)}
- Effective CTA intensity: ${effectiveCtaIntensity}
- CTA guidance: ${getCtaGuidance(effectiveCtaIntensity)}
- Tone guidance: ${getToneGuidance(normalizedPreferences.toneOverride, brand.tone)}
- Effective emoji policy: ${effectiveEmojiUsage}
- Emoji guidance: ${getEmojiGuidance(effectiveEmojiUsage)}
- Extra notes from marketer: ${normalizedPreferences.creativeNotes || "None"}

Asset context:
${assetContext.text}

Regenerate only the ${fieldLabel[field] || field}.

Rules:
1. Keep the brand and post strategy consistent.
2. Make it materially different from the current version.
3. Respect the marketer direction. Do not suddenly add emojis, hype, or narrative fluff if the strategy does not call for it.
4. Do not invent concrete offers, prices, deadlines, results, or testimonials that are not in the context.
5. ${
    field === "image_prompt"
      ? includeText
        ? `The new image_prompt must explicitly render the exact approved hook text "${currentContent.hook || ""}" and keep it short and legible.`
        : "The new image_prompt must explicitly forbid any text in the final image."
      : "Do not change the other fields."
  }
6. ${
    field === "image_prompt" && assetContext.hasAssets && imageModelType === "nanoBanana"
      ? "Because reference assets are attached, write the new image_prompt as an edit/composite instruction that preserves the real product identity from the attached images."
      : "Keep the output grounded in the same brand context."
  }
7. ${
    field === "image_prompt"
      ? `Let the copy approach shape the visual direction too: ${getCopyApproachVisualGuidance(effectiveCopyApproach)}`
      : "Keep the regenerated field aligned with the same strategic angle."
  }`;
}
