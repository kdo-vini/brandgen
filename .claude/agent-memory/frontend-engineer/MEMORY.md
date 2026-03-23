# MidasAI / Criaê Frontend Engineer Memory

## Project: Criaê (formerly BrandGen)
- **App name:** Criaê — O seu marketeiro pessoal.
- **Working directory:** `C:\Users\Vinicius\Desktop\Code\brandgen`
- **Stack:** React 19, TypeScript strict, Vite 6, Tailwind CSS v4 via `@import "tailwindcss"` in `src/index.css`
- **UI Language:** Portuguese (BR) — all user-facing text must be PT-BR, informal/tuteia tone with gírias

## Color Palette (Criaê brand — NO indigo classes)
- Primary CTA bg: `bg-[#FF6B35]` / hover: `hover:bg-[#E55A28]`
- Icon accent: `text-[#FF8C5A]`
- Light bg tint: `bg-[#FFF1EB]` / `bg-[#FFF8F0]` (page bg)
- Tag/badge bg: `bg-[#FFE0D0]` with `text-[#1A1A2E]`
- Focus rings: `focus:ring-[#FF6B35] focus:border-[#FF6B35]`
- Toast error: `bg-[#EF476F]` / success: `bg-[#06D6A0]`
- emerald-* stays for success/paid states

## Typography
- `font-display` = Plus Jakarta Sans (600/700/800) — h1, h2, major headings
- `font-sans` = Inter — body/default

## Key Files
- `src/App.tsx` — AnimatePresence page transitions, useToast, ToastContainer
- `src/components/BrandList.tsx` — staggered card animations with motion
- `src/components/BrandForm.tsx` — multi-step loadingStep, motion.button whileTap
- `src/components/BrandDetail.tsx` — AnimatePresence content reveal, motion.button, onError/onSuccess props
- `src/components/TypographicCard.tsx` — 3 templates (Gradiente/Dark/Clean), inline styles for brand colors
- `src/components/AssetUploader.tsx`
- `src/components/PostHistory.tsx`
- `src/components/Toast.tsx` — global toast system
- `src/hooks/useToast.ts` — toast state hook

## Animations (motion/react — NOT framer-motion)
- Import: `import { motion, AnimatePresence } from 'motion/react'`
- Page transitions: `AnimatePresence mode="wait"` + `{ opacity:0, y:16 }→{ opacity:1, y:0 }→{ opacity:0, y:-8 }`, duration 0.2
- Staggered cards: outer variants `{ staggerChildren: 0.07 }`, card `hidden:{opacity:0,y:20}→visible:{opacity:1,y:0}` duration 0.3
- Content reveal: `scale: 0.97→1` duration 0.3; inner rows `x:-8→0` delays 0.1/0.2/0.3/0.4
- Button press: `whileTap={{ scale: 0.97 }}` on `motion.button`
- React 19 + TS 5.8: add `key?: React.Key` to internal component props types to silence false-positive TS error

## Toast System
- `useToast()` returns `{ toasts, addToast, removeToast }`
- `addToast(msg, 'error' | 'success')` — auto-dismisses at 4s
- Components take `onError?: (msg: string) => void` and `onSuccess?: (msg: string) => void`
- `ToastContainer` placed last inside App.tsx root div

## Multi-Step Loading (BrandForm)
- `loadingStep: string | null` replaces `isScraping + isAnalyzing` booleans
- 4 steps with emoji: '🌐', '🎨', '🤖', '✨'
- 300ms delay after scrape, 500ms delay after Gemini before clearing

## DOM Card + Print Download (BrandDetail)
- TypographicCard renders 3 templates with inline brand colors
- `window.print()` with injected `@media print` style for download
- `selectedTemplate` state (0=Gradiente, 1=Dark, 2=Clean), `cardRef` for print target

## Tone Rules
- Gírias: bora, eita, opa, ih, cê, arrasou, manda ver, segura aí
- Error messages with emojis: 😬 😅 🔄 😄 🙈 👆
- Success toasts: 'Marca salva! Arrasou 🎉', 'Post criado! Agora é só copiar 🔥'
- Never formal — always tuteia

## Detailed patterns: see `patterns.md`
