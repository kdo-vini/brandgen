import express from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";
import {
  buildAssetParts,
  buildCopyPrompt,
  buildCriticPrompt,
  buildImagePromptFromBrief,
  buildRegenerationPrompt,
  buildStrategyPrompt,
  buildVisualBriefPrompt,
  normalizeProductType,
  PROMPT_VERSIONS,
  strategySchema,
  copySchema,
  visualBriefSchema,
  criticSchema,
  type AssetReference,
  type CreativeCritic,
  type ImageModelType,
  type StrategyPlan,
  type VisualBrief,
} from "../serverPrompting";
import type { MarketerPreferences } from "../src/lib/marketerControls";
import { PLAN_LIMITS } from "../src/lib/planLimits";
import {
  getServerUserPlan,
  getServerUsage,
  incrementUsage,
} from "../services/billingService";
import { generateStructuredObject } from "../services/geminiService";

export function createGenerateRoute(supabaseAdmin: SupabaseClient | null) {
  const router = express.Router();

  router.post("/api/generate", async (req, res) => {
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
        userId,
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
        userId?: string;
      };

      if (!brand) {
        return res.status(400).json({ error: "brand required" });
      }

      // Server-side text quota check
      if (userId && supabaseAdmin) {
        const month = new Date().toISOString().slice(0, 7);
        const plan = await getServerUserPlan(supabaseAdmin, userId);
        const usageData = await getServerUsage(supabaseAdmin, userId, month);
        const limit = PLAN_LIMITS[plan].textGenerationsPerMonth;
        if (usageData.text_generations >= limit) {
          return res.status(429).json({
            error: "Limite de gerações de texto do plano atingido",
            code: "TEXT_LIMIT_REACHED",
            plan,
            limit,
            used: usageData.text_generations,
          });
        }
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

        const regenResult = await generateStructuredObject<
          Record<string, string>
        >({
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

      if (userId) {
        const month = new Date().toISOString().slice(0, 7);
        await incrementUsage(supabaseAdmin, userId, month, "text").catch(
          () => {},
        );
      }

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
      res
        .status(500)
        .json({ error: error.message || "Erro ao gerar conteudo" });
    }
  });

  return router;
}
