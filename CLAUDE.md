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
GEMINI_API_KEY=...          # Google Gemini API key — server-side only (Express)
VITE_SUPABASE_URL=...       # Supabase project URL
VITE_SUPABASE_ANON_KEY=...  # Supabase anon/public key
```

> ⚠️ `GEMINI_API_KEY` is consumed only by `server.ts` via `process.env`. It must NEVER appear in `vite.config.ts` `define` or anywhere in the client bundle.

## Brand Identity

**Name:** Criaê
**Tagline:** O seu marketeiro pessoal.
**Positioning:** Ferramenta de geração de conteúdo de marca para empreendedores brasileiros. Simples, rápida, com a vibe certa.

### Tone of Voice
- Super casual, como um amigo que sabe de marketing. Tuteia sempre.
- Gírias naturais: "bora", "manda ver", "eita", "opa", "ih", "cê", "tá on", "arrasou"
- Emojis com personalidade, sem exagero
- Frases curtas. CTAs no imperativo.
- NUNCA corporativo, NUNCA "o senhor/a senhora"

### Color Palette
```
Primary (orange):    #FF6B35   — buttons, links, focus rings
Primary hover:       #E55A28   — hover state for primary
Primary light:       #FF8C5A   — icons, secondary accents
Primary bg:          #FFF1EB   — hover backgrounds, badges
Secondary (navy):    #1A1A2E   — dark text, dark backgrounds
Accent (yellow):     #FFD166   — highlights
Success (green):     #06D6A0   — success toasts, positive states
Surface (warm):      #FFF8F0   — page background (replaces neutral-50)
Error:               #EF476F   — error toasts
```

All new `indigo-*` Tailwind classes should be replaced with arbitrary values from the palette above (e.g. `bg-[#FF6B35]`). Focus rings: `focus:ring-[#FF6B35] focus:border-[#FF6B35]`.

### Typography
- **Display font:** Plus Jakarta Sans (600, 700, 800) — headings, logo wordmark, hero text. Use `font-display` class.
- **Body font:** Inter (400, 500, 600, 700) — all body copy. Default `font-sans`.
- Both loaded from Google Fonts in `src/index.css`.

## Architecture

**Dual-process design:** `server.ts` is an Express + TypeScript server that:
1. Exposes all backend API routes (scraping, Gemini AI)
2. In dev mode, mounts Vite as middleware (SPA + HMR). In production, serves `dist/` statically.

### Express API Routes (`server.ts`)

| Route | Purpose |
|---|---|
| `POST /api/scrape` | Fetches URL, extracts title/description/colors/logo via `cheerio` + `node-vibrant` |
| `POST /api/analyze` | Receives `{ scraped }`, calls Gemini `gemini-3.1-pro-preview`, returns `GeminiAnalysis` |
| `POST /api/generate` | Receives brand kit + post config, calls Gemini, returns `GeneratedContent`. Supports partial regeneration via `regenerateField` + `currentContent` body params. |
| `POST /api/image` | Receives `{ prompt, imageModel, aspectRatio, imageSize, modelType }`, calls Imagen or Gemini image model, returns `{ imageBase64 }` |

**Partial regeneration in `/api/generate`:** If `regenerateField` and `currentContent` are in the request body, the route runs a focused prompt to regenerate only that field and returns early with `{ ...currentContent, [field]: newValue }`.

### Frontend (`src/`)

- **State / routing:** `App.tsx` owns all global state — `AppView` string union (`'list' | 'create' | 'edit' | 'detail'`), `selectedBrand`, `onboardingUrl`. No router library.
- **Animations:** Framer Motion (`motion/react`) — page transitions via `AnimatePresence` in `App.tsx`, staggered card grid in `BrandList.tsx`, sequential content reveal in `BrandDetail.tsx`.
- **Toasts:** `src/components/Toast.tsx` + `src/hooks/useToast.ts`. `addToast(msg, type)` called from `App.tsx` which passes `onError` / `onSuccess` props down to child views.
- **Supabase:** All DB/Storage calls happen directly in components. Client singleton at `src/lib/supabase.ts`.
- **Gemini:** NEVER instantiate `GoogleGenAI` in the browser. All AI calls go through the Express routes above.

### Key Components

| Component | Responsibility |
|---|---|
| `App.tsx` | View router, global state, toast integration, onboarding URL handoff |
| `Onboarding.tsx` | Full-screen welcome shown when no brands exist. Accepts URL → passes to `BrandForm` via `onboardingUrl` state |
| `BrandList.tsx` | Brand card grid. Renders `<Onboarding>` when brands array is empty |
| `BrandForm.tsx` | Brand create/edit. Accepts `initialUrl` prop — auto-triggers scan on mount if provided |
| `BrandDetail.tsx` | Post generator, brand kit summary, 3 tabs (Criar post / Assets / Histórico) |
| `TypographicCard.tsx` | DOM/CSS card renderer with 3 templates (Gradiente, Dark, Clean). Uses brand colors via inline styles |
| `AssetUploader.tsx` | Supabase Storage upload/delete for brand photos |
| `PostHistory.tsx` | Collapsible list of past generated posts |
| `Toast.tsx` | Animated toast notifications (error `#EF476F`, success `#06D6A0`) |

### `BrandDetail.tsx` — Generated Content Flow

1. `handleGenerateContent` → `POST /api/generate` → sets both `generatedContent` and `editedContent`
2. User can **edit any field inline** (`EditableField` component — click to edit, blur/Enter to save)
3. User can **regenerate one field** ("refazer" button per field → `handleRegenerateField` → `POST /api/generate` with `regenerateField`)
4. "Copiar tudo" and `TypographicCard` both read from `editedContent` (not `generatedContent`)
5. `handleGenerateImage` → `POST /api/image` → stores base64 image, uploads to Supabase Storage, updates `generated_posts.image_url`

### Supabase Schema

| Table | Notes |
|---|---|
| `brands` | Core brand kit. Schema mirrors `Brand` type in `src/types.ts` |
| `brand_assets` | Uploaded images. Storage bucket: `brand-assets` |
| `generated_posts` | History of AI-generated posts per brand. `image_url` populated after image generation |

## Roadmap

### ✅ Phase 1 — Nova cara
- Rename BrandGen → Criaê everywhere
- Warm BR color palette (orange `#FF6B35` replacing indigo)
- Copy rewrite: all PT-BR with "marketeiro pessoal" tone and gírias
- Plus Jakarta Sans display font
- `lang="pt-BR"`, warm surface `#FFF8F0`

### ✅ Phase 2 — Se sente vivo
- Framer Motion: page transitions, staggered card grid, sequential content reveal
- Multi-step loading: "Abrindo o site... 🌐" → "Lendo as cores... 🎨" → "A IA tá analisando... 🤖" → "Quase lá... ✨"
- DOM/CSS `TypographicCard` replacing canvas (3 templates, real fonts, brand colors)
- Toast system replacing inline error divs
- Super-Brazilian copy with gírias throughout

### ✅ Phase 3 — Seguro pra lançar
- All Gemini calls moved to Express (`/api/analyze`, `/api/generate`, `/api/image`)
- `GEMINI_API_KEY` removed from client bundle
- Inline editing of generated content (hook, legenda, CTA, hashtags)
- Per-field regeneration ("refazer" button per section)
- Guided onboarding flow: `Onboarding.tsx` → URL pre-fill → auto-scan on `BrandForm` mount

### 🔲 Phase 4 — Produto de verdade
- [ ] Supabase Auth (magic link + Google OAuth) + RLS + `user_id` on all tables
- [ ] Carousel format: 5-10 slide generation with narrative arc (new `content_type` in `generated_posts`)
- [ ] Reels script format: hook (3s) + body + CTA + on-screen text
- [ ] Stories sequence: 3-5 story flow with engagement mechanics
- [ ] Content calendar view
- [ ] Brand guidelines export (PDF/image)

## Known Issues / Technical Debt

1. **Prop mutation in `BrandDetail.tsx`** — `handleRescan` directly mutates `brand.colors`, `brand.primary_color`, etc. on the prop object. Should use `onEdit(updatedBrand)` to trigger a proper React re-render.
2. **No auth / no RLS** — All Supabase tables are globally readable/writable with the anon key. Phase 4 priority.
3. **SPA scraping** — `/api/scrape` uses `axios` + `cheerio`; JS-rendered sites (React/Next/Vue apps) return empty HTML. Consider Puppeteer for a future improvement.
