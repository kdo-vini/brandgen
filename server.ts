import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import axios from "axios";
import { Vibrant } from "node-vibrant/node";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

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
    const ogDescription = $('meta[property="og:description"]').attr("content") || "";

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
      if (src) {
        try {
          const absoluteUrl = new URL(src, url).href;
          images.push(absoluteUrl);
        } catch (e) {}
      }
    });

    // Find a relevant image (logo or hero)
    let targetImage =
      images.find((img) => img.toLowerCase().includes("logo")) || images[0];

    let colors: string[] = [];
    let primary_color = "#000000";
    let secondary_color = "#ffffff";

    if (targetImage) {
      try {
        // Vibrant needs a buffer or a local file in Node, or an image URL if it supports it.
        // Let's fetch the image as a buffer first
        const imageResponse = await axios.get(targetImage, {
          responseType: "arraybuffer",
          timeout: 5000,
        });
        const buffer = Buffer.from(imageResponse.data, "binary");
        
        const vibrant = new Vibrant(buffer);
        const palette = await vibrant.getPalette();
        
        if (palette.Vibrant) colors.push(palette.Vibrant.hex);
        if (palette.Muted) colors.push(palette.Muted.hex);
        if (palette.DarkVibrant) colors.push(palette.DarkVibrant.hex);
        if (palette.LightVibrant) colors.push(palette.LightVibrant.hex);
        if (palette.DarkMuted) colors.push(palette.DarkMuted.hex);

        primary_color = palette.Vibrant?.hex || primary_color;
        secondary_color =
          palette.Muted?.hex || palette.LightVibrant?.hex || secondary_color;
      } catch (e) {
        console.error("Error extracting colors", e);
      }
    }

    res.json({
      url,
      title,
      description: metaDescription || ogDescription,
      headlines: `${h1} ${h2}`,
      body_text: paragraphs,
      colors,
      primary_color,
      secondary_color,
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
    if (!scraped) return res.status(400).json({ error: "scraped data required" });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const prompt = `Analise esta marca com base nos dados extraídos do site:
URL: ${scraped.url}
Título: ${scraped.title}
Descrição: ${scraped.description}
Textos principais: ${scraped.body_text}
Cores predominantes: ${scraped.colors?.join(', ')}

Retorne um JSON com:
- brand_name: nome da marca
- product_type: 'saas' | 'ecommerce' | 'food' | 'service' | 'other'
- tone: 'formal' | 'casual' | 'bold' | 'friendly'
- target_audience: descrição em 1 frase
- value_proposition: proposta de valor principal em 1 frase
- key_pain: principal dor que o produto resolve
- language: 'pt-BR' | 'en' | 'es'
- emoji_style: 'minimal' | 'moderate' | 'heavy'`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
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
            emoji_style: { type: Type.STRING }
          },
          required: ['brand_name', 'product_type', 'tone', 'target_audience', 'value_proposition', 'key_pain', 'language', 'emoji_style']
        }
      }
    });

    const analysis = JSON.parse(response.text || '{}');
    res.json(analysis);
  } catch (error: any) {
    console.error("Analyze error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generate", async (req, res) => {
  try {
    const { brand, postType, postVisualHint, format, imageStyle, includeText, imageStyleDescription } = req.body;
    if (!brand) return res.status(400).json({ error: "brand required" });

    const assetContext = req.body.assetCount > 0
      ? `\n\nA marca possui ${req.body.assetCount} foto(s) de produto/referência disponíveis.`
      : '';

    const keywordsContext = brand.keywords?.length > 0
      ? `\nPalavras-chave da marca: ${brand.keywords.join(', ')}`
      : '';

    const hexToColorName = (hex: string): string => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const lightness = (max + min) / 2 / 255;
      if (max - min < 30) {
        if (lightness > 0.85) return 'white';
        if (lightness > 0.6) return 'light gray';
        if (lightness > 0.4) return 'gray';
        return 'near black';
      }
      let hue = 0;
      const d = max - min;
      if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) hue = ((b - r) / d + 2) * 60;
      else hue = ((r - g) / d + 4) * 60;
      const saturation = d / 255;
      let colorName = hue < 15 || hue >= 345 ? 'red' : hue < 45 ? 'orange' : hue < 70 ? 'yellow' : hue < 160 ? 'green' : hue < 200 ? 'teal' : hue < 260 ? 'blue' : hue < 290 ? 'purple' : 'pink';
      let prefix = lightness < 0.25 ? 'very dark ' : lightness < 0.4 ? 'dark ' : lightness > 0.85 ? 'very light ' : lightness > 0.75 ? 'light ' : '';
      if (saturation < 0.3) prefix += 'muted ';
      else if (saturation > 0.7) prefix += 'vivid ';
      return prefix + colorName;
    };

    const prompt = `Com base no brand kit abaixo, gere o conteúdo para um post de Instagram.

Brand kit:
- Nome: ${brand.name}
- Tipo: ${brand.product_type}
- Tom de voz: ${brand.tone}
- Público-alvo: ${brand.target_audience}
- Proposta de valor: ${brand.value_proposition}
- Dor principal: ${brand.key_pain}
- Descrição: ${brand.description || ''}
- Cores: primária ${brand.primary_color}, secundária ${brand.secondary_color}
- Idioma: ${brand.language}
- Estilo de emoji: ${brand.emoji_style}${keywordsContext}${assetContext}

Tipo de post: ${postType}
Formato: ${format}
Estilo da Imagem: ${imageStyle}

Retorne um JSON com:
- hook: título/primeira linha impactante (max 10 palavras)
- caption: legenda completa em ${brand.language || 'pt-BR'} com quebras de linha naturais (max 300 chars)
- cta: chamada para ação final (1 linha)
- hashtags: lista de 15 hashtags relevantes como string (ex: "#tag1 #tag2")
- image_prompt: prompt DETALHADO em inglês para geração de imagem. IMPORTANTE — o prompt de imagem deve seguir TODAS estas regras:

  1. ESTILO VISUAL OBRIGATÓRIO: ${imageStyleDescription}

  2. COMPOSIÇÃO: A imagem gerada É o próprio post final — ela deve preencher o frame completo sem nenhuma borda, moldura, sombra externa ou background adicional ao redor. NÃO gere um mockup de post, NÃO coloque a imagem dentro de um quadrado com fundo extra, NÃO simule como um post apareceria numa tela. A imagem deve ter elementos visuais de alta qualidade: fotografia profissional, gradientes, formas, luz. Proibido: flat design, vetores simples, clipart, ícones cartoon.

  3. CONTEXTO VISUAL DO POST: ${postVisualHint ? postVisualHint : `This is a ${postType} post — adapt the visual composition to match this content type.`}

  4. FOTOGRAFIA: Se relevante ao produto (${brand.product_type}), inclua elementos fotográficos realistas — produto com iluminação profissional, mockups, ou cenas lifestyle.

  5. CORES DA MARCA: Use as cores "${hexToColorName(brand.primary_color)}" (primária) e "${hexToColorName(brand.secondary_color)}" (secundária) como cores dominantes. NUNCA inclua códigos hexadecimais no prompt.

  6. TIPOGRAFIA: ${includeText ? `Inclua texto tipográfico bold e moderno no design em ${brand.language || 'pt-BR'} — um título/headline curto e impactante. Use fontes sans-serif modernas.` : 'NÃO inclua NENHUM texto na imagem.'}

  7. ELEMENTOS DE DESIGN: Adicione elementos decorativos sutis. NÃO use clipart ou ícones cartoon.

  8. FORMATO: ${format}. A imagem deve ser otimizada para este formato exato.

  9. O prompt deve ser específico, detalhado (mínimo 3 frases), e em inglês.

  10. PROIBIDO: NUNCA inclua códigos hexadecimais de cores no prompt.`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hook: { type: Type.STRING },
            caption: { type: Type.STRING },
            cta: { type: Type.STRING },
            hashtags: { type: Type.STRING },
            image_prompt: { type: Type.STRING }
          },
          required: ['hook', 'caption', 'cta', 'hashtags', 'image_prompt']
        }
      }
    });

    const content = JSON.parse(response.text || '{}');
    res.json(content);
  } catch (error: any) {
    console.error("Generate error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/image", async (req, res) => {
  try {
    const { prompt, imageModel, aspectRatio, imageSize, modelType } = req.body;
    if (!prompt || !imageModel) return res.status(400).json({ error: "prompt and imageModel required" });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    if (modelType === 'imagen') {
      const response = await ai.models.generateImages({
        model: imageModel,
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio,
        },
      });
      const imgBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (!imgBytes) throw new Error('Nenhuma imagem gerada');
      res.json({ imageBase64: imgBytes });
    } else {
      const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio, imageSize }
        }
      });
      const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (!part?.inlineData?.data) throw new Error('Nenhuma imagem gerada');
      res.json({ imageBase64: part.inlineData.data });
    }
  } catch (error: any) {
    console.error("Image error:", error.message);
    res.status(500).json({ error: error.message });
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
