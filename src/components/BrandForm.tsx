import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Wand2, Link as LinkIcon, Save, ArrowLeft, Upload, Instagram, Globe, ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Brand, ScrapeResult, GeminiAnalysis } from '../types';
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPES, normalizeProductType } from '../lib/brandMeta';
import { useScanFlow } from '../hooks/useScanFlow';

type Props = {
  user: User;
  existingBrand?: Brand | null;
  initialUrl?: string;
  onSaved: (brand: Brand) => void;
  onCancel: () => void;
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
};

type ScanMode = 'url' | 'instagram';

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

const tones = Object.keys(toneLabels);
const languages = Object.keys(languageLabels);
const emojiStyles = Object.keys(emojiStyleLabels);

function normalizeBrandUrl(rawUrl: string) {
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) return '';
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) return trimmedUrl;
  return `https://${trimmedUrl}`;
}

function parseKeywords(value: string) {
  return value.split(',').map(keyword => keyword.trim()).filter(Boolean);
}

export default function BrandForm({ user, existingBrand, initialUrl, onSaved, onCancel, onError, onSuccess }: Props) {
  const [scanMode, setScanMode] = useState<ScanMode>('url');
  const [url, setUrl] = useState(existingBrand?.url || initialUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  // Instagram screenshot
  const [igFile, setIgFile] = useState<File | null>(null);
  const [igPreview, setIgPreview] = useState<string | null>(null);
  const igInputRef = useRef<HTMLInputElement>(null);

  // Logo upload
  const [logoUploadPreview, setLogoUploadPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form fields
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
  const [provaDisponivel, setProvaDisponivel] = useState(existingBrand?.prova_disponivel || '');
  const [claimRestrictions, setClaimRestrictions] = useState(existingBrand?.claim_restrictions || '');
  const [productType, setProductType] = useState(normalizeProductType(existingBrand?.product_type || 'saas'));
  const [language, setLanguage] = useState(existingBrand?.language || 'pt-BR');
  const [emojiStyle, setEmojiStyle] = useState(existingBrand?.emoji_style || 'moderate');
  const [description, setDescription] = useState(existingBrand?.description || '');
  const [keywords, setKeywords] = useState(existingBrand?.keywords?.join(', ') || '');
  const [headlines, setHeadlines] = useState<string | null>(existingBrand?.headlines || null);
  const [bodyText, setBodyText] = useState<string | null>(existingBrand?.body_text || null);
  const [rawScanData, setRawScanData] = useState<Record<string, unknown> | null>(existingBrand?.raw_scan_data || null);

  // Initialize logo preview from existing brand
  useEffect(() => {
    if (existingBrand?.logo_url) setLogoUploadPreview(existingBrand.logo_url);
  }, []);

  const applyScanResults = (scraped: ScrapeResult, analysis: GeminiAnalysis) => {
    setName(analysis.brand_name || scraped.title || '');
    setLogoUrl(scraped.logo_url || '');
    if (scraped.logo_url) setLogoUploadPreview(scraped.logo_url);
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
  };

  const applyInstagramResults = (data: GeminiAnalysis & {
    colors?: string[];
    primary_color?: string;
    secondary_color?: string;
    description?: string;
    keywords?: string[];
  }) => {
    setName(data.brand_name || '');
    setTone(data.tone || 'casual');
    setTargetAudience(data.target_audience || '');
    setValueProposition(data.value_proposition || '');
    setKeyPain(data.key_pain || '');
    setProductType(normalizeProductType(data.product_type));
    setLanguage(data.language || 'pt-BR');
    setEmojiStyle(data.emoji_style || 'moderate');
    if (data.description) setDescription(data.description);
    if (data.keywords?.length) setKeywords(data.keywords.join(', '));
    if (data.colors?.length) setColors(data.colors);
    if (data.primary_color) setPrimaryColor(data.primary_color);
    if (data.secondary_color) setSecondaryColor(data.secondary_color);
  };

  const { isScanning, loadingStep, scanUrl, scanInstagram } = useScanFlow({
    onScanComplete: (scraped, analysis) => {
      applyScanResults(scraped, analysis);
      if (scraped.url) setUrl(scraped.url);
    },
    onInstagramComplete: applyInstagramResults,
    onSuccess,
    onError,
  });

  const handleIgFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIgFile(file);
    setIgPreview(URL.createObjectURL(file));
    if (igInputRef.current) igInputRef.current.value = '';
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploadPreview(URL.createObjectURL(file));
    setIsUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `logos/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);

      setLogoUrl(urlData.publicUrl);
      onSuccess?.('Logo enviado! 🎨');
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : 'Erro ao enviar logo');
      setLogoUploadPreview(null);
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Auto-trigger scan when arriving from onboarding with a pre-filled URL
  useEffect(() => {
    if (initialUrl && !existingBrand) {
      void scanUrl(initialUrl);
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
      prova_disponivel: provaDisponivel || null,
      claim_restrictions: claimRestrictions || null,
      product_type: normalizeProductType(productType),
      language,
      emoji_style: emojiStyle,
      keywords: parseKeywords(keywords),
      description: description || null,
      headlines,
      body_text: bodyText,
      raw_scan_data: rawScanData,
      updated_at: new Date().toISOString(),
    };

    try {
      const brandMutation = existingBrand
        ? supabase.from('brands').update(brandData).eq('id', existingBrand.id)
        : supabase.from('brands').insert(brandData);

      const { data, error: dbError } = await brandMutation.select().single();

      if (dbError) throw dbError;

      onSuccess?.('Marca salva! Arrasou 🎉');
      onSaved(data as Brand);
    } catch (err: unknown) {
      console.error('[BrandForm] Erro ao salvar marca:', err);
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

      {/* Scan mode selector + panel */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 mb-4">Como você quer começar? ✨</h3>

        {/* Mode tabs */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => setScanMode('url')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
              scanMode === 'url'
                ? 'border-[#FF6B35] bg-[#FFF1EB] text-[#FF6B35]'
                : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <Globe className={`h-5 w-5 shrink-0 ${scanMode === 'url' ? 'text-[#FF6B35]' : 'text-neutral-400'}`} />
            <div>
              <p className="text-sm font-semibold">Site da marca</p>
              <p className="text-xs opacity-70">Cola a URL e a IA analisa tudo</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setScanMode('instagram')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
              scanMode === 'instagram'
                ? 'border-[#FF6B35] bg-[#FFF1EB] text-[#FF6B35]'
                : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <Instagram className={`h-5 w-5 shrink-0 ${scanMode === 'instagram' ? 'text-[#FF6B35]' : 'text-neutral-400'}`} />
            <div>
              <p className="text-sm font-semibold">Print do Instagram</p>
              <p className="text-xs opacity-70">Sobe um print do perfil e pronto</p>
            </div>
          </button>
        </div>

        {/* URL panel */}
        {scanMode === 'url' && (
          <div>
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
                onClick={() => { void scanUrl(url); }}
                disabled={isScanning || !url}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF6B35] hover:bg-[#E55A28] disabled:opacity-50 transition-colors whitespace-nowrap"
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
        )}

        {/* Instagram panel */}
        {scanMode === 'instagram' && (
          <div>
            <input
              ref={igInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleIgFileSelect}
            />

            {!igFile ? (
              <button
                type="button"
                onClick={() => igInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-400 hover:border-[#FF6B35] hover:text-[#FF6B35] hover:bg-[#FFF1EB] transition-all"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">Clica pra subir o print do perfil</span>
                <span className="text-xs">PNG, JPG — qualquer screenshot serve</span>
              </button>
            ) : (
              <div className="flex gap-4 items-start">
                <div className="relative">
                  <img
                    src={igPreview!}
                    alt="Print do Instagram"
                    className="h-32 w-auto rounded-lg border border-neutral-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setIgFile(null); setIgPreview(null); }}
                    className="absolute -top-2 -right-2 bg-white border border-neutral-200 rounded-full p-0.5 text-neutral-400 hover:text-red-500 transition-colors text-xs leading-none"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neutral-600 mb-3">
                    Print carregado! Bora analisar? 🚀
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { if (igFile) void scanInstagram(igFile); else onError?.('Sobe o print do perfil primeiro! 📸'); }}
                    disabled={isScanning}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF6B35] hover:bg-[#E55A28] disabled:opacity-50 transition-colors"
                  >
                    {loadingStep ? (
                      <><Loader2 className="animate-spin mr-2 h-4 w-4" /> {loadingStep}</>
                    ) : (
                      <><Wand2 className="mr-2 h-4 w-4" /> Analisar perfil</>
                    )}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => igInputRef.current?.click()}
                    className="mt-2 block text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    Trocar imagem
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-neutral-400 mt-3">
              Tira um print completo do perfil no Instagram — bio, foto de capa e alguns posts aparecem pra IA analisar melhor 📱
            </p>
          </div>
        )}
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

        {/* Logo upload */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Logo da marca</label>
          <p className="text-xs text-neutral-400 mb-3">
            Sobe o logo aqui e a IA vai usá-lo nas imagens geradas 🎨
          </p>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <div className="flex items-center gap-4 flex-wrap">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="inline-flex items-center px-4 py-2 border border-[#FF6B35] rounded-lg text-sm font-medium text-[#FF6B35] hover:bg-[#FFF1EB] disabled:opacity-50 transition-colors"
            >
              {isUploadingLogo ? (
                <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Enviando...</>
              ) : (
                <><ImageIcon className="mr-2 h-4 w-4" /> {logoUploadPreview ? 'Trocar logo' : 'Upload do logo'}</>
              )}
            </motion.button>
            {logoUploadPreview && (
              <img
                src={logoUploadPreview}
                alt="Logo preview"
                className="h-12 object-contain rounded border border-neutral-200 bg-neutral-50 p-1"
              />
            )}
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Cores da marca</label>

          {colors.length > 0 && (
            <div className="mb-4 p-3 bg-[#FFF8F0] rounded-lg border border-[#FFD166]/40">
              <p className="text-xs text-neutral-500 mb-2 font-medium">
                Paleta extraída — clica P / S / D para atribuir
              </p>
              <div className="flex flex-wrap gap-3">
                {colors.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-9 h-9 rounded-lg border-2 border-white shadow-sm"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        onClick={() => setPrimaryColor(c)}
                        className="text-[9px] font-bold px-1 py-0.5 rounded bg-neutral-200 hover:bg-[#FF6B35] hover:text-white transition-colors"
                        title={`Usar ${c} como principal`}
                      >P</button>
                      <button
                        type="button"
                        onClick={() => setSecondaryColor(c)}
                        className="text-[9px] font-bold px-1 py-0.5 rounded bg-neutral-200 hover:bg-[#1A1A2E] hover:text-white transition-colors"
                        title={`Usar ${c} como secundária`}
                      >S</button>
                      <button
                        type="button"
                        onClick={() => setAccentColor(c)}
                        className="text-[9px] font-bold px-1 py-0.5 rounded bg-neutral-200 hover:bg-[#FFD166] transition-colors"
                        title={`Usar ${c} como destaque`}
                      >D</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          <label className="block text-sm font-medium text-neutral-700 mb-1">Provas disponíveis</label>
          <textarea
            value={provaDisponivel}
            onChange={(e) => setProvaDisponivel(e.target.value)}
            placeholder="Ex: 500 clientes ativos, prêmio X de 2023, 4 anos no mercado"
            rows={2}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">O que a IA não pode inventar</label>
          <textarea
            value={claimRestrictions}
            onChange={(e) => setClaimRestrictions(e.target.value)}
            placeholder="Ex: não temos desconto fixo, preço varia por projeto, não divulgamos número de clientes"
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
