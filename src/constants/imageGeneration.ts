export const formatOptions = [
  {
    id: 'Feed quadrado (1080x1080)',
    label: 'Feed quadrado',
    description: '1080 x 1080',
  },
  {
    id: 'Story vertical (1080x1920)',
    label: 'Story vertical',
    description: '1080 x 1920',
  },
  {
    id: 'Capa de Destaque (1080x1920, foco central)',
    label: 'Capa de destaque',
    description: '1080 x 1920',
  },
] as const;

export const imageStyles = [
  'Post Profissional (Canva)',
  'Fotográfico Realista',
  'Dark Mode Premium (Escuro)',
  'Gradiente Moderno',
  'Minimalista (Clean)',
  'Cinematográfico (Estúdio)',
  'Neon / Futurista',
];

export const imageModels = [
  { id: 'auto', name: 'Automático (Recomendado)', type: 'auto' },
  { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro', type: 'nanoBanana' },
  { id: 'gemini-3.1-flash-image-preview', name: 'Nano Banana Flash', type: 'nanoBanana' },
  { id: 'imagen-4.0-ultra-generate-001', name: 'Imagen 4 Ultra', type: 'imagen' },
  { id: 'imagen-4.0-generate-001', name: 'Imagen 4', type: 'imagen' },
  { id: 'imagen-4.0-fast-generate-001', name: 'Imagen 4 Fast', type: 'imagen' },
];

export const formatAspectRatios: Record<string, string> = {
  'Feed quadrado (1080x1080)': '1:1',
  'Story vertical (1080x1920)': '9:16',
  'Capa de Destaque (1080x1920, foco central)': '9:16',
};

export const imageSizes = ['1K', '2K'];

export const modelFriendlyName: Record<string, string> = {
  'gemini-3-pro-image-preview': 'Nano Banana Pro',
  'gemini-3.1-flash-image-preview': 'Nano Banana Flash',
  'imagen-4.0-ultra-generate-001': 'Imagen 4 Ultra',
  'imagen-4.0-generate-001': 'Imagen 4',
  'imagen-4.0-fast-generate-001': 'Imagen 4 Fast',
};

export function resolveImageModel(
  imageModelSetting: string,
  hasAssets: boolean,
  visualBriefRecommendation: 'imagen' | 'nanoBanana' | undefined,
  imageStyle: string,
): { id: string; type: 'imagen' | 'nanoBanana' } {
  if (imageModelSetting !== 'auto') {
    const found = imageModels.find((m) => m.id === imageModelSetting);
    return {
      id: imageModelSetting,
      type: (found?.type as 'imagen' | 'nanoBanana') || 'imagen',
    };
  }
  if (hasAssets) return { id: 'gemini-3-pro-image-preview', type: 'nanoBanana' };
  if (visualBriefRecommendation === 'nanoBanana')
    return { id: 'gemini-3-pro-image-preview', type: 'nanoBanana' };
  if (/fotografico|cinemato/i.test(imageStyle))
    return { id: 'imagen-4.0-ultra-generate-001', type: 'imagen' };
  return { id: 'imagen-4.0-generate-001', type: 'imagen' };
}
