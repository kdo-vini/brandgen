import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import axios from "axios";
import { Vibrant } from "node-vibrant/node";
import { createServer as createViteServer } from "vite";
import path from "path";

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
