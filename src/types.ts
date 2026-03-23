export type Brand = {
  id: string;
  name: string;
  url: string | null;
  instagram_handle: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string | null;
  colors: string[];
  tone: string | null;
  target_audience: string | null;
  value_proposition: string | null;
  key_pain: string | null;
  product_type: string | null;
  language: string;
  emoji_style: string;
  keywords: string[];
  description: string | null;
  headlines: string | null;
  body_text: string | null;
  raw_scan_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type BrandInsert = Omit<Brand, 'id' | 'created_at' | 'updated_at'>;

export type BrandAsset = {
  id: string;
  brand_id: string;
  type: 'product_photo' | 'reference' | 'logo';
  url: string;
  filename: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type GeneratedPost = {
  id: string;
  brand_id: string;
  post_type: string;
  format: string;
  image_style: string | null;
  aspect_ratio: string | null;
  image_model: string | null;
  image_size: string | null;
  hook: string | null;
  caption: string | null;
  cta: string | null;
  hashtags: string | null;
  image_prompt: string | null;
  image_url: string | null;
  typographic_card_url: string | null;
  created_at: string;
};

export type GeneratedContent = {
  hook: string;
  caption: string;
  cta: string;
  hashtags: string;
  image_prompt: string;
};

export type ScrapeResult = {
  url: string;
  title: string;
  description: string;
  headlines: string;
  body_text: string;
  colors: string[];
  primary_color: string;
  secondary_color: string;
  logo_url: string;
};

export type GeminiAnalysis = {
  brand_name: string;
  product_type: string;
  tone: string;
  target_audience: string;
  value_proposition: string;
  key_pain: string;
  language: string;
  emoji_style: string;
};

export type AppView = 'landing' | 'list' | 'create' | 'edit' | 'detail';
