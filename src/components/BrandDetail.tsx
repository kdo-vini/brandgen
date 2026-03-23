import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Loader2, Wand2, ArrowLeft, Copy, Check, Download, Palette, Image as ImageIcon, Type as TypeIcon, RefreshCw, Pencil, Package, Clock, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Brand, GeneratedContent, BrandAsset } from '../types';
import AssetUploader from './AssetUploader';
import PostHistory from './PostHistory';

type Props = {
  brand: Brand;
  onBack: () => void;
  onEdit: (brand: Brand) => void;
};

type Tab = 'generate' | 'assets' | 'history';

const postTypes = [
  'Dor do cliente',
  'Solução / produto',
  'Bastidores / founder',
  'CTA / oferta direta',
  'Prova social / depoimento'
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
const imageSizes = ["1K", "2K", "4K"];

export default function BrandDetail({ brand, onBack, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  // Generator state
  const [postType, setPostType] = useState('Dor do cliente');
  const [format, setFormat] = useState('Feed quadrado (1080x1080)');
  const [imageStyle, setImageStyle] = useState('Post Profissional (Canva-style)');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageModel, setImageModel] = useState('imagen-4.0-ultra-generate-001');
  const [imageSize, setImageSize] = useState('1K');

  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleRescan = async () => {
    if (!brand.url) return;
    setIsRescanning(true);
    setError('');

    try {
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: brand.url })
      });

      if (!scrapeRes.ok) throw new Error('Erro ao re-escanear o site.');
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

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRescanning(false);
    }
  };

  const handleGenerateContent = async () => {
    setError('');
    setIsGenerating(true);
    setGeneratedImageUrl(null);

    try {
      // Fetch assets for extra context
      const { data: assets } = await supabase
        .from('brand_assets')
        .select('url, filename, type')
        .eq('brand_id', brand.id);

      const assetContext = assets && assets.length > 0
        ? `\n\nA marca possui ${assets.length} foto(s) de produto/referência disponíveis.`
        : '';

      const keywordsContext = brand.keywords && brand.keywords.length > 0
        ? `\nPalavras-chave da marca: ${brand.keywords.join(', ')}`
        : '';

      const styleDescription = imageStyleDescriptions[imageStyle] || imageStyleDescriptions['Post Profissional (Canva-style)'];

      const prompt = `Com base no brand kit abaixo, gere o conteúdo para um post de Instagram.

Brand kit:
- Nome: ${brand.name}
- Tipo: ${brand.product_type}
- Tom de voz: ${brand.tone}
- Público-alvo: ${brand.target_audience}
- Proposta de valor: ${brand.value_proposition}
- Dor principal: ${brand.key_pain}
- Descrição: ${brand.description || ''}
- Cores: primária ${brand.primary_color}, secundária ${brand.secondary_color}
- Idioma: ${brand.language}
- Estilo de emoji: ${brand.emoji_style}${keywordsContext}${assetContext}

Tipo de post: ${postType}
Formato: ${format}
Estilo da Imagem: ${imageStyle}

Retorne um JSON com:
- hook: título/primeira linha impactante (max 10 palavras)
- caption: legenda completa em ${brand.language || 'pt-BR'} com quebras de linha naturais (max 300 chars)
- cta: chamada para ação final (1 linha)
- hashtags: lista de 15 hashtags relevantes como string (ex: "#tag1 #tag2")
- image_prompt: prompt DETALHADO em inglês para geração de imagem. IMPORTANTE — o prompt de imagem deve seguir TODAS estas regras:

  1. ESTILO VISUAL OBRIGATÓRIO: ${styleDescription}

  2. COMPOSIÇÃO: Descreva um design de post para redes sociais com layout profissional. NÃO gere ilustrações vetoriais, flat design, clipart, ou ícones simples. A imagem deve parecer um template premium de design criado no Canva ou Adobe Express.

  3. FOTOGRAFIA: Se relevante ao produto (${brand.product_type}), inclua elementos fotográficos realistas — produto com iluminação profissional, mockups, ou cenas lifestyle. Use composição em camadas com o produto sobre o background estilizado.

  4. CORES DA MARCA: Use as cores ${brand.primary_color} (primária) e ${brand.secondary_color} (secundária) como cores dominantes nos gradientes, fundos, e acentos visuais.

  5. TIPOGRAFIA: Inclua texto tipográfico bold e moderno no design — um título/headline curto e impactante e opcionalmente um subtítulo menor. Use fontes sans-serif modernas e pesadas.

  6. ELEMENTOS DE DESIGN: Adicione elementos decorativos sutis como: formas geométricas abstratas, linhas decorativas, efeitos de luz, sombras suaves, ou partículas. NÃO use clipart ou ícones cartoon.

  7. FORMATO: ${format}. A imagem deve ser otimizada para este formato exato.

  8. O prompt deve ser específico, detalhado (mínimo 3 frases), e em inglês.`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hook: { type: Type.STRING },
              caption: { type: Type.STRING },
              cta: { type: Type.STRING },
              hashtags: { type: Type.STRING },
              image_prompt: { type: Type.STRING }
            },
            required: ['hook', 'caption', 'cta', 'hashtags', 'image_prompt']
          }
        }
      });

      const content: GeneratedContent = JSON.parse(response.text || '{}');
      setGeneratedContent(content);

      // Save to generated_posts
      await supabase.from('generated_posts').insert({
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
      });

      // Draw preview card
      setTimeout(() => drawPreviewCard(content.hook, content.cta), 100);

    } catch (err: any) {
      setError(err.message || 'Erro ao gerar conteúdo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedContent) return;

    setError('');
    setIsGeneratingImage(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const selectedModel = imageModels.find(m => m.id === imageModel);
      const isImagen = selectedModel?.type === 'imagen';

      if (isImagen) {
        // Imagen API uses generateImages()
        const response = await ai.models.generateImages({
          model: imageModel,
          prompt: generatedContent.image_prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: aspectRatio as any,
          },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
          const imgBytes = response.generatedImages[0].image?.imageBytes;
          if (imgBytes) {
            const imageUrl = `data:image/png;base64,${imgBytes}`;
            setGeneratedImageUrl(imageUrl);
          }
        }
      } else {
        // Nano Banana API uses generateContent()
        const response = await ai.models.generateContent({
          model: imageModel,
          contents: {
            parts: [{ text: generatedContent.image_prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
              imageSize: imageSize as any
            }
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            setGeneratedImageUrl(imageUrl);
            break;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar imagem.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const drawPreviewCard = (hook: string, cta: string) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isVertical = format.includes('1080x1920');
    canvas.width = 1080;
    canvas.height = isVertical ? 1920 : 1080;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `${brand.primary_color}ff`);
    gradient.addColorStop(1, `${brand.secondary_color}44`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontSize = isVertical ? 80 : 72;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;

    const words = hook.split(' ');
    let line = '';
    let y = canvas.height / 2 - (isVertical ? 200 : 100);
    const maxWidth = canvas.width - 200;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += fontSize * 1.2;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    ctx.fillStyle = brand.secondary_color || '#facc15';
    ctx.font = `bold ${fontSize * 0.5}px Inter, sans-serif`;
    ctx.fillText(cta, canvas.width / 2, canvas.height - (isVertical ? 300 : 150));

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '24px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('BrandGen', canvas.width - 40, canvas.height - 40);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadCanvas = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `brandgen-${brand.name}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'generate', label: 'Gerar Post', icon: <Wand2 className="h-4 w-4" /> },
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
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">{brand.product_type}</span>
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
              Re-escanear
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
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 mb-6">
          {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <TypeIcon className="h-5 w-5 text-indigo-500" />
                Configurar Post
              </h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo de Post</label>
                <select value={postType} onChange={(e) => setPostType(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border">
                  {postTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Formato</label>
                <div className="space-y-2">
                  {formats.map(f => (
                    <div key={f} className="flex items-center">
                      <input id={f} name="format" type="radio" checked={format === f} onChange={() => setFormat(f)} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-neutral-300" />
                      <label htmlFor={f} className="ml-3 block text-sm font-medium text-neutral-700">{f}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Estilo da Imagem IA</label>
                <select value={imageStyle} onChange={(e) => setImageStyle(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border">
                  {imageStyles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Modelo de Imagem IA</label>
                <select value={imageModel} onChange={(e) => setImageModel(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border">
                  {imageModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Proporção</label>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border">
                    {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Resolução</label>
                  <select value={imageSize} onChange={(e) => setImageSize(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border">
                    {imageSizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateContent}
                disabled={isGenerating}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 transition-colors"
              >
                {isGenerating ? (
                  <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Gerando Copy...</>
                ) : (
                  <><Wand2 className="-ml-1 mr-2 h-4 w-4" /> Gerar Copy & Prompt</>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-7 space-y-6">
            {generatedContent && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-neutral-900">Copy do Post</h2>
                  <button
                    onClick={() => copyToClipboard(`${generatedContent.hook}\n\n${generatedContent.caption}\n\n${generatedContent.cta}\n\n${generatedContent.hashtags}`, 'copy')}
                    className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-xs font-medium rounded text-neutral-700 bg-white hover:bg-neutral-50"
                  >
                    {copiedField === 'copy' ? <Check className="h-4 w-4 mr-1 text-emerald-500" /> : <Copy className="h-4 w-4 mr-1" />}
                    Copiar Tudo
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Hook</h4>
                    <p className="text-lg font-bold text-neutral-900">{generatedContent.hook}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Legenda</h4>
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{generatedContent.caption}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">CTA</h4>
                    <p className="text-sm font-medium text-indigo-600">{generatedContent.cta}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Hashtags</h4>
                    <p className="text-sm text-neutral-500">{generatedContent.hashtags}</p>
                  </div>
                </div>
              </div>
            )}

            {generatedContent && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-indigo-500" />
                    Prompt de Imagem
                  </h2>
                  <button
                    onClick={() => copyToClipboard(generatedContent.image_prompt, 'prompt')}
                    className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-xs font-medium rounded text-neutral-700 bg-white hover:bg-neutral-50"
                  >
                    {copiedField === 'prompt' ? <Check className="h-4 w-4 mr-1 text-emerald-500" /> : <Copy className="h-4 w-4 mr-1" />}
                    Copiar Prompt
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-neutral-700 bg-neutral-50 p-4 rounded-lg border border-neutral-200 font-mono">
                    {generatedContent.image_prompt}
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage}
                      className="flex-1 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {isGeneratingImage ? (
                        <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Gerando Imagem IA...</>
                      ) : (
                        <><ImageIcon className="-ml-1 mr-2 h-4 w-4" /> Gerar Imagem com IA</>
                      )}
                    </button>
                    <button
                      onClick={downloadCanvas}
                      className="flex-1 flex justify-center items-center py-2.5 px-4 border border-neutral-300 rounded-lg shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
                    >
                      <Download className="-ml-1 mr-2 h-4 w-4" /> Baixar Card Tipográfico
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Previews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className={generatedContent ? 'block' : 'hidden'}>
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Card Tipográfico</h3>
                <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center p-4">
                  <canvas ref={canvasRef} className="max-w-full h-auto shadow-md rounded" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                </div>
              </div>
              {generatedImageUrl && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">Imagem Gerada</h3>
                  <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center p-4">
                    <img src={generatedImageUrl} alt="AI Generated" className="max-w-full h-auto shadow-md rounded" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                  </div>
                </div>
              )}
            </div>

            {!generatedContent && !isGenerating && (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Wand2 className="h-8 w-8 text-neutral-300 mb-3" />
                <p className="text-sm text-neutral-400">Configure e clique em "Gerar Copy & Prompt" para criar conteúdo.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <AssetUploader brandId={brand.id} />
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
