import React, { useEffect, useState } from 'react';
import { Loader2, Wand2, Link as LinkIcon, Save, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Brand, ScrapeResult, GeminiAnalysis } from '../types';
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPES, normalizeProductType } from '../lib/brandMeta';

type Props = {
  user: User;
  existingBrand?: Brand | null;
  initialUrl?: string;
  onSaved: (brand: Brand) => void;
  onCancel: () => void;
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
};

const productTypeLabels: Record<string, string> = {
  saas: 'SaaS / Sistema',
  ecommerce: 'E-commerce / Loja',
  food: 'Alimentação / Gastronomia',
  service: 'Serviço / Consultoria',
  other: 'Outro'
};

const toneLabels: Record<string, string> = {
  formal: 'Formal',
  casual: 'Casual',
  bold: 'Impactante (Bold)',
  friendly: 'Amigável'
};

const languageLabels: Record<string, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'Inglês',
  es: 'Espanhol'
};

const emojiStyleLabels: Record<string, string> = {
  minimal: 'Minimalista',
  moderate: 'Moderado',
  heavy: 'Muitos emojis'
};

const productTypes = Object.keys(productTypeLabels);
const tones = Object.keys(toneLabels);
const languages = Object.keys(languageLabels);
const emojiStyles = Object.keys(emojiStyleLabels);

const loadingSteps = [
  'Abrindo o site... 🌐',
  'Lendo as cores e textos... 🎨',
  'A IA tá analisando sua marca... 🤖',
  'Quase lá, só um instante... ✨',
];

