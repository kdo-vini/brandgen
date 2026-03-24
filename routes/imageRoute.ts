import express from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenAI, Modality } from "@google/genai";
import {
  IMAGEN_NEGATIVE_PROMPT,
  buildAssetParts,
  type AssetReference,
  type ImageModelType,
} from "../serverPrompting";
import { PLAN_LIMITS } from "../src/lib/planLimits";
import {
  getServerUserPlan,
  getServerUsage,
  incrementUsage,
} from "../services/billingService";
import { buildMultimodalContents } from "../services/geminiService";

export function createImageRoute(supabaseAdmin: SupabaseClient | null) {
  const router = express.Router();

  router.post("/api/image", async (req, res) => {
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
        const plan = await getServerUserPlan(supabaseAdmin, userId);
        const usageData = await getServerUsage(supabaseAdmin, userId, month);
        const limit = PLAN_LIMITS[plan].imageGenerationsPerMonth;
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
          await incrementUsage(supabaseAdmin, userId, month, "image").catch(
            () => {},
          );
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
        await incrementUsage(supabaseAdmin, userId, month, "image").catch(
          () => {},
        );
      }
      res.json({ imageBase64: imagePart.inlineData.data });
    } catch (error: any) {
      console.error("Image error:", error);
      res.status(500).json({ error: error.message || "Erro ao gerar imagem" });
    }
  });

  return router;
}
