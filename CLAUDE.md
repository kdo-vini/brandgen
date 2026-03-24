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

### Server directory structure

```
app.ts                     ← Express app setup (~50 lines); imports routes + singletons
server.ts                  ← Dev entry point (starts Express + Vite middleware)
serverPrompting.ts         ← All AI prompt builders + Gemini schemas

services/
  colorService.ts          ← hexToRgb, colorDistance, deduplicateColors, extractColorsFromImageBuffer
  billingService.ts        ← getServerUserPlan, getServerUsage, incrementUsage (accept supabaseAdmin param)
  geminiService.ts         ← toSafeJson, buildMultimodalContents, generateStructuredObject

routes/
  scrapeRoutes.ts          ← POST /api/scrape, /api/extract-image-colors, /api/analyze, /api/analyze-instagram
  generateRoute.ts         ← POST /api/generate (with server-side text quota check + usage tracking)
  imageRoute.ts            ← POST /api/image (with server-side image quota check)
  stripeRoutes.ts          ← POST /api/stripe/webhook, /api/stripe/checkout, /api/stripe/portal
```

### Express API Routes

| Route | Purpose |
|---|---|
| `POST /api/scrape` | Fetches URL, extracts title/description/colors/logo via `cheerio` + `node-vibrant` |
| `POST /api/analyze` | Receives `{ scraped }`, calls Gemini, returns `GeminiAnalysis` |
| `POST /api/generate` | Receives brand kit + marketer prefs + assets + `userId`, runs full 4-step AI chain, returns `GeneratedContent`. Server-side text quota enforced. |
| `POST /api/image` | Receives `{ prompt, imageModel, aspectRatio, imageSize, modelType, userId }`, calls Imagen or Gemini. Server-side image quota enforced. |

**Partial regeneration in `/api/generate`:** If `regenerateField` and `currentContent` are in the request body, the route runs a focused prompt to regenerate only that field and returns early with `{ ...currentContent, [field]: newValue }`.

### AI Generation Pipeline (`serverPrompting.ts`)

All AI prompt logic lives in `serverPrompting.ts` (server-side only, never imported by the frontend). Also exports the 4 Gemini response schemas (`strategySchema`, `copySchema`, `visualBriefSchema`, `criticSchema`).

**Chain order:** `buildStrategyPrompt` → `buildCopyPrompt` → `buildVisualBriefPrompt` → `buildCriticPrompt` → `buildImagePromptFromBrief`

| Export | Purpose |
|---|---|
| `PROMPT_VERSIONS` | Version map `{ strategy, copy, visual, critic }` — bump when changing any prompt |
| `strategySchema / copySchema / visualBriefSchema / criticSchema` | Gemini structured output schemas |
| `buildStrategyPrompt()` | Chooses objective + creative angle before any copy. Injects few-shot examples. |
| `buildCopyPrompt()` | Writes hook, caption, CTA, hashtags, imageText from strategy output |
| `buildVisualBriefPrompt()` | Generates structured visual direction (composition, layout, productRole, avoid[]) from copy |
| `buildCriticPrompt()` | Scores the full creative 0–10: brandFit, clarity, originality, aiSlopRisk, conversionReadiness |
| `buildImagePromptFromBrief()` | Converts visual brief → final Imagen or Gemini image prompt string |
| `buildRegenerationPrompt()` | Single-field focused regen (used by partial regen route) |
| `buildAssetParts()` | Encodes selected brand assets as multimodal Gemini parts for image editing flow |
| `normalizeProductType()` | Maps raw `product_type` → `food \| saas \| ecommerce \| service \| other` |

**Few-shot injection:** `buildStrategyPrompt` calls `getFewShotExamples(productType, postType)` from `src/lib/fewShotBank.ts` and injects up to 2 matching examples into the strategy prompt context.

**Marketer controls:** `src/lib/marketerControls.ts` defines `MarketerPreferences` (objective, tone, emojiUsage, ctaStrength, visualStyle, manualAngle, marketerNotes). Normalized and injected into every prompt stage.

**Quality gate:** After critic runs, if `overallScore < 7` or `aiSlopRisk > 4`, UI shows a warning banner and blocks "Gerar imagem" until the user explicitly confirms.

### Frontend (`src/`)

