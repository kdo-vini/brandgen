import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Wand2, ArrowLeft, Copy, Check, Download, Palette, Image as ImageIcon, Type as TypeIcon, RefreshCw, Pencil, Package, Clock, ChevronDown, ChevronUp, Target, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Brand, GeneratedContent, BrandAsset } from '../types';
import type { SubscriptionInfo, UsageInfo } from '../lib/subscription';
import { canGenerateImage } from '../lib/subscription';
import UpgradeModal from './UpgradeModal';
import { formatProductTypeLabel } from '../lib/brandMeta';
import {
  CTA_INTENSITY_OPTIONS,
  DEFAULT_MARKETER_PREFERENCES,
  EMOJI_USAGE_OPTIONS,
  OBJECTIVE_OPTIONS,
  TONE_OVERRIDE_OPTIONS,
  type MarketerPreferences,
} from '../lib/marketerControls';
import AssetUploader from './AssetUploader';
import PostHistory from './PostHistory';
import TypographicCard from './TypographicCard';

type Props = {
  user: User;
  brand: Brand;
  subscription: SubscriptionInfo;
  usage: UsageInfo;
  onBack: () => void;
  onEdit: (brand: Brand) => void;
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
};

type Tab = 'generate' | 'assets' | 'history';

const postTypes: { id: string; label: string; visualHint: string }[] = [
  // Consciência / topo de funil
  { id: 'Dor do cliente', label: '😩 Dor do cliente', visualHint: 'Show a frustrated or overwhelmed person facing a recognizable problem. Use tension in the composition — darker tones, contrast lighting.' },
  { id: 'Solução / produto', label: '✅ Solução / produto', visualHint: 'Showcase the product or service as the hero. Use bright, positive lighting and a clean composition that highlights the solution clearly.' },
  { id: 'Lançamento', label: '🚀 Lançamento / novidade', visualHint: 'Create a dramatic, energetic visual with bold colors, explosive shapes or particles suggesting a launch. Use vibrant accent colors and dynamic composition.' },
  { id: 'Oferta relâmpago', label: '⚡ Oferta relâmpago', visualHint: 'Create urgency with bold red, orange or yellow accents. Use visual elements like countdown or lightning bolt shapes. High contrast, immediately eye-catching.' },

  // Confiança / meio de funil
  { id: 'Prova social / depoimento', label: 'Prova social / depoimento', visualHint: 'Feature a close-up of a happy customer or a testimonial quote overlay. Warm, trustworthy color palette. Candid or portrait photography style.' },
  { id: 'Bastidores / founder', label: 'Bastidores / founder story', visualHint: 'Show a real, behind-the-scenes moment — the founder working, a workspace, or a candid team shot. Authentic and relatable. Use warm, lifestyle photography tones.' },
  { id: 'Comparação antes/depois', label: 'Antes e depois', visualHint: 'Split-screen or side-by-side composition showing contrast between the problem state and the result state. Strong visual contrast between the two halves.' },
  { id: 'Número / resultado', label: 'Número / resultado', visualHint: 'Feature a large, bold statistic or result number as the focal point. Professional data-visualization style with brand colors.' },

  // Engajamento / conexão
  { id: 'Pergunta / enquete', label: 'Pergunta / enquete', visualHint: 'Use an intriguing visual that sparks curiosity. Minimalist background with a bold central question or thought. Inviting and conversational tone.' },
  { id: 'Dica / tutorial', label: 'Dica / tutorial', visualHint: 'Clean educational layout with numbered steps or a visual tip. Use icons, arrows or callouts overlaid on a light or branded background.' },
  { id: 'Mito vs. Verdade', label: 'Mito vs. Verdade', visualHint: 'Bold comparison visual with two contrasting sides — one with a red/negative tone for the myth, one with green/positive for the truth.' },
  { id: 'Citação inspiracional', label: 'Citação inspiracional', visualHint: 'Elegant typographic quote design. Soft background with stylized typography as the hero. Optional: subtle bokeh or texture background.' },

  // Conversão / fundo de funil
  { id: 'CTA / oferta direta', label: 'CTA / oferta direta', visualHint: 'High-impact visual with a strong, direct call-to-action. Bold button-like elements or arrows pointing to the offer. Use the brand primary color prominently.' },
  { id: 'Evento / webinar', label: 'Evento / webinar', visualHint: 'Professional event announcement design with date and time prominently featured. Polished, corporate aesthetic with brand colors and clean layout.' },
];

