import { Vibrant } from "node-vibrant/node";

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function deduplicateColors(colors: string[], threshold = 40): string[] {
  const result: string[] = [];
  for (const color of colors) {
    if (!result.some((r) => colorDistance(r, color) < threshold)) {
      result.push(color);
    }
  }
  return result;
}

export function extractCssHexColors(html: string, limit = 60): string[] {
  const hexSet = new Set<string>();
  const matches = html.match(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g) || [];
  for (const m of matches) {
    hexSet.add(m.toUpperCase());
    if (hexSet.size >= limit) break;
  }
  return Array.from(hexSet);
}

export async function extractColorsFromImageBuffer(
  buffer: Buffer,
): Promise<{ colors: string[]; primaryColor: string; secondaryColor: string }> {
  const vibrant = new Vibrant(buffer);
  const palette = await vibrant.getPalette();

  const swatches = [
    palette.Vibrant,
    palette.DarkVibrant,
    palette.LightVibrant,
    palette.Muted,
    palette.DarkMuted,
    palette.LightMuted,
  ]
    .filter(Boolean)
    .map((s) => s!.hex);

  const primaryColor =
    palette.Vibrant?.hex || palette.Muted?.hex || swatches[0] || "#000000";
  const secondaryColor =
    palette.Muted?.hex || palette.LightVibrant?.hex || swatches[1] || "#ffffff";

  return { colors: swatches, primaryColor, secondaryColor };
}