- **State / routing:** `App.tsx` owns all global state — `AppView` string union (`'list' | 'create' | 'edit' | 'detail'`), `selectedBrand`, `onboardingUrl`. No router library.
- **Animations:** Framer Motion (`motion/react`) — page transitions via `AnimatePresence` in `App.tsx`, staggered card grid in `BrandList.tsx`, sequential content reveal in `BrandDetail.tsx`.
- **Toasts:** `src/components/Toast.tsx` + `src/hooks/useToast.ts`. `addToast(msg, type)` called from `App.tsx` which passes `onError` / `onSuccess` props down to child views.
- **Supabase:** All DB/Storage calls happen directly in components. Client singleton at `src/lib/supabase.ts`.
- **Gemini:** NEVER instantiate `GoogleGenAI` in the browser. All AI calls go through the Express routes above.

### Frontend directory structure

```
src/
  constants/
    postTypes.ts           ← postTypes array (14 types with visual hints)
    imageGeneration.ts     ← imageModels, imageStyles, formatOptions, aspectRatios, resolveImageModel()

  hooks/
    useToast.ts            ← addToast(msg, type) for global notifications
    useGenerationProgress.ts ← 7-stage progress bar timing for AI generation
    useEditableFields.ts   ← editingField, humanEdits, regenerationCounts, trackFieldEdit, trackRegeneration
    useScanFlow.ts         ← scanUrl(url) + scanInstagram(file) — URL and Instagram scan flows

  lib/
    planLimits.ts          ← PLAN_LIMITS constant (no browser deps — safe to import on server)
    subscription.ts        ← useSubscription hook + re-exports PLAN_LIMITS
    marketerControls.ts    ← MarketerPreferences type + options
    fewShotBank.ts         ← FEW_SHOT_BANK + getFewShotExamples()
```

### Key Components

| Component | Responsibility |
|---|---|
| `App.tsx` | View router, global state, toast integration, onboarding URL handoff |
| `Onboarding.tsx` | Full-screen welcome shown when no brands exist. Accepts URL → passes to `BrandForm` via `onboardingUrl` state |
| `BrandList.tsx` | Brand card grid. Renders `<Onboarding>` when brands array is empty |
| `BrandForm.tsx` | Brand create/edit. Uses `useScanFlow` for URL + Instagram scan flows. Accepts `initialUrl` prop — auto-triggers scan on mount if provided |
| `BrandDetail.tsx` | Post generator, brand kit summary, 3 tabs (Criar post / Assets / Histórico). Uses `useGenerationProgress` + `useEditableFields` hooks. |
| `TypographicCard.tsx` | DOM/CSS card renderer with 3 templates (Gradiente, Dark, Clean). Uses brand colors via inline styles |
| `AssetUploader.tsx` | Supabase Storage upload/delete for brand photos |
| `PostHistory.tsx` | Collapsible list of past generated posts |
| `Toast.tsx` | Animated toast notifications (error `#EF476F`, success `#06D6A0`) |
| `src/lib/marketerControls.ts` | `MarketerPreferences` type + normalization helpers. Source of truth for objective/tone/emoji/CTA/style options. |
| `src/lib/fewShotBank.ts` | `FEW_SHOT_BANK` array (15 examples across 5 verticals) + `getFewShotExamples(productType, postType)` selector. |
| `serverPrompting.ts` | All AI prompt builders, type definitions, `PROMPT_VERSIONS`, Gemini schemas. Never imported by frontend. |

### `BrandDetail.tsx` — Generated Content Flow

1. `handleGenerateContent` → `POST /api/generate` (with `userId`) → sets both `generatedContent` and `editedContent`
2. User can **edit any field inline** (`EditableField` component — click to edit, blur/Enter to save)
3. User can **regenerate one field** ("refazer" button per field → `handleRegenerateField` → `POST /api/generate` with `regenerateField`)
4. "Copiar tudo" and `TypographicCard` both read from `editedContent` (not `generatedContent`)
5. `handleGenerateImage` → `POST /api/image` → stores base64 image, uploads to Supabase Storage, updates `generated_posts.image_url`

### Supabase Schema

| Table | Notes |
|---|---|
| `brands` | Core brand kit. Schema mirrors `Brand` type in `src/types.ts`. Includes `prova_disponivel` + `claim_restrictions` (Brand OS). |
| `brand_assets` | Uploaded images. Storage bucket: `brand-assets`. Types: `product_photo \| logo \| reference \| packaging \| environment` |
| `generated_posts` | Full generation history per brand. See extended columns below. |

**`generated_posts` columns** — migration in `docs/migrations/001_generated_posts_playbook_columns.sql` (run in Supabase SQL editor):

