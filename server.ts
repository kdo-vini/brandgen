import { app } from "./app";
import path from "path";

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dynamic import keeps Vite out of any production bundle
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const express = await import("express");
    app.use(express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start HTTP server when not running on Vercel (local dev + traditional hosting)
if (!process.env.VERCEL) {
  startServer();
}
