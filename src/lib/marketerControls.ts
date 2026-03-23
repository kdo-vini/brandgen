export type CopyApproach =
  | "auto"
  | "direct"
  | "storytelling"
  | "educational"
  | "proof"
  | "provocative";

export type ToneOverride =
  | "brand"
  | "casual"
  | "premium"
  | "technical"
  | "sales";

export type EmojiUsage = "followBrand" | "none" | "minimal" | "moderate";

export type CaptionStyle =
  | "auto"
  | "short"
  | "medium"
  | "miniStory"
  | "list";

export type CtaIntensity = "auto" | "soft" | "medium" | "hard";

export type MarketerPreferences = {
  copyApproach: CopyApproach;
  toneOverride: ToneOverride;
  emojiUsage: EmojiUsage;
  captionStyle: CaptionStyle;
  ctaIntensity: CtaIntensity;
  creativeNotes: string;
};

type Option<T extends string> = {
  value: T;
  label: string;
  hint: string;
};

export const COPY_APPROACH_OPTIONS: Option<CopyApproach>[] = [
  {
    value: "auto",
    label: "Automático",
    hint: "A IA escolhe a estrutura mais adequada ao tipo de post.",
  },
  {
    value: "direct",
    label: "Direto",
    hint: "Vai ao ponto rapido, com menos introducao e mais clareza.",
  },
  {
    value: "storytelling",
    label: "Storytelling",
    hint: "Puxa por cena, tensao e virada antes da oferta.",
  },
  {
    value: "educational",
    label: "Educativo",
    hint: "Ensina algo util com clareza e logica.",
  },
  {
    value: "proof",
    label: "Prova social",
    hint: "Abre com resultado, caso ou confianca.",
  },
  {
    value: "provocative",
    label: "Provocativo",
    hint: "Entra com contraste, pergunta forte ou quebra de padrao.",
  },
];

export const TONE_OVERRIDE_OPTIONS: Option<ToneOverride>[] = [
  {
    value: "brand",
    label: "Da marca",
    hint: "Mantem a voz base da marca.",
  },
  {
    value: "casual",
    label: "Mais casual",
    hint: "Mais proximo, leve e conversado.",
  },
  {
    value: "premium",
    label: "Mais premium",
    hint: "Mais polido, sofisticado e com menos exagero.",
  },
  {
    value: "technical",
    label: "Mais técnico",
    hint: "Mais preciso, objetivo e orientado a informacao.",
  },
  {
    value: "sales",
    label: "Mais comercial",
    hint: "Mais conversao, urgencia e chamada para acao.",
  },
];

export const EMOJI_USAGE_OPTIONS: Option<EmojiUsage>[] = [
  {
    value: "followBrand",
    label: "Seguir a marca",
    hint: "Usa o estilo da marca como referencia, sem exagerar.",
  },
  {
    value: "none",
    label: "Sem emoji",
    hint: "Nao usa emoji no hook, legenda ou CTA.",
  },
  {
    value: "minimal",
    label: "Pouco emoji",
    hint: "Usa no maximo um ou dois, so se fizer sentido.",
  },
  {
    value: "moderate",
    label: "Emoji moderado",
    hint: "Pode usar alguns, mas sem empilhar ou infantilizar.",
  },
];

export const CAPTION_STYLE_OPTIONS: Option<CaptionStyle>[] = [
  {
    value: "auto",
    label: "Automática",
    hint: "A estrutura acompanha o objetivo da peca.",
  },
  {
    value: "short",
    label: "Curta",
    hint: "Poucas linhas, leitura rapida.",
  },
  {
    value: "medium",
    label: "Media",
    hint: "Mais contexto sem ficar longa.",
  },
  {
    value: "miniStory",
    label: "Mini-story",
    hint: "Comeco, tensao e desfecho em poucos blocos.",
  },
  {
    value: "list",
    label: "Lista / passos",
    hint: "Formato escaneavel, bom para dica e tutorial.",
  },
];

export const CTA_INTENSITY_OPTIONS: Option<CtaIntensity>[] = [
  {
    value: "auto",
    label: "Automático",
    hint: "A intensidade acompanha a intencao da peca.",
  },
  {
    value: "soft",
    label: "Suave",
    hint: "Convida sem pressionar.",
  },
  {
    value: "medium",
    label: "Media",
    hint: "Clara e objetiva, sem soar agressiva.",
  },
  {
    value: "hard",
    label: "Forte",
    hint: "Mais direta, urgente e orientada a conversao.",
  },
];

export const DEFAULT_MARKETER_PREFERENCES: MarketerPreferences = {
  copyApproach: "auto",
  toneOverride: "brand",
  emojiUsage: "followBrand",
  captionStyle: "auto",
  ctaIntensity: "auto",
  creativeNotes: "",
};

const copyApproachLabels: Record<CopyApproach, string> = {
  auto: "seguir o objetivo do post",
  direct: "direto e objetivo",
  storytelling: "storytelling",
  educational: "educativo",
  proof: "prova social",
  provocative: "provocativo",
};

const toneOverrideLabels: Record<ToneOverride, string> = {
  brand: "da marca",
  casual: "mais casual",
  premium: "mais premium",
  technical: "mais técnico",
  sales: "mais comercial",
};

const emojiUsageLabels: Record<EmojiUsage, string> = {
  followBrand: "seguir a marca",
  none: "sem emoji",
  minimal: "pouco emoji",
  moderate: "emoji moderado",
};

const captionStyleLabels: Record<CaptionStyle, string> = {
  auto: "automática",
  short: "curta",
  medium: "media",
  miniStory: "mini-story",
  list: "lista / passos",
};

const ctaIntensityLabels: Record<CtaIntensity, string> = {
  auto: "automático",
  soft: "suave",
  medium: "media",
  hard: "forte",
};

export function normalizeMarketerPreferences(
  preferences?: Partial<MarketerPreferences> | null,
): MarketerPreferences {
  return {
    ...DEFAULT_MARKETER_PREFERENCES,
    ...preferences,
    creativeNotes: (preferences?.creativeNotes || "").trim(),
  };
}

export function summarizeMarketerPreferences(
  preferences?: Partial<MarketerPreferences> | null,
) {
  const normalized = normalizeMarketerPreferences(preferences);

  return [
    copyApproachLabels[normalized.copyApproach],
    emojiUsageLabels[normalized.emojiUsage],
    `CTA ${ctaIntensityLabels[normalized.ctaIntensity]}`,
    captionStyleLabels[normalized.captionStyle],
    toneOverrideLabels[normalized.toneOverride],
  ].join(" · ");
}
