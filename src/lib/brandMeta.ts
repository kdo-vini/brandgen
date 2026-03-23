export const PRODUCT_TYPE_LABELS = {
  saas: 'SaaS / Sistema',
  ecommerce: 'E-commerce / Loja',
  food: 'Alimentacao / Gastronomia',
  service: 'Servico / Consultoria',
  other: 'Outro',
} as const;

export type ProductTypeValue = keyof typeof PRODUCT_TYPE_LABELS;

const PRODUCT_TYPE_ALIASES: Record<string, ProductTypeValue> = {
  saas: 'saas',
  sistema: 'saas',
  system: 'saas',
  software: 'saas',
  app: 'saas',
  ecommerce: 'ecommerce',
  'e-commerce': 'ecommerce',
  loja: 'ecommerce',
  store: 'ecommerce',
  food: 'food',
  comida: 'food',
  restaurante: 'food',
  hamburgueria: 'food',
  service: 'service',
  servico: 'service',
  servicos: 'service',
  consultoria: 'service',
  agencia: 'service',
  other: 'other',
  outro: 'other',
};

export const PRODUCT_TYPES = Object.keys(PRODUCT_TYPE_LABELS) as ProductTypeValue[];

export function normalizeProductType(value?: string | null): ProductTypeValue {
  if (!value) return 'other';

  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  return PRODUCT_TYPE_ALIASES[normalized] || 'other';
}

export function formatProductTypeLabel(value?: string | null): string {
  return PRODUCT_TYPE_LABELS[normalizeProductType(value)];
}
