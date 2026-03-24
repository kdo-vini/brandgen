import express from "express";
import * as cheerio from "cheerio";
import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";
import { normalizeProductType } from "../serverPrompting";
import { generateStructuredObject, toSafeJson } from "../services/geminiService";
import {
  extractColorsFromImageBuffer,
  deduplicateColors,
  extractCssHexColors,
} from "../services/colorService";

export function createScrapeRoutes() {
  const router = express.Router();

  router.post("/api/scrape", async (req, res) => {
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
      const metaDescription =
        $('meta[name="description"]').attr("content") || "";
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
        ? (() => {
            try {
              return new URL(faviconHref, url).href;
            } catch {
              return null;
            }
          })()
        : null;

      const ogImage = $('meta[property="og:image"]').attr("content") || null;

      const imageCandidates = [logoImg, ogImage, faviconUrl, images[0]].filter(
        (v): v is string => !!v,
      );

      let colors: string[] = [];
      let primaryColor = "#000000";
      let secondaryColor = "#ffffff";

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

  router.post("/api/extract-image-colors", async (req, res) => {
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
      res
        .status(500)
        .json({ error: error.message || "Erro ao extrair cores da imagem" });
    }
  });

  router.post("/api/analyze-instagram", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg" } = req.body as {
        imageBase64: string;
        mimeType?: string;
      };
      if (!imageBase64) {
        return res.status(400).json({ error: "imageBase64 required" });
      }

      const buffer = Buffer.from(imageBase64, "base64");
      const { colors, primaryColor, secondaryColor } =
        await extractColorsFromImageBuffer(buffer);

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

      analysis.product_type = normalizeProductType(
        analysis.product_type as string,
      );

      res.json({
        ...analysis,
        colors: deduplicateColors(colors),
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      });
    } catch (error: any) {
      console.error("Analyze Instagram error:", error);
      res.status(500).json({
        error:
          error.message || "Não consegui analisar a imagem. Tenta de novo?",
      });
    }
  });

  router.post("/api/analyze", async (req, res) => {
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
        model: "gemini-2.5-pro",
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

  return router;
}