const formatOptions = [
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

const imageStyles = [
  'Post Profissional (Canva)',
  'Fotográfico Realista',
  'Dark Mode Premium (Escuro)',
  'Gradiente Moderno',
  'Minimalista (Clean)',
  'Cinematográfico (Estúdio)',
  'Neon / Futurista'
];

const formatAspectRatios: Record<string, string> = {
  'Feed quadrado (1080x1080)': '1:1',
  'Story vertical (1080x1920)': '9:16',
  'Capa de Destaque (1080x1920, foco central)': '9:16',
};
const imageModels = [
  { id: 'auto', name: 'Automático (Recomendado)', type: 'auto' },
  { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro', type: 'nanoBanana' },
  { id: 'gemini-3.1-flash-image-preview', name: 'Nano Banana Flash', type: 'nanoBanana' },
  { id: 'imagen-4.0-ultra-generate-001', name: 'Imagen 4 Ultra', type: 'imagen' },
  { id: 'imagen-4.0-generate-001', name: 'Imagen 4', type: 'imagen' },
  { id: 'imagen-4.0-fast-generate-001', name: 'Imagen 4 Fast', type: 'imagen' }
];

const modelFriendlyName: Record<string, string> = {
  'gemini-3-pro-image-preview': 'Nano Banana Pro',
  'gemini-3.1-flash-image-preview': 'Nano Banana Flash',
  'imagen-4.0-ultra-generate-001': 'Imagen 4 Ultra',
  'imagen-4.0-generate-001': 'Imagen 4',
  'imagen-4.0-fast-generate-001': 'Imagen 4 Fast',
};

function resolveImageModel(
  imageModelSetting: string,
  hasAssets: boolean,
  visualBriefRecommendation: 'imagen' | 'nanoBanana' | undefined,
  imageStyle: string,
): { id: string; type: 'imagen' | 'nanoBanana' } {
  if (imageModelSetting !== 'auto') {
    const found = imageModels.find(m => m.id === imageModelSetting);
    return { id: imageModelSetting, type: (found?.type as 'imagen' | 'nanoBanana') || 'imagen' };
  }
  // Assets selecionados → edição real com Nano Banana
  if (hasAssets) return { id: 'gemini-3-pro-image-preview', type: 'nanoBanana' };
  // Visual brief recomendou nanoBanana
  if (visualBriefRecommendation === 'nanoBanana') return { id: 'gemini-3-pro-image-preview', type: 'nanoBanana' };
  // Estilos de alta fidelidade fotográfica → Imagen Ultra
  if (/fotografico|cinemato/i.test(imageStyle)) return { id: 'imagen-4.0-ultra-generate-001', type: 'imagen' };
  // Default: Imagen 4 balanceado
  return { id: 'imagen-4.0-generate-001', type: 'imagen' };
}
const imageSizes = ["1K", "2K"];

const toneLabels: Record<string, string> = {
  formal: 'Formal',
  casual: 'Casual',
  bold: 'Ousado',
  friendly: 'Amigável',
};

const emojiStyleLabels: Record<string, string> = {
  minimal: 'Pouco emoji',
  moderate: 'Emoji moderado',
  heavy: 'Muito emoji',
};

function stripLeadingSymbol(value: string) {
  return value.replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

function formatToneLabel(value?: string | null) {
  if (!value) return 'Sem tom definido';
  return toneLabels[value] || value;
}

function formatEmojiStyleLabel(value?: string | null) {
  if (!value) return 'Não mapeado';
  return emojiStyleLabels[value] || value;
}

function looksLikeSchemaError(message?: string) {
  return /schema cache|column|Could not find/i.test(message || '');
}

type EditableGeneratedField = 'hook' | 'caption' | 'cta' | 'hashtags' | 'image_text' | 'image_prompt';

type EditableFieldProps = {
  label: string;
  fieldKey: EditableGeneratedField;
  value: string;
  isEditing: boolean;
  isRegenerating: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
  onRegenerate: () => void;
  multiline?: boolean;
  className?: string;
};

function EditableField({ label, value, isEditing, isRegenerating, onEdit, onSave, onRegenerate, multiline = false, className = '' }: EditableFieldProps) {
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => { setLocalValue(value); }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); onSave(localValue); }
    if (e.key === 'Escape') onSave(localValue);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{label}</h4>
        <div className="flex items-center gap-2">
          {isRegenerating ? (
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> refazendo...
            </span>
          ) : (
            <button
              onClick={onRegenerate}
              className="text-xs text-neutral-400 hover:text-[#FF6B35] transition-colors flex items-center gap-1"
              title="Regerar só esse campo"
            >
              <RefreshCw className="h-3 w-3" /> refazer
            </button>
          )}
        </div>
      </div>
      {isEditing ? (
        multiline ? (
          <textarea
            autoFocus
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            onBlur={() => onSave(localValue)}
            onKeyDown={handleKeyDown}
            rows={4}
            className="w-full text-sm text-neutral-700 bg-neutral-50 border border-[#FF6B35] rounded-lg p-2 focus:outline-none resize-none"
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            onBlur={() => onSave(localValue)}
            onKeyDown={handleKeyDown}
            className={`w-full text-sm bg-neutral-50 border border-[#FF6B35] rounded-lg p-2 focus:outline-none ${className}`}
          />
        )
      ) : (
        <p
          onClick={onEdit}
          title="Clica pra editar"
          className={`text-sm cursor-text hover:bg-neutral-50 rounded-lg p-1 -mx-1 transition-colors ${multiline ? 'text-neutral-700 whitespace-pre-wrap' : ''} ${className}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

export default function BrandDetail({ user, brand, subscription, usage, onBack, onEdit, onError, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Generator state
  const [postType, setPostType] = useState(postTypes[0].id);
  const [format, setFormat] = useState('Feed quadrado (1080x1080)');
  const [imageStyle, setImageStyle] = useState('Post Profissional (Canva)');
  const [imageModel, setImageModel] = useState('auto');
  const [imageSize, setImageSize] = useState('1K');
  const [includeText, setIncludeText] = useState(true);

  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState('');
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [editedContent, setEditedContent] = useState<GeneratedContent | null>(null);
  const [editingField, setEditingField] = useState<EditableGeneratedField | null>(null);
  const [regeneratingField, setRegeneratingField] = useState<EditableGeneratedField | null>(null);
  const [availableAssets, setAvailableAssets] = useState<BrandAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [marketerPreferences, setMarketerPreferences] = useState<MarketerPreferences>(DEFAULT_MARKETER_PREFERENCES);
  const [advancedControlsOpen, setAdvancedControlsOpen] = useState(false);
  const [angleControlsOpen, setAngleControlsOpen] = useState(false);
  const [criticGateAcknowledged, setCriticGateAcknowledged] = useState(false);
  const [humanEdits, setHumanEdits] = useState<Record<string, { original: string; edited: string; editedAt: string }>>({});
  const [regenerationCounts, setRegenerationCounts] = useState<Record<string, number>>({});

  const cardRef = useRef<HTMLDivElement>(null);
  const selectedModel = imageModels.find(model => model.id === imageModel);
  const selectedAssets = availableAssets.filter(asset => selectedAssetIds.includes(asset.id));
  const aspectRatio = formatAspectRatios[format] || '1:1';
  const resolvedModel = resolveImageModel(
    imageModel,
    selectedAssets.length > 0,
    generatedContent?.visual_brief?.modelRecommendation,
    imageStyle,
  );
  const marketerSummary = [
    OBJECTIVE_OPTIONS.find(option => option.value === marketerPreferences.objective)?.label || marketerPreferences.objective,
    TONE_OVERRIDE_OPTIONS.find(option => option.value === marketerPreferences.toneOverride)?.label || marketerPreferences.toneOverride,
    EMOJI_USAGE_OPTIONS.find(option => option.value === marketerPreferences.emojiUsage)?.label || marketerPreferences.emojiUsage,
    `CTA ${(CTA_INTENSITY_OPTIONS.find(option => option.value === marketerPreferences.ctaIntensity)?.label || marketerPreferences.ctaIntensity).toLowerCase()}`,
  ].join(' · ');

  const hasCriticWarning = !!(
    generatedContent?.critic &&
    (generatedContent.critic.overallScore < 7 || generatedContent.critic.aiSlopRisk > 4)
  );

  const updateMarketerPreference = <K extends keyof MarketerPreferences>(key: K, value: MarketerPreferences[K]) => {
    setMarketerPreferences(prev => ({ ...prev, [key]: value }));
  };

  const fetchAssets = async () => {
    setAssetsLoading(true);

    const { data, error } = await supabase
      .from('brand_assets')
      .select('*')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const nextAssets = data as BrandAsset[];
      setAvailableAssets(nextAssets);
      setSelectedAssetIds(prev => prev.filter(id => nextAssets.some(asset => asset.id === id)));
    }

    setAssetsLoading(false);
  };

  useEffect(() => {
    void fetchAssets();
  }, [brand.id, activeTab]);

  useEffect(() => {
    setMarketerPreferences(DEFAULT_MARKETER_PREFERENCES);
  }, [brand.id]);

  const buildGeneratedPostPayload = (
    content: GeneratedContent,
    overrides: Partial<Record<'hook' | 'caption' | 'cta' | 'hashtags' | 'image_text' | 'image_prompt' | 'image_url', string | null>> = {},
  ) => {
    const imagePromptValue = (overrides.image_prompt ?? editablePrompt ?? content.image_prompt ?? '').trim();
    const basePayload = {
      user_id: user.id,
      brand_id: brand.id,
      post_type: postType,
      format,
      image_style: imageStyle,
      aspect_ratio: aspectRatio,
      image_model: imageModel,
      image_size: imageSize,
      hook: (overrides.hook ?? content.hook ?? '').trim(),
      caption: (overrides.caption ?? content.caption ?? '').trim(),
      cta: (overrides.cta ?? content.cta ?? '').trim(),
      hashtags: (overrides.hashtags ?? content.hashtags ?? '').trim(),
      image_prompt: imagePromptValue,
      ...(overrides.image_url !== undefined ? { image_url: overrides.image_url } : {}),
    };

    const extendedPayload = {
      ...basePayload,
      objective: content.strategy?.objective || marketerPreferences.objective || null,
      image_text: overrides.image_text !== undefined ? overrides.image_text : (content.image_text || null),
      strategy_json: content.strategy || null,
      copy_json: {
        hook: basePayload.hook,
        caption: basePayload.caption,
        cta: basePayload.cta,
        hashtags: basePayload.hashtags,
        image_text: overrides.image_text !== undefined ? overrides.image_text : (content.image_text || null),
      },
      visual_brief_json: content.visual_brief || null,
      critic_json: content.critic || null,
      selected_asset_ids: selectedAssetIds,
      generation_mode: selectedAssets.length > 0
        ? (selectedModel?.type === 'nanoBanana' ? 'asset_edit' : 'asset_reference')
        : 'text_to_image',
      prompt_version_strategy: content.prompt_versions?.strategy || null,
      prompt_version_copy: content.prompt_versions?.copy || null,
      prompt_version_visual: content.prompt_versions?.visual || null,
      prompt_version_critic: content.prompt_versions?.critic || null,
      human_edits_json: Object.keys(humanEdits).length > 0 ? humanEdits : null,
      regeneration_counts_json: Object.keys(regenerationCounts).length > 0 ? regenerationCounts : null,
    };

    return { basePayload, extendedPayload };
  };

  const syncCurrentPost = async (
    overrides: Partial<Record<'hook' | 'caption' | 'cta' | 'hashtags' | 'image_text' | 'image_prompt' | 'image_url', string | null>> = {},
  ) => {
    if (!currentPostId || !editedContent) return;

    const { basePayload, extendedPayload } = buildGeneratedPostPayload(editedContent, overrides);
    let errorMessage = '';

    const { error: extendedError } = await supabase
      .from('generated_posts')
      .update(extendedPayload)
      .eq('id', currentPostId);

    if (!extendedError) return;

    errorMessage = extendedError.message || '';
    if (!looksLikeSchemaError(errorMessage)) {
      throw extendedError;
    }

    const { error: fallbackError } = await supabase
      .from('generated_posts')
      .update(basePayload)
      .eq('id', currentPostId);

    if (fallbackError) {
      throw fallbackError;
    }
  };

  const saveFieldToHistory = (field: EditableGeneratedField, value: string) => {
    const originalValue = (generatedContent?.[field as keyof GeneratedContent] as string) || '';
    if (value !== originalValue) {
      setHumanEdits(prev => ({
        ...prev,
        [field]: { original: originalValue, edited: value, editedAt: new Date().toISOString() },
      }));
    }

    setEditedContent(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });

    if (currentPostId) {
      void syncCurrentPost({
        hook: field === 'hook' ? value : null,
        caption: field === 'caption' ? value : null,
        cta: field === 'cta' ? value : null,
        hashtags: field === 'hashtags' ? value : null,
        image_text: field === 'image_text' ? value : null,
        image_prompt: field === 'image_prompt' ? value : null,
      }).catch(() => {
        onError?.('Atualizei na tela, mas não consegui salvar no histórico.');
      });
    }
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      }

      if (prev.length >= 3) {
        onError?.('Escolhe até 3 assets por vez pra IA não viajar.');
        return prev;
      }

      return [...prev, assetId];
    });
  };

  const GENERATION_STAGES = [
    { pct: 12, msg: 'Estudando sua marca... 🧠', delay: 800 },
    { pct: 28, msg: 'Definindo o ângulo do post... 💡', delay: 4500 },
    { pct: 48, msg: 'Escrevendo o copy... ✍️', delay: 10000 },
    { pct: 65, msg: 'Construindo o brief visual... 🎨', delay: 16000 },
    { pct: 82, msg: 'O crítico tá avaliando o conteúdo... 🔍', delay: 22000 },
    { pct: 92, msg: 'Finalizando os detalhes... ⚡', delay: 28000 },
    { pct: 97, msg: 'Quase lá, segura mais um segundo... 🙏', delay: 35000 },
  ];

  useEffect(() => {
    if (!isGenerating) {
      setGenerationProgress(0);
      setGenerationStep('');
      return;
    }
    setGenerationProgress(0);
    setGenerationStep(GENERATION_STAGES[0].msg);

    const timers = GENERATION_STAGES.map(({ pct, msg, delay }) =>
      setTimeout(() => {
        setGenerationProgress(pct);
        setGenerationStep(msg);
      }, delay)
    );

    // Lógica para que a barra não pare completamente se demorar mais que o previsto
    const creepInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 99) return 99;
        if (prev >= 97) return prev + 0.1; // Sobe bem devagarzinho no final
        return prev;
      });
    }, 1000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(creepInterval);
    };
  }, [isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRescan = async () => {
    if (!brand.url) return;
    setIsRescanning(true);

    try {
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: brand.url })
      });

      if (!scrapeRes.ok) throw new Error('Esse site não abriu pra gente 😅 Tenta de novo?');
      const scraped = await scrapeRes.json();

      await supabase
        .from('brands')
        .update({
          colors: scraped.colors,
          primary_color: scraped.primary_color,
          secondary_color: scraped.secondary_color,
          logo_url: scraped.logo_url,
          description: scraped.description,
          headlines: scraped.headlines,
          body_text: scraped.body_text,
          raw_scan_data: scraped,
          updated_at: new Date().toISOString(),
        })
        .eq('id', brand.id);

      onEdit({
        ...brand,
        colors: scraped.colors,
        primary_color: scraped.primary_color,
        secondary_color: scraped.secondary_color,
        logo_url: scraped.logo_url,
        description: scraped.description,
        headlines: scraped.headlines,
        body_text: scraped.body_text,
        raw_scan_data: scraped,
        updated_at: new Date().toISOString(),
      });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Esse site não abriu pra gente 😅 Tenta de novo?';
      onError?.(message);
    } finally {
      setIsRescanning(false);
    }
  };

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    setGeneratedImageUrl(null);
    setCurrentPostId(null);
    setHumanEdits({});
    setRegenerationCounts({});
    setCriticGateAcknowledged(false);

    try {
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          postType,
          format,
          imageStyle,
          includeText,
          imageModelType: selectedAssets.length > 0 ? 'nanoBanana' : 'imagen',
          marketerPreferences,
          selectedAssets: selectedAssets.map(({ id, url, filename, type }) => ({ id, url, filename, type })),
        })
      });

      if (!generateRes.ok) {
        const errData = await generateRes.json();
        throw new Error(errData.error || 'A IA viajou 😅 Tenta mais uma vez?');
      }

      const content: GeneratedContent = await generateRes.json();
      setGeneratedContent(content);
      setEditedContent(content);
      setEditablePrompt(content.image_prompt);

      const { basePayload, extendedPayload } = buildGeneratedPostPayload(content);
      let insertedPost: { id: string } | null = null;

      const { data: extendedInsert, error: extendedInsertError } = await supabase
        .from('generated_posts')
        .insert(extendedPayload)
        .select('id')
        .single();

      if (!extendedInsertError && extendedInsert?.id) {
        insertedPost = extendedInsert as { id: string };
      } else if (looksLikeSchemaError(extendedInsertError?.message)) {
        const { data: fallbackInsert, error: fallbackInsertError } = await supabase
          .from('generated_posts')
          .insert(basePayload)
          .select('id')
          .single();

        if (fallbackInsertError) {
          onError?.('O post saiu, mas não consegui salvar no histórico.');
        } else if (fallbackInsert?.id) {
          insertedPost = fallbackInsert as { id: string };
        }
      } else if (extendedInsertError) {
        onError?.('O post saiu, mas não consegui salvar no histórico.');
      }

      if (insertedPost?.id) {
        setCurrentPostId(insertedPost.id);
      } else {
        onError?.('O post saiu, mas não consegui salvar no histórico.');
      }

      onSuccess?.('Post criado. Agora você pode revisar e copiar.');

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'A IA viajou 😅 Tenta mais uma vez?';
      onError?.(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedContent) return;

    // Client-side image quota check
    if (!canGenerateImage(subscription.plan, usage.imageGenerations)) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGeneratingImage(true);

    try {
      await syncCurrentPost();

      const imageRes = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editablePrompt,
          imageModel: resolvedModel.id,
          aspectRatio,
          imageSize,
          modelType: resolvedModel.type,
          referenceImages: selectedAssets.map(({ id, url, filename, type }) => ({ id, url, filename, type })),
          userId: user.id,
        })
      });

      if (!imageRes.ok) {
        const errData = await imageRes.json();
        if (errData.code === 'IMAGE_LIMIT_REACHED') {
          setShowUpgradeModal(true);
          setIsGeneratingImage(false);
          return;
        }
        throw new Error(errData.error || 'Não consegui gerar a imagem. Tenta de novo?');
      }

      const { imageBase64 } = await imageRes.json();
      if (imageBase64) {
        const dataUrl = `data:image/png;base64,${imageBase64}`;
        setGeneratedImageUrl(dataUrl);

        // Upload to Supabase Storage and save URL in generated_posts
        try {
          const byteChars = atob(imageBase64);
          const byteNums = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
          const blob = new Blob([new Uint8Array(byteNums)], { type: 'image/png' });

          const fileName = `${user.id}/post-images/${brand.id}/${Date.now()}.png`;
          const { error: uploadError } = await supabase.storage
            .from('brand-assets')
            .upload(fileName, blob, { contentType: 'image/png', upsert: false });

          if (!uploadError) {
            const { data: publicData } = supabase.storage
              .from('brand-assets')
              .getPublicUrl(fileName);

            if (publicData?.publicUrl) {
              await syncCurrentPost({ image_url: publicData.publicUrl });
            }
          }
        } catch (uploadErr) {
          // Image is displayed locally even if upload fails — not critical
          console.warn('Failed to persist image to storage:', uploadErr);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não consegui gerar a imagem. Tenta de novo?';
      onError?.(message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleRegenerateField = async (field: EditableGeneratedField) => {
    if (!editedContent) return;
    setRegeneratingField(field);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          postType,
          format,
          imageStyle,
          includeText,
          imageModelType: selectedAssets.length > 0 ? 'nanoBanana' : 'imagen',
          marketerPreferences,
          selectedAssets: selectedAssets.map(({ id, url, filename, type }) => ({ id, url, filename, type })),
          regenerateField: field,
          currentContent: editedContent,
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Não consegui refazer esse campo.');
      }

      const newContent: GeneratedContent = await res.json();
      const nextContent = { ...editedContent, [field]: newContent[field] };
      setEditedContent(nextContent);
      setRegenerationCounts(prev => ({ ...prev, [field]: (prev[field] || 0) + 1 }));
      if (field === 'image_prompt') setEditablePrompt(newContent[field]);
      if (currentPostId) {
        const imagePromptOverride = field === 'image_prompt'
          ? newContent[field]
          : editablePrompt || nextContent.image_prompt;
        const { basePayload, extendedPayload } = buildGeneratedPostPayload(nextContent, {
          image_prompt: imagePromptOverride,
        });

        const { error: extendedError } = await supabase
          .from('generated_posts')
          .update(extendedPayload)
          .eq('id', currentPostId);

        if (extendedError && looksLikeSchemaError(extendedError.message)) {
          await supabase
            .from('generated_posts')
            .update(basePayload)
            .eq('id', currentPostId);
        } else if (extendedError) {
          throw extendedError;
        }
      }

      const fieldNames: Record<EditableGeneratedField, string> = {
        hook: 'Hook', caption: 'Legenda', cta: 'CTA', hashtags: 'Hashtags', image_text: 'Texto da arte', image_prompt: 'Prompt'
      };
      onSuccess?.(`${fieldNames[field]} refeito.`);
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : 'Não consegui refazer esse campo.');
    } finally {
      setRegeneratingField(null);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const markCopied = (field: string) => {
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const buildDownloadName = (suffix: string) => {
    const safeBrandName = brand.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${safeBrandName || 'criae'}-${suffix}`;
  };

  const downloadDataUrl = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.click();
  };

  const handleDownloadGeneratedImage = () => {
    if (!generatedImageUrl) return;
    downloadDataUrl(generatedImageUrl, buildDownloadName('imagem-ai.png'));
  };

  const handleCopyGeneratedImage = async () => {
    if (!generatedImageUrl) return;

    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();

      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        markCopied('generated-image');
        onSuccess?.('Imagem copiada.');
        return;
      }

      await navigator.clipboard.writeText(generatedImageUrl);
      markCopied('generated-image');
      onSuccess?.('Imagem copiada como link local.');
    } catch {
      onError?.('Não consegui copiar a imagem.');
    }
  };

  const downloadCard = () => {
    if (!cardRef.current) return;

    const cardId = 'criae-card-print';
    cardRef.current.id = cardId;

    const style = document.createElement('style');
    style.id = 'criae-print-style';
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #${cardId}, #${cardId} * { visibility: visible !important; }
        #${cardId} { position: fixed !important; left: 0 !important; top: 0 !important; width: 100vw !important; height: 100vh !important; border-radius: 0 !important; }
      }
    `;
    document.head.appendChild(style);

    window.print();

    // Clean up after the print dialog closes
    const cleanup = () => {
      const s = document.getElementById('criae-print-style');
      if (s) s.remove();
      if (cardRef.current) cardRef.current.removeAttribute('id');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'generate', label: 'Criar post', icon: <Wand2 className="h-4 w-4" /> },
    { id: 'assets', label: 'Assets', icon: <Package className="h-4 w-4" /> },
    { id: 'history', label: 'Histórico', icon: <Clock className="h-4 w-4" /> },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </button>
          <div className="flex items-center gap-3">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt="" className="w-10 h-10 object-contain rounded-lg border border-neutral-100" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: brand.primary_color }}>
                {brand.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-neutral-900">{brand.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {brand.product_type && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFE0D0] text-[#1A1A2E]">{formatProductTypeLabel(brand.product_type)}</span>
                )}
                {brand.tone && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">{formatToneLabel(brand.tone)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {brand.url && (
            <button
              onClick={handleRescan}
              disabled={isRescanning}
              className="inline-flex items-center px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
            >
              {isRescanning ? <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              {isRescanning ? 'Analisando...' : 'Atualizar dados do site'}
            </button>
          )}
          <button
            onClick={() => onEdit(brand)}
            className="inline-flex items-center px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
          </button>
        </div>
      </div>

      {/* Brand Kit Summary */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h4 className="text-xs font-medium text-neutral-500 mb-1">Cores</h4>
            <div className="flex gap-1.5">
              {brand.colors.slice(0, 5).map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border border-neutral-200" style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-neutral-500 mb-1">Público</h4>
            <p className="text-sm text-neutral-800 truncate">{brand.target_audience || '—'}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-neutral-500 mb-1">Proposta de valor</h4>
            <p className="text-sm text-neutral-800 truncate">{brand.value_proposition || '—'}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-neutral-500 mb-1">Dor Principal</h4>
            <p className="text-sm text-neutral-800 truncate">{brand.key_pain || '—'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-neutral-200 bg-[#FCFAF8] p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
              ? 'bg-white text-[#1A1A2E] shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2 font-display">
                <TypeIcon className="h-5 w-5 text-[#FF8C5A]" />
                Montar o post
              </h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Me conta do que você precisa?</label>
                <textarea
                  value={marketerPreferences.campaignBrief}
                  onChange={(e) => updateMarketerPreference('campaignBrief', e.target.value)}
                  rows={2}
                  placeholder="Ex: Promoção de pizza a R$59,90 com Coca 2L inclusa"
                  className="block w-full rounded-lg border border-neutral-300 p-3 text-sm text-neutral-700 resize-y focus:border-[#FF6B35] focus:outline-none focus:ring-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Tipo de post
                  {marketerPreferences.campaignBrief && (
                    <span className="ml-1.5 text-xs font-normal text-neutral-400">(opcional — a IA vai inferir do que você escreveu)</span>
                  )}
                </label>
                <select value={postType} onChange={(e) => setPostType(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm rounded-lg border">
                  {postTypes.map(t => <option key={t.id} value={t.id}>{stripLeadingSymbol(t.label)}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Formato</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {formatOptions.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFormat(option.id)}
                      className={`rounded-xl border px-3 py-3 text-left transition-colors ${format === option.id ? 'border-[#FF6B35] bg-[#FFF1EB] shadow-sm' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}
                    >
                      <p className="text-sm font-medium text-neutral-800">{option.label}</p>
                      <p className="mt-1 text-xs text-neutral-500">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Estilo visual</label>
                <select value={imageStyle} onChange={(e) => setImageStyle(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm rounded-lg border">
                  {imageStyles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-4 rounded-2xl border border-neutral-200 bg-[#FCFAF8] p-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-neutral-800">Direção editorial</label>
                  <p className="text-xs text-neutral-500">A Criaê planeja a estratégia antes de escrever. Aqui você só ajusta o que realmente muda a peça.</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Objetivo</label>
                    <select
                      value={marketerPreferences.objective}
                      onChange={(e) => updateMarketerPreference('objective', e.target.value as MarketerPreferences['objective'])}
                      className="block w-full rounded-lg border border-neutral-300 py-2 pl-3 pr-10 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-[#FF6B35]"
                    >
                      {OBJECTIVE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Tom</label>
                    <select
                      value={marketerPreferences.toneOverride}
                      onChange={(e) => updateMarketerPreference('toneOverride', e.target.value as MarketerPreferences['toneOverride'])}
                      className="block w-full rounded-lg border border-neutral-300 py-2 pl-3 pr-10 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-[#FF6B35]"
                    >
                      {TONE_OVERRIDE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Emoji</label>
                    <select
                      value={marketerPreferences.emojiUsage}
                      onChange={(e) => updateMarketerPreference('emojiUsage', e.target.value as MarketerPreferences['emojiUsage'])}
                      className="block w-full rounded-lg border border-neutral-300 py-2 pl-3 pr-10 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-[#FF6B35]"
                    >
                      {EMOJI_USAGE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">CTA</label>
                    <select
                      value={marketerPreferences.ctaIntensity}
                      onChange={(e) => updateMarketerPreference('ctaIntensity', e.target.value as MarketerPreferences['ctaIntensity'])}
                      className="block w-full rounded-lg border border-neutral-300 py-2 pl-3 pr-10 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-[#FF6B35]"
                    >
                      {CTA_INTENSITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Brief extra</label>
                  <textarea
                    value={marketerPreferences.creativeNotes}
                    onChange={(e) => updateMarketerPreference('creativeNotes', e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border border-neutral-300 p-3 text-sm text-neutral-700 focus:border-[#FF6B35] focus:outline-none focus:ring-[#FF6B35]"
                    placeholder="Ex: sem cara de IA, sem desconto inventado, foco em decisor de SaaS premium."
                  />
                </div>

                <div className="rounded-lg border border-neutral-200 bg-[#FCFAF8] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setAngleControlsOpen(prev => !prev)}
                    className="flex w-full items-center justify-between text-xs font-medium text-neutral-700"
                  >
                    <span className="flex items-center gap-1.5">
                      Ângulo criativo manual
                      {marketerPreferences.angleOverride && <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35]" />}
                    </span>
                    {angleControlsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {angleControlsOpen && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] text-neutral-400">Força a IA a usar esse ângulo específico no copy e na imagem. Deixa em branco pra deixar a IA decidir.</p>
                      <textarea
                        value={marketerPreferences.angleOverride}
                        onChange={(e) => updateMarketerPreference('angleOverride', e.target.value)}
                        rows={2}
                        className="block w-full rounded-lg border border-neutral-300 p-2.5 text-sm text-neutral-700 focus:border-[#FF6B35] focus:outline-none focus:ring-[#FF6B35]"
                        placeholder="Ex: contraste entre o antes e o depois usando o proprio produto como prova"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500">
                  Base da marca: <span className="font-medium text-neutral-700">{formatToneLabel(brand.tone)}</span> / emoji <span className="font-medium text-neutral-700">{formatEmojiStyleLabel(brand.emoji_style)}</span>
                </div>

                <p className="text-xs text-neutral-500">
                  Direção atual: <span className="font-medium text-neutral-700">{marketerSummary}</span>
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-neutral-800">Geração de imagem</label>
                  <p className="text-xs text-neutral-500">O formato já define a proporção automaticamente.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700">Texto na imagem</label>
                      <p className="text-xs text-neutral-500">A Criaê tenta renderizar o texto aprovado na arte final.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeText(!includeText)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${includeText ? 'bg-[#FF6B35]' : 'bg-neutral-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${includeText ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="rounded-lg border border-neutral-200 bg-[#FCFAF8] px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setAdvancedControlsOpen(prev => !prev)}
                      className="flex w-full items-center justify-between text-xs font-medium text-neutral-700"
                    >
                      <span>Ajustes avançados de imagem</span>
                      {advancedControlsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {advancedControlsOpen && (
                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-neutral-600">Modelo de imagem</label>
                          <select value={imageModel} onChange={(e) => setImageModel(e.target.value)} className="block w-full rounded-lg border border-neutral-300 py-2 pl-3 pr-10 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-[#FF6B35]">
                            {imageModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                          {imageModel !== 'auto' && (
                            <p className="mt-1 text-[11px] text-neutral-400">Em modo manual.</p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-600">Resolução</label>
                          <select value={imageSize} onChange={(e) => setImageSize(e.target.value)} className="block w-full rounded-lg border border-neutral-300 py-2 pl-3 pr-10 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-[#FF6B35]">
                            {imageSizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Assets reais</label>
                    <p className="text-xs text-neutral-500">Seleciona até 3 fotos pra guiar o copy e, com Nano Banana, editar a imagem final.</p>
                  </div>
                  <span className="text-xs font-medium text-neutral-400">{selectedAssets.length}/3</span>
                </div>

                {assetsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> carregando assets...
                  </div>
                ) : availableAssets.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableAssets.slice(0, 6).map(asset => {
                      const isSelected = selectedAssetIds.includes(asset.id);

                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => toggleAssetSelection(asset.id)}
                          className={`overflow-hidden rounded-lg border-2 text-left transition-all ${isSelected ? 'border-[#FF6B35] ring-2 ring-[#FF8C5A]/30' : 'border-transparent hover:border-neutral-300'}`}
                        >
                          <img src={asset.url} alt={asset.filename || 'Asset'} className="h-20 w-full object-cover" />
                          <div className="bg-white p-2">
                            <p className="truncate text-[11px] font-medium text-neutral-700">{asset.filename || 'Sem nome'}</p>
                            <p className="truncate text-[10px] uppercase tracking-wide text-neutral-400">{asset.type || 'asset'}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400">Sem assets ainda. Sobe umas fotos na aba Assets pra deixar a IA mais alinhada com o produto real.</p>
                )}

                {imageModel === 'auto' && (
                  <p className="text-xs text-neutral-400">
                    Modelo selecionado automaticamente: <span className="font-medium text-neutral-600">{modelFriendlyName[resolvedModel.id] || resolvedModel.id}</span>
                    {selectedAssets.length > 0 && ' (edição com assets)'}
                  </p>
                )}
              </div>

              {isGenerating ? (
                <div className="w-full rounded-lg overflow-hidden bg-neutral-100">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs text-neutral-500 truncate">{generationStep}</span>
                    <span className="text-xs font-mono font-semibold text-[#FF6B35] ml-2 shrink-0">{generationProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-200">
                    <motion.div
                      className="h-full bg-[#FF6B35]"
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGenerateContent}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors"
                >
                  <Wand2 className="-ml-1 mr-2 h-4 w-4" /> Criar conteúdo
                </motion.button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-7 space-y-6">
            {generatedContent?.strategy && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1EB] text-[#FF6B35]">
                        <Target className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Plano criativo</p>
                      <h3 className="text-base font-semibold text-neutral-900 font-display">A Criaê decidiu o ângulo antes da copy</h3>
                    </div>
                    <span className="rounded-full bg-[#FFF1EB] px-3 py-1 text-xs font-medium text-[#FF6B35]">
                      {generatedContent.strategy.objective}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-900">{generatedContent.strategy.angle}</p>
                  <p className="mt-2 text-sm text-neutral-600">{generatedContent.strategy.rationale}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-500">
                    <div className="rounded-xl bg-neutral-50 px-3 py-2">
                      <span className="block text-[11px] uppercase tracking-[0.12em] text-neutral-400">Copy</span>
                      <span className="font-medium text-neutral-700">{generatedContent.strategy.copyApproach}</span>
                    </div>
                    <div className="rounded-xl bg-neutral-50 px-3 py-2">
                      <span className="block text-[11px] uppercase tracking-[0.12em] text-neutral-400">Legenda</span>
                      <span className="font-medium text-neutral-700">{generatedContent.strategy.captionBlueprint}</span>
                    </div>
                  </div>
                </div>

                {generatedContent.critic && (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Crítica interna</p>
                        <h3 className="text-base font-semibold text-neutral-900 font-display">Checagem de qualidade antes da arte</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${generatedContent.critic.overallScore >= 8 ? 'bg-emerald-50 text-emerald-700' : generatedContent.critic.overallScore >= 6 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                        {generatedContent.critic.overallScore.toFixed(1)}/10
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700">{generatedContent.critic.verdict}</p>
                    {generatedContent.critic.recommendedFix && (
                      <p className="mt-2 text-sm text-neutral-500">
                        Ajuste mais importante: <span className="font-medium text-neutral-700">{generatedContent.critic.recommendedFix}</span>
                      </p>
                    )}
                    {(generatedContent.critic.overallScore < 7 || generatedContent.critic.aiSlopRisk > 4) && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-amber-800">Revisa antes de gerar a imagem</p>
                          {generatedContent.critic.overallScore < 7 && (
                            <p className="text-xs text-amber-700">Score geral abaixo de 7 ({generatedContent.critic.overallScore.toFixed(1)}/10). Edite ou refaça algum campo.</p>
                          )}
                          {generatedContent.critic.aiSlopRisk > 4 && (
                            <p className="text-xs text-amber-700">Risco alto de cliche de IA (aiSlopRisk {generatedContent.critic.aiSlopRisk}/10). Use "refazer" no hook ou legenda.</p>
                          )}
                          {!criticGateAcknowledged && (
                            <button
                              type="button"
                              onClick={() => setCriticGateAcknowledged(true)}
                              className="mt-1.5 text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900"
                            >
                              Entendi, gerar mesmo assim
                            </button>
                          )}
                          {criticGateAcknowledged && (
                            <p className="mt-1 text-xs font-medium text-emerald-700">Ok, pode gerar a imagem lá embaixo.</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      {([
                        { key: 'brandFit' as const, label: 'Marca' },
                        { key: 'clarity' as const, label: 'Clareza' },
                        { key: 'originality' as const, label: 'Originalidade' },
                      ]).map(({ key, label }) => {
                        const score = generatedContent.critic![key];
                        return (
                          <div key={key} className="rounded-lg bg-neutral-50 px-2 py-1.5 text-center">
                            <span className="block text-[10px] uppercase tracking-wide text-neutral-400">{label}</span>
                            <span className={`font-semibold ${score >= 7 ? 'text-emerald-600' : score >= 5 ? 'text-amber-600' : 'text-rose-600'}`}>{score}/10</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <AnimatePresence>
              {generatedContent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-neutral-900 font-display">Seu post está pronto</h2>
                    <button
                      onClick={() => copyToClipboard(`${editedContent?.hook}\n\n${editedContent?.caption}\n\n${editedContent?.cta}\n\n${editedContent?.hashtags}`, 'copy')}
                      className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-xs font-medium rounded text-neutral-700 bg-white hover:bg-neutral-50"
                    >
                      {copiedField === 'copy' ? <Check className="h-4 w-4 mr-1 text-emerald-500" /> : <Copy className="h-4 w-4 mr-1" />}
                      Copiar tudo
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                      <EditableField
                        label="Hook"
                        fieldKey="hook"
                        value={editedContent?.hook || ''}
                        isEditing={editingField === 'hook'}
                        isRegenerating={regeneratingField === 'hook'}
                        onEdit={() => setEditingField('hook')}
                        onSave={val => { saveFieldToHistory('hook', val); setEditingField(null); }}
                        onRegenerate={() => handleRegenerateField('hook')}
                        className="font-bold text-neutral-900 text-lg"
                      />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                      <EditableField
                        label="Legenda"
                        fieldKey="caption"
                        value={editedContent?.caption || ''}
                        isEditing={editingField === 'caption'}
                        isRegenerating={regeneratingField === 'caption'}
                        onEdit={() => setEditingField('caption')}
                        onSave={val => { saveFieldToHistory('caption', val); setEditingField(null); }}
                        onRegenerate={() => handleRegenerateField('caption')}
                        multiline
                      />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                      <EditableField
                        label="CTA"
                        fieldKey="cta"
                        value={editedContent?.cta || ''}
                        isEditing={editingField === 'cta'}
                        isRegenerating={regeneratingField === 'cta'}
                        onEdit={() => setEditingField('cta')}
                        onSave={val => { saveFieldToHistory('cta', val); setEditingField(null); }}
                        onRegenerate={() => handleRegenerateField('cta')}
                        className="font-medium text-[#FF6B35]"
                      />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                      <EditableField
                        label="Hashtags"
                        fieldKey="hashtags"
                        value={editedContent?.hashtags || ''}
                        isEditing={editingField === 'hashtags'}
                        isRegenerating={regeneratingField === 'hashtags'}
                        onEdit={() => setEditingField('hashtags')}
                        onSave={val => { saveFieldToHistory('hashtags', val); setEditingField(null); }}
                        onRegenerate={() => handleRegenerateField('hashtags')}
                        multiline
                        className="text-neutral-500"
                      />
                    </motion.div>
                    {editedContent?.image_text !== undefined && (
                      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
                        <EditableField
                          label="Texto na arte"
                          fieldKey="image_text"
                          value={editedContent?.image_text || ''}
                          isEditing={editingField === 'image_text'}
                          isRegenerating={regeneratingField === 'image_text'}
                          onEdit={() => setEditingField('image_text')}
                          onSave={val => { saveFieldToHistory('image_text', val); setEditingField(null); }}
                          onRegenerate={() => handleRegenerateField('image_text')}
                          className="font-medium text-neutral-700"
                        />
                      </motion.div>
                    )}
                  </div>
                  <div className="px-6 pb-4">
                    <p className="text-xs text-neutral-400">Clique em qualquer texto para editar ou use "refazer" para gerar só aquele campo de novo.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {generatedContent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: 0.15 }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2 font-display">
                      <Palette className="h-5 w-5 text-[#FF8C5A]" />
                      Prompt de imagem
                    </h2>
                    <button
                      onClick={() => copyToClipboard(editablePrompt, 'prompt')}
                      className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-xs font-medium rounded text-neutral-700 bg-white hover:bg-neutral-50"
                    >
                      {copiedField === 'prompt' ? <Check className="h-4 w-4 mr-1 text-emerald-500" /> : <Copy className="h-4 w-4 mr-1" />}
                      Copiar prompt
                    </button>
                  </div>
                  <div className="p-6">
                    {editedContent?.image_text && (
                      <div className="mb-4 rounded-xl border border-neutral-200 bg-[#FCFAF8] px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Texto aprovado na arte</p>
                        <p className="mt-1 text-sm font-medium text-neutral-800">{editedContent.image_text}</p>
                      </div>
                    )}
                    <textarea
                      value={editablePrompt}
                      onChange={(e) => setEditablePrompt(e.target.value)}
                      onBlur={() => { if (currentPostId) void syncCurrentPost({ image_prompt: editablePrompt }); }}
                      rows={6}
                      className="w-full text-sm text-neutral-700 bg-neutral-50 p-4 rounded-lg border border-neutral-200 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                      placeholder="Edite o prompt antes de gerar a imagem..."
                    />
                    <p className="text-xs text-neutral-400 mt-1">Edite livremente antes de gerar — as alterações não afetam o conteúdo do post.</p>
                    <div className="mt-4 flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => { const r = generatedContent?.image_prompt; if (r) setEditablePrompt(r); }}
                        className="inline-flex items-center px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-600 bg-white hover:bg-neutral-50 transition-colors"
                        title="Restaurar prompt gerado pela IA"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Restaurar original
                      </button>
                    </div>
                    <div className="mt-3">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !editablePrompt.trim() || (hasCriticWarning && !criticGateAcknowledged)}
                        className={`flex w-full justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors disabled:opacity-50 ${hasCriticWarning && !criticGateAcknowledged ? 'bg-neutral-400 cursor-not-allowed' : 'bg-[#FF6B35] hover:bg-[#E55A28]'}`}
                      >
                        {isGeneratingImage ? (
                          <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Gerando imagem...</>
                        ) : (
                          <><ImageIcon className="-ml-1 mr-2 h-4 w-4" /> Gerar imagem</>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visual Previews */}
            <div className={`grid gap-6 ${generatedContent && generatedImageUrl ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {generatedContent && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium text-neutral-700">Card tipográfico</h3>
                    <button
                      onClick={downloadCard}
                      className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Baixar
                    </button>
                  </div>

                  {/* Template selector */}
                  <div className="flex gap-2 mb-3" role="group" aria-label="Escolher template do card">
                    {(['Gradiente', 'Dark', 'Clean'] as const).map((label, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTemplate(i)}
                        aria-pressed={selectedTemplate === i}
                        className={`flex-1 h-8 rounded-lg border-2 transition-all text-xs font-medium ${selectedTemplate === i
                          ? 'border-[#FF6B35] bg-[#FFF1EB] text-[#FF6B35]'
                          : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 bg-white'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Card preview */}
                  <div
                    ref={cardRef}
                    className="border border-neutral-200 rounded-xl overflow-hidden bg-neutral-100"
                  >
                    <TypographicCard
                      brand={brand}
                      hook={editedContent?.hook || generatedContent.hook}
                      cta={editedContent?.cta || generatedContent.cta}
                      template={selectedTemplate}
                      isVertical={format.includes('1080x1920')}
                    />
                  </div>

                  <p className="mt-2 text-xs text-neutral-400 text-center">
                    Clique com botão direito no card pra salvar a imagem
                  </p>
                </div>
              )}

              {generatedImageUrl && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium text-neutral-700">Imagem gerada</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { void handleCopyGeneratedImage(); }}
                        className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                      >
                        {copiedField === 'generated-image' ? (
                          <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Copiar
                      </button>
                      <button
                        onClick={handleDownloadGeneratedImage}
                        className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Baixar
                      </button>
                    </div>
                  </div>
                  <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center p-4">
                    <img src={generatedImageUrl} alt="Imagem gerada por IA" className="max-w-full h-auto shadow-md rounded" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                  </div>
                </div>
              )}
            </div>

            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden bg-[#FF6B35] shadow-lg"
              >
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-end justify-between mb-1">
                    <p className="text-white/80 text-sm font-medium">{generationStep}</p>
                    <motion.span
                      key={generationProgress}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-white text-3xl font-bold font-display tabular-nums"
                    >
                      {generationProgress}%
                    </motion.span>
                  </div>
                  <div className="h-2 bg-white/25 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white rounded-full"
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <div className="bg-[#E55A28] px-6 py-3">
                  <p className="text-white/70 text-xs">
                    A Criaê tá pensando no melhor ângulo pra sua marca. Já já chega 💪
                  </p>
                </div>
              </motion.div>
            )}

            {!generatedContent && !isGenerating && (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Wand2 className="h-8 w-8 text-neutral-300 mb-3" />
                <p className="text-sm text-neutral-400">Escolha o tipo de post acima para começar.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <AssetUploader user={user} brandId={brand.id} />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <PostHistory brandId={brand.id} />
        </div>
      )}

      {showUpgradeModal && (
        <UpgradeModal user={user} reason="image_limit" onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
