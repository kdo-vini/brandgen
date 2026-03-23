# MidasAI / Criaê Frontend Engineer Memory

## Project: Criaê (formerly BrandGen)
- **App name:** Criaê — O seu marketeiro pessoal.
- **Working directory:** `C:\Users\Vinicius\Desktop\Code\brandgen`
- **Stack:** React 19, TypeScript strict, Vite 6, Tailwind CSS v4 via `@import "tailwindcss"` in `src/index.css`
- **UI Language:** Portuguese (BR) — all user-facing text must be PT-BR, informal/tuteia tone

## Color Palette (Criaê brand — NO indigo classes)
- Primary CTA bg: `bg-[#FF6B35]` / hover: `hover:bg-[#E55A28]`
- Icon accent: `text-[#FF8C5A]`
- Light bg tint: `bg-[#FFF1EB]` / `bg-[#FFF8F0]` (page bg)
- Tag/badge bg: `bg-[#FFE0D0]` with `text-[#1A1A2E]`
- Focus rings: `focus:ring-[#FF6B35] focus:border-[#FF6B35]`
- Brand text link: `text-[#FF6B35]` hover `text-[#E55A28]`
- CTA text in copy results: `text-[#FF6B35]`
- Dashed card hover: `hover:border-[#FF8C5A] hover:bg-[#FFF1EB]/30`
- Card hover border: `hover:border-[#FFE0D0]`
- Card name hover: `group-hover:text-[#FF6B35]`
- emerald-* stays for success/paid states

## Typography
- `font-display` = Plus Jakarta Sans (600/700/800) — used on h1, h2, major headings
- `font-sans` = Inter — body/default
- Apply `font-display` class to: app name h1, section h2 headings (BrandList, BrandForm, BrandDetail)

## Key Files
- `index.html` — lang="pt-BR", title="Criaê"
- `src/index.css` — Tailwind v4 with @theme vars (Plus Jakarta Sans + Inter)
- `src/App.tsx` — logo square `bg-[#FF6B35]`, letter "C", bg `bg-[#FFF8F0]`, footer tagline
- `src/components/BrandList.tsx`
- `src/components/BrandForm.tsx`
- `src/components/BrandDetail.tsx` — canvas watermark = "Criaê", download prefix = "criae-"
- `src/components/AssetUploader.tsx`
- `src/components/PostHistory.tsx`

## Tone Rules
- Informal, tuteia (você → informal second person)
- CTAs no imperativo: "Criar marca", "Começar agora", "Analisar site"
- Errors friendly/casual: "Deu ruim aqui. Tenta de novo?", "Coloca o nome da marca, vai!"
- No corporate language, no "Cadastrar", prefer "Criar"

## Detailed patterns: see `patterns.md`
