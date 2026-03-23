import React from 'react';
import type { Brand } from '../types';

type Props = {
  brand: Brand;
  hook: string;
  cta: string;
  template: number; // 0-2
  isVertical?: boolean;
};

// Derive a readable accent from primary color for Template 0 CTA.
// If brand has an accent_color use it; otherwise fall back to a warm gold.
function resolveAccent(brand: Brand): string {
  return brand.accent_color || '#FACC15';
}

// Lightens a hex color by mixing it toward white at the given ratio (0–1).
function lighten(hex: string, ratio: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const lr = Math.round(r + (255 - r) * ratio);
  const lg = Math.round(g + (255 - g) * ratio);
  const lb = Math.round(b + (255 - b) * ratio);
  return `rgb(${lr}, ${lg}, ${lb})`;
}

// ─────────────────────────────────────────────
// Template 0 — Gradiente Bold
// Background: diagonal gradient primary → secondary
// Hook: large white centered headline
// CTA: accent-color, bottom center
// Watermark: bottom-right, white 30%
// ─────────────────────────────────────────────
function Template0({ brand, hook, cta }: Omit<Props, 'template' | 'isVertical'>) {
  const accent = resolveAccent(brand);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-8 py-10 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${brand.primary_color} 0%, ${brand.secondary_color} 100%)`,
      }}
    >
      {/* Decorative blurred circle — top-left */}
      <div
        aria-hidden="true"
        className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: '#ffffff' }}
      />

      {/* Decorative blurred circle — bottom-right */}
      <div
        aria-hidden="true"
        className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full opacity-15 blur-2xl"
        style={{ backgroundColor: brand.secondary_color }}
      />

      {/* Hook */}
      <p
        className="font-display relative z-10 text-center text-white leading-tight"
        style={{
          fontSize: 'clamp(1.5rem, 6vw, 3.5rem)',
          fontWeight: 800,
          textShadow: '0 2px 16px rgba(0,0,0,0.25)',
          wordBreak: 'break-word',
        }}
      >
        {hook}
      </p>

      {/* Divider */}
      <div
        aria-hidden="true"
        className="relative z-10 mt-6 mb-5 rounded-full"
        style={{
          width: 'clamp(40px, 10%, 80px)',
          height: '3px',
          backgroundColor: 'rgba(255,255,255,0.5)',
        }}
      />

      {/* CTA */}
      <p
        className="font-display relative z-10 text-center font-bold leading-snug"
        style={{
          fontSize: 'clamp(0.85rem, 2.5vw, 1.4rem)',
          color: accent,
          textShadow: '0 1px 8px rgba(0,0,0,0.3)',
          wordBreak: 'break-word',
        }}
      >
        {cta}
      </p>

      {/* Watermark */}
      <span
        aria-hidden="true"
        className="absolute bottom-4 right-5 font-display text-white select-none"
        style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.85rem)', opacity: 0.3, fontWeight: 700 }}
      >
        Criaê
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Template 1 — Dark com Accent
// Background: #1A1A2E navy
// Left accent bar: 4px, primary_color
// Hook: white, left-aligned
// CTA: primary_color, left-aligned
// Glow circle: background corner blur
// Watermark: bottom-right, white 30%
// ─────────────────────────────────────────────
function Template1({ brand, hook, cta }: Omit<Props, 'template' | 'isVertical'>) {
  return (
    <div
      className="relative w-full h-full flex flex-col justify-center px-10 py-10 overflow-hidden"
      style={{ backgroundColor: '#1A1A2E' }}
    >
      {/* Glow corner — top-right */}
      <div
        aria-hidden="true"
        className="absolute -top-1/3 -right-1/3 w-2/3 h-2/3 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: brand.primary_color }}
      />

      {/* Glow corner — bottom-left */}
      <div
        aria-hidden="true"
        className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-10 blur-2xl"
        style={{ backgroundColor: brand.secondary_color }}
      />

      {/* Left accent bar */}
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 h-full"
        style={{ width: '5px', backgroundColor: brand.primary_color }}
      />

      {/* Hook */}
      <p
        className="font-display relative z-10 text-white leading-tight"
        style={{
          fontSize: 'clamp(1.4rem, 5.5vw, 3.2rem)',
          fontWeight: 800,
          wordBreak: 'break-word',
        }}
      >
        {hook}
      </p>

      {/* Accent line under hook */}
      <div
        aria-hidden="true"
        className="relative z-10 mt-5 mb-4 rounded-full"
        style={{
          width: 'clamp(32px, 8%, 64px)',
          height: '3px',
          backgroundColor: brand.primary_color,
        }}
      />

      {/* CTA */}
      <p
        className="font-display relative z-10 font-bold leading-snug"
        style={{
          fontSize: 'clamp(0.8rem, 2.2vw, 1.25rem)',
          color: brand.primary_color,
          wordBreak: 'break-word',
        }}
      >
        {cta}
      </p>

      {/* Watermark */}
      <span
        aria-hidden="true"
        className="absolute bottom-4 right-5 font-display text-white select-none"
        style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.85rem)', opacity: 0.3, fontWeight: 700 }}
      >
        Criaê
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Template 2 — Clean Light com Cor
// Background: white
// Top strip: 8px, primary_color
// Hook: secondary_color or #1A1A2E, centered
// CTA: pill badge, primary_color bg, white text
// Brand name: small caps, neutral gray
// Watermark: bottom-right, neutral gray 40%
// ─────────────────────────────────────────────
function Template2({ brand, hook, cta }: Omit<Props, 'template' | 'isVertical'>) {
  const hookColor = brand.secondary_color || '#1A1A2E';
  const lightBg = lighten(brand.primary_color, 0.92);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Top color strip */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0"
        style={{ height: '8px', backgroundColor: brand.primary_color }}
      />

      {/* Subtle tinted background circle — decorative */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-3/4 h-3/4 rounded-full opacity-30 blur-3xl"
        style={{ backgroundColor: lightBg }}
      />

      {/* Inner content */}
      <div className="relative z-10 flex flex-col items-center px-10 py-12 w-full">
        {/* Brand name badge */}
        <span
          className="font-display uppercase tracking-widest mb-6"
          style={{
            fontSize: 'clamp(0.55rem, 1.4vw, 0.8rem)',
            color: brand.primary_color,
            fontWeight: 700,
            letterSpacing: '0.2em',
          }}
        >
          {brand.name}
        </span>

        {/* Hook */}
        <p
          className="font-display text-center leading-tight"
          style={{
            fontSize: 'clamp(1.35rem, 5.5vw, 3rem)',
            fontWeight: 800,
            color: hookColor,
            wordBreak: 'break-word',
          }}
        >
          {hook}
        </p>

        {/* Divider */}
        <div
          aria-hidden="true"
          className="mt-6 mb-5 rounded-full"
          style={{
            width: 'clamp(36px, 8%, 60px)',
            height: '3px',
            backgroundColor: brand.primary_color,
            opacity: 0.5,
          }}
        />

        {/* CTA pill */}
        <span
          className="font-display font-bold text-white text-center rounded-full px-5 py-2"
          style={{
            fontSize: 'clamp(0.75rem, 2vw, 1.05rem)',
            backgroundColor: brand.primary_color,
            wordBreak: 'break-word',
            maxWidth: '85%',
          }}
        >
          {cta}
        </span>
      </div>

      {/* Watermark */}
      <span
        aria-hidden="true"
        className="absolute bottom-4 right-5 font-display select-none"
        style={{
          fontSize: 'clamp(0.6rem, 1.5vw, 0.85rem)',
          color: '#9CA3AF',
          opacity: 0.6,
          fontWeight: 700,
        }}
      >
        Criaê
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
export default function TypographicCard({
  brand,
  hook,
  cta,
  template,
  isVertical = false,
}: Props) {
  const aspectClass = isVertical ? 'aspect-[9/16]' : 'aspect-square';

  return (
    <div
      className={`w-full ${aspectClass} overflow-hidden rounded-xl shadow-lg`}
      role="img"
      aria-label={`Card tipográfico: ${hook}`}
    >
      {template === 0 && (
        <Template0 brand={brand} hook={hook} cta={cta} />
      )}
      {template === 1 && (
        <Template1 brand={brand} hook={hook} cta={cta} />
      )}
      {template === 2 && (
        <Template2 brand={brand} hook={hook} cta={cta} />
      )}
    </div>
  );
}
