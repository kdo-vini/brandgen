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
GEMINI_API_KEY=...          # Google Gemini API key — server-side only (Express), NOT client-side
VITE_SUPABASE_URL=...       # Supabase project URL
VITE_SUPABASE_ANON_KEY=...  # Supabase anon/public key
```

> ⚠️ `GEMINI_API_KEY` must NOT be exposed to the client. All Gemini calls go through Express routes. Do not add it back to `vite.config.ts` `define`.

## Brand Identity

**Name:** Criaê
**Tagline:** O seu marketeiro pessoal.
**Positioning:** A ferramenta de geração de conteúdo de marca para empreendedores brasileiros. Simples, rápida, com a vibe certa.

### Tone of Voice
- Informal, direto, sem frescura — tuteia o usuário sempre
- Levemente bem-humorado, como um amigo que sabe de marketing
- Nunca corporativo, nunca "o senhor"
- Usa gíria com moderação — não exagera, não fica forçado
- Frases curtas. Verbos no imperativo para CTAs.

### Color Palette
```
Primary (orange):    #FF6B35   → replace all indigo-600 / indigo-700
Primary light:       #FF8C5A   → replace indigo-500
Primary bg:          #FFF1EB   → replace indigo-50 / indigo-100
Secondary (navy):    #1A1A2E   → dark backgrounds, contrast text
Accent (yellow):     #FFD166   → highlights, badges, accents
Success (green):     #06D6A0   → replace emerald-*
Surface (warm):      #FFF8F0   → replace neutral-50 body background
Error:               #EF476F   → replace red-*
```

All Tailwind classes using `indigo-*` across components should be replaced with the custom palette above. Use inline `style` or extend Tailwind theme for custom values when needed.

### Typography
- **Display font:** Plus Jakarta Sans (600, 700, 800) — headings, logo wordmark, hero text
- **Body font:** Inter (400, 500, 600, 700) — all body copy
- Both loaded from Google Fonts in `src/index.css`
- Apply `font-display` class (mapped to Plus Jakarta Sans) to all `h1`, `h2`, `h3` and the brand logo

## Architecture

**Dual-process design:** `server.ts` is an Express server that:
1. Serves backend API endpoints (scraping, Gemini AI calls)
2. In dev mode, mounts Vite as middleware (HMR + SPA). In production, serves the built `dist/` statically.

**Express API routes:**
- `POST /api/scrape` — web scraping + color extraction via `node-vibrant` + `cheerio`
- `POST /api/analyze` — Gemini brand analysis (receives scraped data, returns `GeminiAnalysis`) *(planned)*
- `POST /api/generate` — Gemini copy generation (receives brand kit + options, returns `GeneratedContent`) *(planned)*
- `POST /api/image` — Gemini image generation (returns base64) *(planned)*

**Frontend (React + Tailwind v4 + TypeScript):**
- State lives entirely in `App.tsx` — simple view-router using `AppView` string union (`'list' | 'create' | 'edit' | 'detail'`) and `selectedBrand` state. No router library.
- All Supabase calls are made directly inside components (no service layer). Client exported from `src/lib/supabase.ts`.
- Gemini calls must go through Express — do NOT instantiate `GoogleGenAI` in the browser.
- Framer Motion (`motion` package) is installed — use it for page transitions, list animations, and micro-interactions.

**Supabase tables:**
- `brands` — core brand kit records (schema matches `Brand` type in `src/types.ts`)
- `brand_assets` — uploaded images, stored in the `brand-assets` Storage bucket
- `generated_posts` — history of AI-generated post content per brand

**Content generation flow (`BrandDetail.tsx`):**
1. User configures post options → "Criar conteúdo"
2. Fetches brand assets from Supabase for context
3. Calls `POST /api/generate` (Express → Gemini) → gets `hook`, `caption`, `cta`, `hashtags`, `image_prompt`
4. Saves result to `generated_posts` table
5. Renders typographic card preview (DOM/CSS-based, not canvas)
6. Optionally calls `POST /api/image` (Express → Gemini image model) to generate AI image

**Brand registration flow (`BrandForm.tsx`):**
1. User enters URL → hits `POST /api/scrape` → gets title, description, colors, logo
2. Scrape result sent to `POST /api/analyze` → Gemini returns tone, audience, value prop, etc.
3. Form auto-fills; user adjusts and saves to Supabase `brands` table

## Improvement Roadmap

### Phase 1 — Nova cara ✅ (in progress)
- [x] Rename app: BrandGen → Criaê (index.html, App.tsx, package.json, canvas watermark)
- [x] Color palette: replace all `indigo-*` with custom warm BR palette
- [x] Copy rewrite: all PT-BR strings with "marketeiro pessoal" tone
- [x] Typography: add Plus Jakarta Sans display font
- [x] Fix `lang="pt-BR"` in index.html
- [x] Warm surface: body background `#FFF8F0`

### Phase 2 — Se sente vivo
- [ ] Activate Framer Motion: page transitions with `AnimatePresence` in `App.tsx`
- [ ] Staggered brand card animations in `BrandList.tsx`
- [ ] Multi-step loading messages: "Acessando o site..." → "Lendo as cores..." → "A IA tá analisando..." → "Quase lá..."
- [ ] Generated content sections animate in sequentially (hook → caption → CTA → hashtags)
- [ ] DOM/CSS typographic card renderer (replace canvas — enables real fonts, templates, glassmorphism)
- [ ] Toast notification system (replace inline error divs)

### Phase 3 — Seguro pra lançar
- [ ] Move ALL Gemini calls to Express routes (`/api/analyze`, `/api/generate`, `/api/image`)
- [ ] Remove `GEMINI_API_KEY` from `vite.config.ts` `define` — server-side only
- [ ] Inline post editing (hook, caption, CTA, hashtags editable after generation)
- [ ] Partial regeneration ("só o hook", "só as hashtags")
- [ ] Guided onboarding flow for first-time users

### Phase 4 — Produto de verdade
- [ ] Supabase Auth (magic link + Google OAuth) + RLS + `user_id` on all tables
- [ ] Carousel format: 5-10 slide generation with narrative arc
- [ ] Reels script format: hook (3s) + body + CTA + on-screen text suggestions
- [ ] Stories sequence: 3-5 story flow with engagement mechanics
- [ ] Content calendar view (date assignment for posts)
- [ ] Brand guidelines PDF/image export

## Known Issues / Technical Debt

1. **`BrandDetail.tsx` lines 110-113**: Directly mutates the `brand` prop during rescan (`brand.colors = ...`). Should call `onEdit(updatedBrand)` instead to go through React's rendering model.
2. **No auth / no RLS**: All brands are globally readable/writable. Any client with the anon key can modify any row. Fix in Phase 4.
3. **Framer Motion in bundle but unused**: 28KB sitting idle. Use it in Phase 2 or remove until then.
4. **SPA scraping**: The `/api/scrape` endpoint uses `axios` + `cheerio` — JS-rendered sites (React/Next/Vue) return empty HTML. Consider Puppeteer for Phase 3+.
