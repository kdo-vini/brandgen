export type Brand = {
  id: string;
  user_id?: string;
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
  prova_disponivel: string | null;
  claim_restrictions: string | null;
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
  user_id?: string;
  brand_id: string;
  type: 'product_photo' | 'reference' | 'logo' | 'packaging' | 'environment';
  url: string;
  filename: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type GeneratedPost = {
  id: string;
  user_id?: string;
  brand_id: string;
  post_type: string;
  objective?: string | null;
  format: string;
  image_style: string | null;
  aspect_ratio: string | null;
  image_model: string | null;
  image_size: string | null;
  hook: string | null;
  caption: string | null;
  cta: string | null;
  hashtags: string | null;
  image_text?: string | null;
  image_prompt: string | null;
  image_url: string | null;
  typographic_card_url: string | null;
  strategy_json?: StrategyInsight | null;
  copy_json?: Record<string, unknown> | null;
  visual_brief_json?: VisualBrief | null;
  critic_json?: CreativeCritic | null;
  selected_asset_ids?: string[] | null;
  generation_mode?: string | null;
  prompt_version_strategy?: string | null;
  prompt_version_copy?: string | null;
  prompt_version_visual?: string | null;
  prompt_version_critic?: string | null;
  human_edits_json?: Record<string, { original: string; edited: string; editedAt: string }> | null;
  regeneration_counts_json?: Record<string, number> | null;
  created_at: string;
};

export type StrategyInsight = {
  objective: string;
  angle: string;
  copyApproach: string;
  captionBlueprint: string;
  emotionalVector: string;
  rationale: string;
  imageText: string;
};

export type VisualBrief = {
  modelRecommendation: "imagen" | "nanoBanana";
  visualGoal: string;
  composition: string;
  layout: string;
  background: string;
  productRole: string;
  textTreatment: string;
  avoid: string[];
};

export type CreativeCritic = {
  overallScore: number;
  brandFit: number;
  categoryFit: number;
  clarity: number;
  originality: number;
  conversionReadiness: number;
  aiSlopRisk: number;
  verdict: string;
  recommendedFix: string;
  notes: string[];
};

export type GeneratedContent = {
  hook: string;
  caption: string;
  cta: string;
  hashtags: string;
  image_text?: string;
  image_prompt: string;
  strategy?: StrategyInsight | null;
  visual_brief?: VisualBrief | null;
  critic?: CreativeCritic | null;
  prompt_versions?: Record<string, string> | null;
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

export type AppView = 'landing' | 'list' | 'create' | 'edit' | 'detail' | 'profile' | 'reset-password';
