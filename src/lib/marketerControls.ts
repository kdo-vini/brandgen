export type CopyApproach =
  | "auto"
  | "direct"
  | "storytelling"
  | "educational"
  | "proof"
  | "provocative";

export type PostObjective =
  | "auto"
  | "awareness"
  | "consideration"
  | "conversion"
  | "retention"
  | "launch"
  | "offer"
  | "authority"
  | "community"
  | "local_traffic"
  | "seasonal";

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
  captionStyle: CaptionStyle;
  objective: PostObjective;
  toneOverride: ToneOverride;
  emojiUsage: EmojiUsage;
  ctaIntensity: CtaIntensity;
  creativeNotes: string;
  angleOverride: string;
  campaignBrief: string;
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
    hint: "Vai ao ponto rápido, com menos introdução e mais clareza.",
  },
  {
    value: "storytelling",
    label: "Storytelling",
    hint: "Puxa por cena, tensão e virada antes da oferta.",
  },
  {
    value: "educational",
    label: "Educativo",
    hint: "Ensina algo útil com clareza e lógica.",
  },
  {
    value: "proof",
    label: "Prova social",
    hint: "Abre com resultado, caso ou confiança.",
  },
  {
    value: "provocative",
    label: "Provocativo",
    hint: "Entra com contraste, pergunta forte ou quebra de padrão.",
  },
];

export const OBJECTIVE_OPTIONS: Option<PostObjective>[] = [
  {
    value: "auto",
    label: "Automático",
    hint: "A Criaê decide a meta mais adequada para esse tipo de post.",
  },
  {
    value: "awareness",
    label: "Atrair",
    hint: "Abrir interesse, curiosidade e lembrança de marca.",
  },
  {
    value: "consideration",
    label: "Consideração",
    hint: "Explicar melhor a proposta e reduzir objeções.",
  },
  {
    value: "conversion",
    label: "Conversão",
    hint: "Levar para clique, compra, teste ou contato.",
  },
  {
    value: "retention",
    label: "Retenção",
    hint: "Trazer quem já conhece a marca de volta para a ação.",
  },
  { value: 'offer', label: 'Oferta', hint: 'Comunicar uma oferta, promoção ou condição especial.' },
  { value: 'authority', label: 'Autoridade', hint: 'Posicionar a marca como referência no segmento.' },
  { value: 'community', label: 'Comunidade', hint: 'Criar conexão, engajamento e senso de pertencimento.' },
  { value: 'local_traffic', label: 'Tráfego local', hint: 'Levar pessoas a um endereço, evento ou PDV físico.' },
  { value: 'seasonal', label: 'Sazonal', hint: 'Aproveitar uma data, tendência ou momento específico.' },
];

export const TONE_OVERRIDE_OPTIONS: Option<ToneOverride>[] = [
  {
    value: "brand",
    label: "Da marca",
    hint: "Mantém a voz principal da marca.",
  },
  {
    value: "casual",
    label: "Mais casual",
    hint: "Mais próximo, leve e conversado.",
  },
  {
    value: "premium",
    label: "Mais premium",
    hint: "Mais polido, sofisticado e enxuto.",
  },
  {
    value: "technical",
    label: "Mais técnico",
    hint: "Mais preciso, claro e orientado a informação.",
  },
  {
    value: "sales",
    label: "Mais comercial",
    hint: "Mais orientado a conversão e ação.",
  },
];

export const EMOJI_USAGE_OPTIONS: Option<EmojiUsage>[] = [
  {
    value: "followBrand",
    label: "Seguir a marca",
    hint: "Usa a marca como referência, sem assumir exagero.",
  },
  {
    value: "none",
    label: "Sem emoji",
    hint: "Não usa emoji em hook, legenda ou CTA.",
  },
  {
    value: "minimal",
    label: "Pouco emoji",
    hint: "No máximo um ou dois, só quando fizer sentido.",
  },
  {
    value: "moderate",
    label: "Emoji moderado",
    hint: "Pode usar alguns, sem empilhar nem infantilizar.",
  },
];

export const CAPTION_STYLE_OPTIONS: Option<CaptionStyle>[] = [
  {
    value: "auto",
    label: "Automática",
    hint: "A estrutura acompanha o objetivo da peça.",
  },
  {
    value: "short",
    label: "Curta",
    hint: "Poucas linhas, leitura rápida.",
  },
  {
    value: "medium",
    label: "Média",
    hint: "Mais contexto sem ficar longa.",
  },
  {
    value: "miniStory",
    label: "Mini-story",
    hint: "Começo, tensão e desfecho em poucos blocos.",
  },
  {
    value: "list",
    label: "Lista / passos",
    hint: "Formato escaneável, bom para dica e tutorial.",
  },
];

export const CTA_INTENSITY_OPTIONS: Option<CtaIntensity>[] = [
  {
    value: "auto",
    label: "Automático",
    hint: "A intensidade acompanha o objetivo do post.",
  },
  {
    value: "soft",
    label: "Suave",
    hint: "Convida sem pressionar.",
  },
  {
    value: "medium",
    label: "Média",
    hint: "Clara e objetiva, sem soar agressiva.",
  },
  {
    value: "hard",
    label: "Forte",
    hint: "Mais direta, urgente e orientada a conversão.",
  },
];

export const DEFAULT_MARKETER_PREFERENCES: MarketerPreferences = {
  copyApproach: "auto",
  captionStyle: "auto",
  objective: "auto",
  toneOverride: "brand",
  emojiUsage: "followBrand",
  ctaIntensity: "auto",
  creativeNotes: "",
  angleOverride: "",
  campaignBrief: "",
};

const copyApproachLabels: Record<CopyApproach, string> = {
  auto: "estrutura automática",
  direct: "direto",
  storytelling: "storytelling",
  educational: "educativo",
  proof: "prova social",
  provocative: "provocativo",
};

const objectiveLabels: Record<PostObjective, string> = {
  auto: "objetivo automático",
  awareness: "atrair",
  consideration: "consideração",
  conversion: "conversão",
  retention: "retenção",
  launch: "lançamento",
  offer: "oferta",
  authority: "autoridade",
  community: "comunidade",
  local_traffic: "tráfego local",
  seasonal: "sazonal",
};

const toneOverrideLabels: Record<ToneOverride, string> = {
  brand: "voz da marca",
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
  auto: "estrutura automática",
  short: "curta",
  medium: "média",
  miniStory: "mini-story",
  list: "lista",
};

const ctaIntensityLabels: Record<CtaIntensity, string> = {
  auto: "automático",
  soft: "suave",
  medium: "médio",
  hard: "forte",
};

export function normalizeMarketerPreferences(
  preferences?: Partial<MarketerPreferences> | null,
): MarketerPreferences {
  return {
    ...DEFAULT_MARKETER_PREFERENCES,
    ...preferences,
    creativeNotes: (preferences?.creativeNotes || "").trim(),
    angleOverride: (preferences?.angleOverride || "").trim(),
    campaignBrief: (preferences?.campaignBrief || "").trim(),
  };
}

export function summarizeMarketerPreferences(
  preferences?: Partial<MarketerPreferences> | null,
) {
  const normalized = normalizeMarketerPreferences(preferences);

  return [
    copyApproachLabels[normalized.copyApproach],
    objectiveLabels[normalized.objective],
    toneOverrideLabels[normalized.toneOverride],
    emojiUsageLabels[normalized.emojiUsage],
    `CTA ${ctaIntensityLabels[normalized.ctaIntensity]}`,
    captionStyleLabels[normalized.captionStyle],
  ].join(" · ");
}
