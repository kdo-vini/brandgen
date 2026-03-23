# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Express + Vite middleware on port 3000)
npm run build    # Build frontend with Vite
npm run lint     # Type-check with tsc --noEmit
npm run clean    # Remove dist/
```

There are no tests configured in this project.

## Environment Variables

Create a `.env` file at the root with:

```
GEMINI_API_KEY=...          # Google Gemini API key (injected into frontend via vite.config.ts)
VITE_SUPABASE_URL=...       # Supabase project URL
VITE_SUPABASE_ANON_KEY=...  # Supabase anon/public key
```

`GEMINI_API_KEY` is exposed client-side via Vite's `define` config — it is bundled into the frontend. The Supabase keys use the standard `VITE_` prefix.

## Architecture

**Dual-process design:** `server.ts` is an Express server that:
1. Serves a single backend API endpoint `POST /api/scrape` (web scraping + color extraction via `node-vibrant`)
2. In dev mode, mounts Vite as middleware (HMR + SPA). In production, serves the built `dist/` statically.

**Frontend (React + Tailwind v4 + TypeScript):**
- State lives entirely in `App.tsx` — a simple view-router using `AppView` string union (`'list' | 'create' | 'edit' | 'detail'`) and `selectedBrand` state. No router library used.
- All Supabase calls are made directly inside components (no service layer). The client is exported from `src/lib/supabase.ts`.
- Gemini API (`@google/genai`) is called directly from components using `process.env.GEMINI_API_KEY` (bundled at build time by Vite).

**Supabase tables used:**
- `brands` — core brand kit records (schema matches the `Brand` type in `src/types.ts`)
- `brand_assets` — uploaded images, stored in the `brand-assets` Storage bucket
- `generated_posts` — history of AI-generated post content per brand

**Content generation flow (in `BrandDetail.tsx`):**
1. User configures post options → click "Gerar Copy & Prompt"
2. Fetches brand assets from Supabase for context
3. Calls Gemini `gemini-3.1-pro-preview` with structured JSON schema response → gets `hook`, `caption`, `cta`, `hashtags`, `image_prompt`
4. Saves result to `generated_posts` table
5. Renders a typographic card preview on a `<canvas>` element
6. Optionally calls a Gemini image model (`gemini-3.1-flash-image-preview` or `gemini-3-pro-image-preview`) to generate an AI image

**Brand registration flow (in `BrandForm.tsx`):**
1. User enters a URL → hits `/api/scrape` (Express) → gets title, description, colors, logo
2. Scraped data is sent to Gemini for brand analysis (tone, audience, value prop, etc.)
3. Form fields are auto-filled; user can adjust and save to Supabase `brands` table

**AI Studio integration:** `App.tsx` checks for `window.aistudio?.hasSelectedApiKey()` to detect when running inside Google AI Studio and prompts for a billing-enabled API key if absent.
