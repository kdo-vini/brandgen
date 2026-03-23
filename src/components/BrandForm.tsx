import React, { useState } from 'react';
import { Loader2, Wand2, Link as LinkIcon, Save, ArrowLeft } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../lib/supabase';
import type { Brand, ScrapeResult, GeminiAnalysis } from '../types';

type Props = {
  existingBrand?: Brand | null;
  onSaved: (brand: Brand) => void;
  onCancel: () => void;
};

const productTypes = ['saas', 'ecommerce', 'food', 'service', 'other'];
const tones = ['formal', 'casual', 'bold', 'friendly'];
const languages = ['pt-BR', 'en', 'es'];
const emojiStyles = ['minimal', 'moderate', 'heavy'];

export default function BrandForm({ existingBrand, onSaved, onCancel }: Props) {
  const [url, setUrl] = useState(existingBrand?.url || '');
  const [isScraping, setIsScraping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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
  const [productType, setProductType] = useState(existingBrand?.product_type || 'saas');
  const [language, setLanguage] = useState(existingBrand?.language || 'pt-BR');
  const [emojiStyle, setEmojiStyle] = useState(existingBrand?.emoji_style || 'moderate');
  const [description, setDescription] = useState(existingBrand?.description || '');
  const [keywords, setKeywords] = useState(existingBrand?.keywords?.join(', ') || '');

  const handleScan = async () => {
    if (!url) {
      setError('Insira uma URL para escanear.');
      return;
    }

    let formattedUrl = url;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
      setUrl(formattedUrl);
    }

    setError('');
    setIsScraping(true);

    try {
      // Step 1: Scrape
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl })
      });

      if (!scrapeRes.ok) {
        const errData = await scrapeRes.json();
        throw new Error(errData.error || 'Erro ao extrair dados do site.');
      }

      const scraped: ScrapeResult = await scrapeRes.json();

      setIsScraping(false);
      setIsAnalyzing(true);

      // Step 2: Analyze with Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const prompt = `Analise esta marca com base nos dados extraídos do site:
URL: ${scraped.url}
Título: ${scraped.title}
Descrição: ${scraped.description}
Textos principais: ${scraped.body_text}
Cores predominantes: ${scraped.colors.join(', ')}

Retorne um JSON com:
- brand_name: nome da marca
- product_type: 'saas' | 'ecommerce' | 'food' | 'service' | 'other'
- tone: 'formal' | 'casual' | 'bold' | 'friendly'
- target_audience: descrição em 1 frase
- value_proposition: proposta de valor principal em 1 frase
- key_pain: principal dor que o produto resolve
- language: 'pt-BR' | 'en' | 'es'
- emoji_style: 'minimal' | 'moderate' | 'heavy'`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brand_name: { type: Type.STRING },
              product_type: { type: Type.STRING },
              tone: { type: Type.STRING },
              target_audience: { type: Type.STRING },
              value_proposition: { type: Type.STRING },
              key_pain: { type: Type.STRING },
              language: { type: Type.STRING },
              emoji_style: { type: Type.STRING }
            },
            required: ['brand_name', 'product_type', 'tone', 'target_audience', 'value_proposition', 'key_pain', 'language', 'emoji_style']
          }
        }
      });

      const analysis: GeminiAnalysis = JSON.parse(response.text || '{}');

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
      setProductType(analysis.product_type || 'saas');
      setLanguage(analysis.language || 'pt-BR');
      setEmojiStyle(analysis.emoji_style || 'moderate');
      setDescription(scraped.description || '');

    } catch (err: any) {
      setError(err.message || 'Erro durante o escaneamento.');
    } finally {
      setIsScraping(false);
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Nome da marca é obrigatório.');
      return;
    }

    setError('');
    setIsSaving(true);

    const brandData = {
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
      product_type: productType,
      language,
      emoji_style: emojiStyle,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      description: description || null,
      headlines: null as string | null,
      body_text: null as string | null,
      raw_scan_data: null as Record<string, unknown> | null,
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
        onSaved(data as Brand);
      } else {
        const { data, error: dbError } = await supabase
          .from('brands')
          .insert(brandData)
          .select()
          .single();

        if (dbError) throw dbError;
        onSaved(data as Brand);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar marca.');
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
        <h2 className="text-2xl font-bold text-neutral-900">
          {existingBrand ? 'Editar Marca' : 'Nova Marca'}
        </h2>
      </div>

      {/* Auto-scan section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Escaneamento Automático</h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com"
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={isScraping || isAnalyzing || !url}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isScraping ? (
              <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Extraindo...</>
            ) : isAnalyzing ? (
              <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Analisando...</>
            ) : (
              <><Wand2 className="mr-2 h-4 w-4" /> Escanear</>
            )}
          </button>
        </div>
        <p className="text-xs text-neutral-400 mt-2">
          O scan preenche os campos abaixo automaticamente. Você pode ajustar o que quiser.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 mb-6">
          {error}
        </div>
      )}

      {/* Manual form */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
        <h3 className="text-sm font-semibold text-neutral-700">Dados da Marca</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nome da Marca *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Minha Marca"
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Instagram</label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@minha_marca"
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo de Produto</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {productTypes.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Tom de Voz</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {tones.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Idioma</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Emoji Style */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Estilo de Emoji</label>
            <select
              value={emojiStyle}
              onChange={(e) => setEmojiStyle(e.target.value)}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {emojiStyles.map(e => <option key={e} value={e} className="capitalize">{e}</option>)}
            </select>
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Cores da Marca</label>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500">Primária</label>
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
            <div className="flex gap-1.5 mt-3">
              {colors.map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border border-neutral-200" style={{ backgroundColor: c }} title={c} />
              ))}
              <span className="text-xs text-neutral-400 self-center ml-2">Paleta extraída</span>
            </div>
          )}
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">URL do Logo</label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://exemplo.com/logo.png"
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {logoUrl && (
            <img src={logoUrl} alt="Logo preview" className="mt-2 h-12 object-contain" />
          )}
        </div>

        {/* Text fields */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Público-Alvo</label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Empreendedores digitais de 25-40 anos"
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Proposta de Valor</label>
          <textarea
            value={valueProposition}
            onChange={(e) => setValueProposition(e.target.value)}
            placeholder="A proposta de valor principal da marca..."
            rows={2}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Dor Principal do Cliente</label>
          <textarea
            value={keyPain}
            onChange={(e) => setKeyPain(e.target.value)}
            placeholder="O principal problema que o produto resolve..."
            rows={2}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição geral da marca..."
            rows={3}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Palavras-chave</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="produtividade, automação, marketing (separadas por vírgula)"
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Salvando...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Salvar Marca</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
