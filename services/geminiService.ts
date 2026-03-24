import { GoogleGenAI } from "@google/genai";

export function toSafeJson(text?: string | null) {
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

export function buildMultimodalContents(prompt: string, assetParts: any[]) {
  return assetParts.length ? [...assetParts, prompt] : prompt;
}

export async function generateStructuredObject<T>({
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
    model: "gemini-2.5-pro",
    contents: buildMultimodalContents(prompt, assetParts),
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  return toSafeJson(response.text) as T;
}
