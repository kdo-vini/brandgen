import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Wand2, ArrowLeft, Copy, Check, Download, Palette, Image as ImageIcon, Type as TypeIcon, RefreshCw, Pencil, Package, Clock, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Brand, GeneratedContent, BrandAsset } from '../types';
import AssetUploader from './AssetUploader';
import PostHistory from './PostHistory';
import TypographicCard from './TypographicCard';

type Props = {
  user: User;
  brand: Brand;
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

const formats = [
  'Feed quadrado (1080x1080)',
  'Story vertical (1080x1920)',
  'Capa de Destaque (1080x1920, foco central)'
];

const imageStyles = [
  'Post Profissional (Canva-style)',
  'Fotográfico Realista',
  'Dark Mode Premium',
  'Gradiente Moderno',
  'Minimalista Clean',
  'Cinematográfico (estúdio)',
  'Neon / Futurista'
];

const imageStyleDescriptions: Record<string, string> = {
  'Post Profissional (Canva-style)': 'A professional social media post design with a polished layout. Use a dark or branded background with smooth gradients. Include bold, modern sans-serif headline text overlaid on the design. Feature high-quality product photography or lifestyle imagery composited onto the background. Add subtle design elements like geometric shapes, light flares, glowing accents, or abstract decorative lines. The overall look should resemble a premium Canva or Adobe Express template used for Instagram or LinkedIn marketing.',
  'Fotográfico Realista': 'A photorealistic social media post. Use a high-quality photograph as the hero element — either a product shot on a professional background or a lifestyle scene. Add a subtle color overlay or vignette matching the brand colors. The image should look like a professional marketing photo taken in a studio or real environment, suitable for an Instagram feed.',
  'Dark Mode Premium': 'A sleek dark-themed social media post with a near-black or deep navy background. Feature bold white or bright-colored headline typography. Include glowing accent elements, subtle neon highlights, or luminous gradients. Showcase the product or a relevant object with dramatic studio lighting against the dark backdrop. The overall aesthetic should feel premium, tech-forward, and modern — like a high-end SaaS or tech product announcement.',
  'Gradiente Moderno': 'A vibrant social media post with a bold, eye-catching gradient background blending the brand colors smoothly. Feature large, impactful sans-serif headline text in white or contrasting color. Include floating product images, mockups, or relevant icons/graphics arranged in a dynamic diagonal or layered composition. Add subtle glassmorphism effects, soft shadows, or frosted glass panels. The design should feel trendy and energetic.',
  'Minimalista Clean': 'A clean, minimalist social media post design. Use a soft, light background (white, off-white, or very light pastel). Feature elegant thin and medium-weight typography with generous whitespace. Show the product or subject centered with soft shadows. Use the brand accent color sparingly in small details — a thin border, an accent line, or a small icon. The overall feel should be modern, airy, and sophisticated like a premium brand lookbook.',
  'Cinematográfico (estúdio)': 'A cinematic, studio-quality social media post. Feature moody, dramatic lighting with deep shadows and selective highlights on the product or subject. Use a dark background with rich color tones — teal, amber, deep purple. The image should look like a frame from a high-budget commercial or movie. Add subtle lens flares, bokeh, or film grain for authenticity. Include bold, minimal text in a cinematic sans-serif or serif font.',
  'Neon / Futurista': 'A futuristic cyber/neon themed social media post. Use a dark background with vibrant neon glow effects in electric blue, pink, purple, or green. Feature the product or subject illuminated by neon lights. Include digital grid lines, holographic effects, or futuristic HUD-style decorative elements. Bold, glowing typography with neon outline effects. The overall aesthetic should feel like cyberpunk or sci-fi marketing material.',
};

const aspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9", "1:4", "1:8", "4:1", "8:1"];
const imageModels = [
  { id: 'imagen-4.0-ultra-generate-001', name: '⭐ Imagen 4 Ultra (Melhor qualidade)', type: 'imagen' },
  { id: 'imagen-4.0-generate-001', name: 'Imagen 4 (Alta qualidade)', type: 'imagen' },
  { id: 'imagen-4.0-fast-generate-001', name: 'Imagen 4 Fast (Rápido)', type: 'imagen' },
  { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro (Thinking)', type: 'nanoBanana' },
  { id: 'gemini-3.1-flash-image-preview', name: 'Nano Banana 2 Flash', type: 'nanoBanana' }
];
const imageSizes = ["1K", "2K"];

type EditableFieldProps = {
  label: string;
  fieldKey: keyof GeneratedContent;
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

export default function BrandDetail({ user, brand, onBack, onEdit, onError, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  // Generator state
  const [postType, setPostType] = useState(postTypes[0].id);
  const [format, setFormat] = useState('Feed quadrado (1080x1080)');
  const [imageStyle, setImageStyle] = useState('Post Profissional (Canva-style)');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageModel, setImageModel] = useState('imagen-4.0-ultra-generate-001');
  const [imageSize, setImageSize] = useState('1K');
  const [includeText, setIncludeText] = useState(true);

  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState('');
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [editedContent, setEditedContent] = useState<GeneratedContent | null>(null);
  const [editingField, setEditingField] = useState<keyof GeneratedContent | null>(null);
  const [regeneratingField, setRegeneratingField] = useState<keyof GeneratedContent | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

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

      // Update brand in parent
      brand.colors = scraped.colors;
      brand.primary_color = scraped.primary_color;
      brand.secondary_color = scraped.secondary_color;
      brand.logo_url = scraped.logo_url;

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

    try {
      // Fetch assets for extra context
      const { data: assets } = await supabase
        .from('brand_assets')
        .select('url, filename, type')
        .eq('brand_id', brand.id);

      const styleDescription = imageStyleDescriptions[imageStyle] || imageStyleDescriptions['Post Profissional (Canva-style)'];

      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          postType,
          postVisualHint: postTypes.find(p => p.id === postType)?.visualHint || '',
          format,
          imageStyle,
          includeText,
          imageStyleDescription: styleDescription,
          assetCount: assets?.length || 0,
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

      // Save to generated_posts and capture the row ID
      const { data: insertedPost } = await supabase
        .from('generated_posts')
        .insert({
          user_id: user.id,
          brand_id: brand.id,
          post_type: postType,
          format,
          image_style: imageStyle,
          aspect_ratio: aspectRatio,
          image_model: imageModel,
          image_size: imageSize,
          hook: content.hook,
          caption: content.caption,
          cta: content.cta,
          hashtags: content.hashtags,
          image_prompt: content.image_prompt,
        })
        .select('id')
        .single();

      if (insertedPost?.id) setCurrentPostId(insertedPost.id);

      onSuccess?.('Post criado! Agora é só copiar 🔥');

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'A IA viajou 😅 Tenta mais uma vez?';
      onError?.(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedContent) return;

    setIsGeneratingImage(true);

    try {
      const selectedModel = imageModels.find(m => m.id === imageModel);

      const imageRes = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editablePrompt,
          imageModel,
          aspectRatio,
          imageSize,
          modelType: selectedModel?.type || 'imagen',
        })
      });

      if (!imageRes.ok) {
        const errData = await imageRes.json();
        throw new Error(errData.error || 'Deu ruim na imagem 🙈 Tenta de novo?');
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

            if (publicData?.publicUrl && currentPostId) {
              await supabase
                .from('generated_posts')
                .update({ image_url: publicData.publicUrl })
                .eq('id', currentPostId);
            }
          }
        } catch (uploadErr) {
          // Image is displayed locally even if upload fails — not critical
          console.warn('Failed to persist image to storage:', uploadErr);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Deu ruim na imagem 🙈 Tenta de novo?';
      onError?.(message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleRegenerateField = async (field: keyof GeneratedContent) => {
    if (!editedContent) return;
    setRegeneratingField(field);
    try {
      const { data: assets } = await supabase
        .from('brand_assets')
        .select('url, filename, type')
        .eq('brand_id', brand.id);

      const styleDescription = imageStyleDescriptions[imageStyle] || imageStyleDescriptions['Post Profissional (Canva-style)'];

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          postType,
          format,
          imageStyle,
          includeText,
          imageStyleDescription: styleDescription,
          assetCount: assets?.length || 0,
          regenerateField: field,
          currentContent: editedContent,
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Deu ruim ao refazer 😬');
      }

      const newContent: GeneratedContent = await res.json();
      setEditedContent(prev => prev ? { ...prev, [field]: newContent[field] } : prev);
      if (field === 'image_prompt') setEditablePrompt(newContent[field]);

      const fieldNames: Record<keyof GeneratedContent, string> = {
        hook: 'Hook', caption: 'Legenda', cta: 'CTA', hashtags: 'Hashtags', image_prompt: 'Prompt'
      };
      onSuccess?.(`${fieldNames[field]} refeito! 🔄`);
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : 'Deu ruim ao refazer 😬');
    } finally {
      setRegeneratingField(null);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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
    { id: 'generate', label: 'Criar post ✨', icon: <Wand2 className="h-4 w-4" /> },
    { id: 'assets', label: 'Assets 📸', icon: <Package className="h-4 w-4" /> },
    { id: 'history', label: 'Histórico 📋', icon: <Clock className="h-4 w-4" /> },
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
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFE0D0] text-[#1A1A2E] capitalize">{brand.product_type}</span>
                )}
                {brand.tone && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 capitalize">{brand.tone}</span>
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
            <h4 className="text-xs font-medium text-neutral-500 mb-1">Proposta de Valor</h4>
            <p className="text-sm text-neutral-800 truncate">{brand.value_proposition || '—'}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-neutral-500 mb-1">Dor Principal</h4>
            <p className="text-sm text-neutral-800 truncate">{brand.key_pain || '—'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-neutral-100 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
              ? 'bg-white text-neutral-900 shadow-sm'
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
                <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo de post</label>
                <select value={postType} onChange={(e) => setPostType(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm rounded-lg border">
                  {postTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Formato</label>
                <div className="space-y-2">
                  {formats.map(f => (
                    <div key={f} className="flex items-center">
                      <input id={f} name="format" type="radio" checked={format === f} onChange={() => setFormat(f)} className="focus:ring-[#FF6B35] h-4 w-4 text-[#FF6B35] border-neutral-300" />
                      <label htmlFor={f} className="ml-3 block text-sm font-medium text-neutral-700">{f}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Estilo visual</label>
                <select value={imageStyle} onChange={(e) => setImageStyle(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm rounded-lg border">
                  {imageStyles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Modelo de IA</label>
                <select value={imageModel} onChange={(e) => setImageModel(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm rounded-lg border">
                  {imageModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Proporção</label>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm rounded-lg border">
                    {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Resolução</label>
                  <select value={imageSize} onChange={(e) => setImageSize(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm rounded-lg border">
                    {imageSizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Texto na imagem</label>
                  <p className="text-xs text-neutral-500">Adicionar título/headline na imagem gerada</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeText(!includeText)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${includeText ? 'bg-[#FF6B35]' : 'bg-neutral-300'
                    }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${includeText ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerateContent}
                disabled={isGenerating}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 transition-colors"
              >
                {isGenerating ? (
                  <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> A IA tá inspirada... ✍️</>
                ) : (
                  <><Wand2 className="-ml-1 mr-2 h-4 w-4" /> Criar conteúdo 🔥</>
                )}
              </motion.button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence>
              {generatedContent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-neutral-900 font-display">Seu post tá pronto! 🎉</h2>
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
                        onSave={val => { setEditedContent(prev => prev ? { ...prev, hook: val } : prev); setEditingField(null); }}
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
                        onSave={val => { setEditedContent(prev => prev ? { ...prev, caption: val } : prev); setEditingField(null); }}
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
                        onSave={val => { setEditedContent(prev => prev ? { ...prev, cta: val } : prev); setEditingField(null); }}
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
                        onSave={val => { setEditedContent(prev => prev ? { ...prev, hashtags: val } : prev); setEditingField(null); }}
                        onRegenerate={() => handleRegenerateField('hashtags')}
                        multiline
                        className="text-neutral-500"
                      />
                    </motion.div>
                  </div>
                  <div className="px-6 pb-4">
                    <p className="text-xs text-neutral-400">💡 Clica em qualquer texto pra editar, ou usa "refazer" pra gerar só aquele campo de novo</p>
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
                    <textarea
                      value={editablePrompt}
                      onChange={(e) => setEditablePrompt(e.target.value)}
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
                    <div className="mt-3 flex flex-col sm:flex-row gap-4">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !editablePrompt.trim()}
                        className="flex-1 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF6B35] hover:bg-[#E55A28] disabled:opacity-50 transition-colors"
                      >
                        {isGeneratingImage ? (
                          <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Pintando... 🖌️</>
                        ) : (
                          <><ImageIcon className="-ml-1 mr-2 h-4 w-4" /> Gerar imagem 🎨</>
                        )}
                      </motion.button>
                      <button
                        onClick={downloadCard}
                        disabled={!generatedContent}
                        className="flex-1 flex justify-center items-center py-2.5 px-4 border border-neutral-300 rounded-lg shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-40 transition-colors"
                      >
                        <Download className="-ml-1 mr-2 h-4 w-4" /> Baixar card
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visual Previews */}
            <div className={`grid gap-6 ${generatedContent && generatedImageUrl ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {generatedContent && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">Card tipográfico</h3>

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
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">Imagem gerada</h3>
                  <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center p-4">
                    <img src={generatedImageUrl} alt="Imagem gerada por IA" className="max-w-full h-auto shadow-md rounded" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                  </div>
                </div>
              )}
            </div>

            {!generatedContent && !isGenerating && (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Wand2 className="h-8 w-8 text-neutral-300 mb-3" />
                <p className="text-sm text-neutral-400">Escolha o tipo de post acima e manda ver! 👆</p>
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
    </div>
  );
}