| Column | Type | Notes |
|---|---|---|
| `hook`, `caption`, `cta`, `hashtags` | text | Core copy fields |
| `image_text` | text | Short text to render inside the image |
| `image_prompt`, `image_url` | text | Final image prompt + Storage URL |
| `image_style`, `format`, `aspect_ratio`, `image_model` | text | Generation settings |
| `objective` | text | Resolved post objective |
| `strategy_json` | jsonb | Full `StrategyPlan` output |
| `copy_json` | jsonb | Copy fields snapshot at save time |
| `visual_brief_json` | jsonb | Full `VisualBrief` output |
| `critic_json` | jsonb | Full `CreativeCritic` output |
| `prompt_version_strategy/copy/visual/critic` | text | Version strings from `PROMPT_VERSIONS` |
| `human_edits_json` | jsonb | `{ [field]: { original, edited, editedAt } }` — tracks user edits |
| `regeneration_counts_json` | jsonb | `{ [field]: count }` — tracks per-field regen count |
| `selected_asset_ids` | text[] | Asset IDs passed to image model |
| `generation_mode` | text | `text_to_image \| asset_edit \| asset_reference` |

Code uses graceful fallback: tries to save extended payload; on schema error, retries with base columns only.

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
4. **`useScanFlow` hook initialization order** — Hook is called after `applyScanResults` + `applyInstagramResults` are defined (to avoid temporal dead zone issues with `const` declarations). This is intentional and safe since callbacks are closures, but devs should keep the hook call after those two functions.



## Playbook To-Do (ordered by impact)

- [x] Cadeia strategy → copy → visual_brief → critic
- [x] Prompt versioning (PROMPT_VERSIONS salvo em generated_posts)
- [x] Controles essenciais (objetivo, tom, emoji, CTA, brief)
- [x] imageText como campo editável no resultado
- [x] Critic quality gate: warning quando overallScore < 7 ou aiSlopRisk > 4
- [x] Score pills no card de crítica (Marca, Clareza, Originalidade)
- [x] human_edits_json: tracking de edições por campo
- [x] **Brand OS: campos prova_disponivel + claim_restrictions** — evita invenções da IA
- [x] **Objectives completos: offer, authority, community, local_traffic, seasonal** — cobre casos de uso reais
- [x] **Critic como gate real** — bloquear "Gerar imagem" se score < 7, exige confirmação
- [x] Ângulo criativo manual no modo avançado (campo colapsável)
- [x] Asset types: packaging + environment
- [x] Few-shot bank por vertical/tipo/estilo
- [x] Learning loop: contagem de regenerações e estilo preferido por marca

## Playbook Implementation Status (`docs/criae-prompting-playbook-v1.md`)

### ✅ Fase 1 — Cadeia de prompts
- strategy → copy → visual_brief → critic em cadeia (serverPrompting.ts + server.ts)
- JSON estruturado de cada etapa com schemas Gemini
- Prompt versioning: `PROMPT_VERSIONS` em serverPrompting.ts, incluído no response e salvo em `generated_posts` como `prompt_version_strategy/copy/visual/critic`

### ✅ Fase 2 — Controles essenciais + imageText manual
- UI: objetivo, tom, emoji, CTA, brief extra (marketerControls.ts)
- Ajustes avançados colapsáveis (modelo, resolução)
- `image_text` como campo editável no painel "Seu post está pronto" (EditableField)
- `image_text` atualiza a pré-visualização no prompt de imagem em tempo real

### ✅ Fase 3 — Qualidade automática + learning loop
- Critic quality gate: warning quando `overallScore < 7` ou `aiSlopRisk > 4`
- Score pills (Marca, Clareza, Originalidade) no card de crítica interna
- `human_edits_json`: tracking de edições manuais por campo (original, edited, editedAt)
- Reset de humanEdits a cada nova geração
- Salvo em `generated_posts` com fallback para schema antigo

### ✅ Fase 4 — Few-shot bank + Learning loop avançado
- [x] Example bank interno: 3-5 exemplos por vertical/tipo/estilo injetados nos prompts (`src/lib/fewShotBank.ts`, injetado em `buildStrategyPrompt`)
- [x] Aprender com edições do usuário (quanto editou, quantas vezes regenerou) — `human_edits_json` + `regeneration_counts_json` salvos em `generated_posts`
- [ ] Medir performance por tipo de saída — requer integração com API do Instagram/Meta, fora do escopo atual

### ✅ Supabase schema para colunas novas
Migration SQL em `docs/migrations/001_generated_posts_playbook_columns.sql`.
Rodar no SQL editor do Supabase para adicionar as colunas em `generated_posts`:
- `objective`, `image_text`, `strategy_json`, `copy_json`, `visual_brief_json`, `critic_json`
- `selected_asset_ids`, `generation_mode`
- `prompt_version_strategy/copy/visual/critic`
- `human_edits_json`, `regeneration_counts_json`