export default function BrandForm({ user, existingBrand, initialUrl, onSaved, onCancel, onError, onSuccess }: Props) {
  const [url, setUrl] = useState(existingBrand?.url || initialUrl || '');
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(existingBrand?.name || '');
  const [instagramHandle, setInstagramHandle] = useState(existingBrand?.instagram_handle || '');
  const [logoUrl, setLogoUrl] = useState(existingBrand?.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(existingBrand?.primary_color || '#000000');
  const [secondaryColor, setSecondaryColor] = useState(existingBrand?.secondary_color || '#ffffff');
  const [accentColor, setAccentColor] = useState(existingBrand?.accent_color || '');
  const [colors, setColors] = useState<string[]>(existingBrand?.colors || []);
  const [tone, setTone] = useState(existingBrand?.tone || 'casual');
  const [targetAudience, setTargetAudience] = useState(existingBrand?.target_audience || '');
  const [valueProposition, setValueProposition] = useState(existingBrand?.value_proposition || '');
  const [keyPain, setKeyPain] = useState(existingBrand?.key_pain || '');
  const [productType, setProductType] = useState(normalizeProductType(existingBrand?.product_type || 'saas'));
  const [language, setLanguage] = useState(existingBrand?.language || 'pt-BR');
  const [emojiStyle, setEmojiStyle] = useState(existingBrand?.emoji_style || 'moderate');
  const [description, setDescription] = useState(existingBrand?.description || '');
  const [keywords, setKeywords] = useState(existingBrand?.keywords?.join(', ') || '');
  const [headlines, setHeadlines] = useState<string | null>(existingBrand?.headlines || null);
  const [bodyText, setBodyText] = useState<string | null>(existingBrand?.body_text || null);
  const [rawScanData, setRawScanData] = useState<Record<string, unknown> | null>(existingBrand?.raw_scan_data || null);

  const handleScan = async (urlOverride?: string | null) => {
    const rawTargetUrl = typeof urlOverride === 'string' ? urlOverride : url;
    const targetUrl = rawTargetUrl.trim();
    if (!targetUrl) {
      onError?.('Opa, cola uma URL aí primeiro! 👆');
      return;
    }

    let formattedUrl = targetUrl;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    setUrl(formattedUrl);

    setLoadingStep(loadingSteps[0]);

    try {
      // Step 1: Scrape
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl })
      });

      if (!scrapeRes.ok) {
        const errData = await scrapeRes.json();
        throw new Error(errData.error || 'Esse site não quis abrir a porta pra gente 😅 Confere o link e tenta de novo?');
      }

      const scraped: ScrapeResult = await scrapeRes.json();

      await new Promise(resolve => setTimeout(resolve, 300));
      setLoadingStep(loadingSteps[1]);

      // Step 2: Analyze with /api/analyze
      setLoadingStep(loadingSteps[2]);
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scraped })
      });

      if (!analyzeRes.ok) {
        let errorMsg = 'Ih, travou na análise! Tenta de novo? 🔄';
        try {
          const errData = await analyzeRes.json();
          errorMsg = errData.error || errorMsg;
        } catch (e) {
          // Fallback se não for JSON
          console.error('Erro ao ler resposta de erro:', e);
        }
        throw new Error(errorMsg);
      }

      const analysis: GeminiAnalysis = await analyzeRes.json();

      setLoadingStep(loadingSteps[3]);

      // Fill form with scan results
      setName(analysis.brand_name || scraped.title || '');
      setLogoUrl(scraped.logo_url || '');
      setPrimaryColor(scraped.primary_color || '#000000');
      setSecondaryColor(scraped.secondary_color || '#ffffff');
      setColors(scraped.colors || []);
      setTone(analysis.tone || 'casual');
      setTargetAudience(analysis.target_audience || '');
      setValueProposition(analysis.value_proposition || '');
      setKeyPain(analysis.key_pain || '');
      setProductType(normalizeProductType(analysis.product_type));
      setLanguage(analysis.language || 'pt-BR');
      setEmojiStyle(analysis.emoji_style || 'moderate');
      setDescription(scraped.description || '');
      setHeadlines(scraped.headlines || null);
      setBodyText(scraped.body_text || null);
      setRawScanData(scraped);

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ih, travou! Tenta de novo? 🔄';
      onError?.(message);
    } finally {
      setLoadingStep(null);
    }
  };

  // Auto-trigger scan when arriving from onboarding with a pre-filled URL
  useEffect(() => {
    if (initialUrl && !existingBrand) {
      handleScan(initialUrl);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!name.trim()) {
      onError?.('Ei, precisa de um nome! 😄');
      return;
    }

    setIsSaving(true);

    const brandData = {
      user_id: user.id,
      name: name.trim(),
      url: url || null,
      instagram_handle: instagramHandle || null,
      logo_url: logoUrl || null,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor || null,
      colors,
      tone,
      target_audience: targetAudience || null,
      value_proposition: valueProposition || null,
      key_pain: keyPain || null,
      product_type: normalizeProductType(productType),
      language,
      emoji_style: emojiStyle,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      description: description || null,
      headlines,
      body_text: bodyText,
      raw_scan_data: rawScanData,
      updated_at: new Date().toISOString(),
    };

    try {
      if (existingBrand) {
        const { data, error: dbError } = await supabase
          .from('brands')
          .update(brandData)
          .eq('id', existingBrand.id)
          .select()
          .single();

        if (dbError) throw dbError;
        onSuccess?.('Marca salva! Arrasou 🎉');
        onSaved(data as Brand);
      } else {
        const { data, error: dbError } = await supabase
          .from('brands')
          .insert(brandData)
          .select()
          .single();

        if (dbError) throw dbError;
        onSuccess?.('Marca salva! Arrasou 🎉');
        onSaved(data as Brand);
      }
    } catch (err: unknown) {
      onError?.('Deu ruim ao salvar 😬 Tenta mais uma vez?');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onCancel}
          className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
        <h2 className="text-2xl font-bold text-neutral-900 font-display">
          {existingBrand ? 'Editar marca' : 'Nova marca'}
        </h2>
      </div>

      {/* Auto-scan section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Análise automática ✨</h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://suamarca.com.br"
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { void handleScan(); }}
            disabled={!!loadingStep || !url}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF6B35] hover:bg-[#E55A28] disabled:opacity-50 transition-colors"
          >
            {loadingStep ? (
              <><Loader2 className="animate-spin mr-2 h-4 w-4" /> {loadingStep}</>
            ) : (
              <><Wand2 className="mr-2 h-4 w-4" /> Analisar site</>
            )}
          </motion.button>
        </div>
        <p className="text-xs text-neutral-400 mt-2">
          Cola o link do site e a gente faz a mágica. Você ajusta o que quiser depois 😉
        </p>
      </div>

      {/* Manual form */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
        <h3 className="text-sm font-semibold text-neutral-700">Sobre a marca</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nome da marca *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Minha marca"
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Instagram</label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@suamarca"
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
            />
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo de produto</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
            >
              {PRODUCT_TYPES.map(t => <option key={t} value={t}>{PRODUCT_TYPE_LABELS[t]}</option>)}
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Tom de voz</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
            >
              {tones.map(t => <option key={t} value={t}>{toneLabels[t]}</option>)}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Idioma</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
            >
              {languages.map(l => <option key={l} value={l}>{languageLabels[l]}</option>)}
            </select>
          </div>

          {/* Emoji Style */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Uso de emojis</label>
            <select
              value={emojiStyle}
              onChange={(e) => setEmojiStyle(e.target.value)}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
            >
              {emojiStyles.map(e => <option key={e} value={e}>{emojiStyleLabels[e]}</option>)}
            </select>
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Cores da marca</label>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500">Principal</label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded border border-neutral-300 cursor-pointer"
              />
              <span className="text-xs text-neutral-400 font-mono">{primaryColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500">Secundária</label>
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded border border-neutral-300 cursor-pointer"
              />
              <span className="text-xs text-neutral-400 font-mono">{secondaryColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500">Destaque</label>
              <input
                type="color"
                value={accentColor || '#6366f1'}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded border border-neutral-300 cursor-pointer"
              />
              <span className="text-xs text-neutral-400 font-mono">{accentColor || '—'}</span>
            </div>
          </div>
          {colors.length > 0 && (
            <div className="flex gap-1.5 mt-3 items-center">
              {colors.map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border border-neutral-200" style={{ backgroundColor: c }} title={c} />
              ))}
              <span className="text-xs text-neutral-400 ml-2">Paleta extraída do site</span>
            </div>
          )}
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">URL do logo</label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://exemplo.com/logo.png"
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
          />
          {logoUrl && (
            <img src={logoUrl} alt="Logo preview" className="mt-2 h-12 object-contain" />
          )}
        </div>

        {/* Text fields */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Público-alvo</label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Ex: empreendedores digitais de 25-40 anos"
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Proposta de valor</label>
          <textarea
            value={valueProposition}
            onChange={(e) => setValueProposition(e.target.value)}
            placeholder="O que torna sua marca única?"
            rows={2}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Dor principal do cliente</label>
          <textarea
            value={keyPain}
            onChange={(e) => setKeyPain(e.target.value)}
            placeholder="Qual problema você resolve?"
            rows={2}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Descrição da marca</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Uma visão geral sobre a sua marca..."
            rows={3}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Palavras-chave</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="produtividade, automação, marketing (separa por vírgula)"
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
          />
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF6B35] hover:bg-[#E55A28] disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Salvando...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Salvar marca</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
