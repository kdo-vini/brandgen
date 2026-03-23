/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Loader2, Link as LinkIcon, Image as ImageIcon, Copy, Download, Wand2, Palette, Type as TypeIcon, Hash, ChevronDown, ChevronUp, Check, Clock, Trash2, Key } from 'lucide-react';

// Global type for AI Studio
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type HistoryItem = {
  id: string;
  timestamp: number;
  url: string;
  brandKit: BrandKit;
  postType: string;
  format: string;
  imageStyle: string;
  aspectRatio: string;
  imageModel?: string;
  imageSize?: string;
  generatedContent: GeneratedContent;
  generatedImageUrl: string | null;
};

type BrandKit = {
  url: string;
  title: string;
  description: string;
  headlines: string;
  body_text: string;
  colors: string[];
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  // Gemini analyzed fields
  brand_name?: string;
  product_type?: string;
  tone?: string;
  target_audience?: string;
  value_proposition?: string;
  key_pain?: string;
  language?: string;
  emoji_style?: string;
};

type GeneratedContent = {
  hook: string;
  caption: string;
  cta: string;
  hashtags: string;
  image_prompt: string;
};

export default function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState('');
  
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [showBrandKit, setShowBrandKit] = useState(false);
  
  const [postType, setPostType] = useState('Dor do cliente');
  const [format, setFormat] = useState('Feed quadrado (1080x1080)');
  const [imageStyle, setImageStyle] = useState('Realista');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageModel, setImageModel] = useState('gemini-3.1-flash-image-preview');
  const [imageSize, setImageSize] = useState('1K');
  
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('brandgen_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    localStorage.setItem('brandgen_history', JSON.stringify(history));
  }, [history]);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

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
    'Realista',
    'Arte estilo Canva',
    'Cinematográfico (estúdio)',
    'Minimalista',
    'Ilustração 3D'
  ];

  const aspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9", "1:4", "1:8", "4:1", "8:1"];
  const imageModels = [
    { id: 'gemini-3.1-flash-image-preview', name: 'Nano Banana 2 (Flash)' },
    { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro' }
  ];
  const imageSizes = ["1K", "2K", "4K"];

  const handleAnalyze = async () => {
    if (!url) {
      setError('Por favor, insira uma URL válida.');
      return;
    }
    
    let formattedUrl = url;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
      setUrl(formattedUrl); // Update the input field as well
    }
    
    setError('');
    setIsScraping(true);
    setBrandKit(null);
    setGeneratedContent(null);
    setGeneratedImageUrl(null);
    
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
      
      const scrapedData = await scrapeRes.json();
      
      setIsScraping(false);
      setIsAnalyzing(true);
      
      // Step 2: Analyze with Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const prompt = `Analise esta marca com base nos dados extraídos do site:
URL: ${scrapedData.url}
Título: ${scrapedData.title}
Descrição: ${scrapedData.description}
Textos principais: ${scrapedData.body_text}
Cores predominantes: ${scrapedData.colors.join(', ')}

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

      const analysis = JSON.parse(response.text || '{}');
      setBrandKit({ ...scrapedData, ...analysis });
      
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante a análise.');
    } finally {
      setIsScraping(false);
      setIsAnalyzing(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!brandKit) return;
    
    setError('');
    setIsGenerating(true);
    setGeneratedImageUrl(null);
    
    try {
      const prompt = `Com base no brand kit abaixo, gere o conteúdo para um post de Instagram.

Brand kit: ${JSON.stringify(brandKit, null, 2)}

Tipo de post: ${postType}
Formato: ${format}
Estilo da Imagem: ${imageStyle}

Retorne um JSON com:
- hook: título/primeira linha impactante (max 10 palavras)
- caption: legenda completa em ${brandKit.language || 'pt-BR'} com quebras de linha naturais (max 300 chars)
- cta: chamada para ação final (1 linha)
- hashtags: lista de 15 hashtags relevantes como string (ex: "#tag1 #tag2")
- image_prompt: prompt em inglês para geração de imagem, com as cores ${brandKit.primary_color} e ${brandKit.secondary_color} incorporadas, estilo adequado para ${brandKit.product_type} e estilo visual "${imageStyle}", formato ${format}, SEM texto na imagem.`;

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

      const content = JSON.parse(response.text || '{}');
      setGeneratedContent(content);
      
      // Save to history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        url,
        brandKit,
        postType,
        format,
        imageStyle,
        aspectRatio,
        imageModel,
        imageSize,
        generatedContent: content,
        generatedImageUrl: null
      };
      setHistory(prev => [newItem, ...prev]);
      setActiveHistoryId(newItem.id);
      
      // Draw preview card
      setTimeout(() => drawPreviewCard(content.hook, content.cta, format, brandKit), 100);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar conteúdo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedContent || !brandKit) return;
    
    setError('');
    setIsGeneratingImage(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
          parts: [
            { text: generatedContent.image_prompt }
          ]
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
          const base64EncodeString = part.inlineData.data;
          const imageUrl = `data:image/png;base64,${base64EncodeString}`;
          setGeneratedImageUrl(imageUrl);
          
          if (activeHistoryId) {
            setHistory(prev => prev.map(item => 
              item.id === activeHistoryId ? { ...item, generatedImageUrl: imageUrl } : item
            ));
          }
          break;
        }
      }
      
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar imagem.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const drawPreviewCard = (hook: string, cta: string, currentFormat: string, currentBrandKit: BrandKit) => {
    if (!canvasRef.current || !currentBrandKit) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const isVertical = currentFormat.includes('1080x1920');
    canvas.width = 1080;
    canvas.height = isVertical ? 1920 : 1080;
    
    // Background
    ctx.fillStyle = currentBrandKit.primary_color || '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle gradient or pattern
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `${currentBrandKit.primary_color}ff`);
    gradient.addColorStop(1, `${currentBrandKit.secondary_color}44`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Hook
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const fontSize = isVertical ? 80 : 72;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    
    // Simple text wrapping
    const words = hook.split(' ');
    let line = '';
    let y = canvas.height / 2 - (isVertical ? 200 : 100);
    const maxWidth = canvas.width - 200;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += fontSize * 1.2;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);
    
    // Draw CTA
    ctx.fillStyle = currentBrandKit.secondary_color || '#facc15';
    ctx.font = `bold ${fontSize * 0.5}px Inter, sans-serif`;
    ctx.fillText(cta, canvas.width / 2, canvas.height - (isVertical ? 300 : 150));
    
    // Watermark
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
    link.download = `brandgen-preview-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setUrl(item.url);
    setBrandKit(item.brandKit);
    setPostType(item.postType);
    setFormat(item.format);
    setImageStyle(item.imageStyle);
    setAspectRatio(item.aspectRatio);
    if (item.imageModel) setImageModel(item.imageModel);
    if (item.imageSize) setImageSize(item.imageSize);
    setGeneratedContent(item.generatedContent);
    setGeneratedImageUrl(item.generatedImageUrl);
    setActiveHistoryId(item.id);
    
    setTimeout(() => drawPreviewCard(item.generatedContent.hook, item.generatedContent.cta, item.format, item.brandKit), 100);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    if (activeHistoryId === id) {
      setGeneratedContent(null);
      setGeneratedImageUrl(null);
      setActiveHistoryId(null);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="h-8 w-8 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">API Key Necessária</h2>
          <p className="text-neutral-600 mb-8">
            Para utilizar os modelos avançados de geração de imagem (Nano Banana 2 e Nano Banana Pro), você precisa selecionar uma chave de API do Google Cloud com faturamento ativado.
            <br/><br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
              Saiba mais sobre faturamento
            </a>
          </p>
          <button 
            onClick={handleSelectKey} 
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Selecionar API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-80 bg-white border-r border-neutral-200 p-6 flex flex-col h-auto md:h-screen sticky top-0">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            B
          </div>
          <h1 className="text-xl font-bold tracking-tight">BrandGen</h1>
        </div>
        
        <div className="space-y-6 flex-1">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">URL da Marca</label>
            <div className="relative">
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
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={isScraping || isAnalyzing || !url}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isScraping ? (
              <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Extraindo dados...</>
            ) : isAnalyzing ? (
              <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Analisando marca...</>
            ) : (
              <><Wand2 className="-ml-1 mr-2 h-4 w-4" /> Analisar Marca</>
            )}
          </button>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          {history.length > 0 && (
            <div className="mt-8 flex-1 overflow-y-auto max-h-[40vh] md:max-h-none border-t border-neutral-200 pt-6">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Histórico de Gerações
              </h3>
              <div className="space-y-2">
                {history.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors text-sm ${activeHistoryId === item.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-neutral-200 hover:bg-neutral-50'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-neutral-900 truncate pr-2">
                        {item.brandKit.brand_name || item.brandKit.title || item.url}
                      </span>
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="text-neutral-400 hover:text-red-500 flex-shrink-0"
                        title="Excluir do histórico"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-neutral-500 truncate">
                      {item.postType}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {new Date(item.timestamp).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-auto pt-6 border-t border-neutral-200 text-xs text-neutral-500">
          Powered by Gemini 3.1 Pro & Flash Image
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Brand Kit Section */}
          {brandKit && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              <div 
                className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center cursor-pointer hover:bg-neutral-50"
                onClick={() => setShowBrandKit(!showBrandKit)}
              >
                <div className="flex items-center gap-3">
                  {brandKit.logo_url && (
                    <img src={brandKit.logo_url} alt="Logo" className="w-8 h-8 object-contain rounded" />
                  )}
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Brand Kit: {brandKit.brand_name || brandKit.title}
                  </h2>
                </div>
                {showBrandKit ? <ChevronUp className="h-5 w-5 text-neutral-500" /> : <ChevronDown className="h-5 w-5 text-neutral-500" />}
              </div>
              
              {showBrandKit && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Paleta de Cores</h3>
                      <div className="flex gap-2">
                        {brandKit.colors.map((color, i) => (
                          <div 
                            key={i} 
                            className="w-8 h-8 rounded-full shadow-sm border border-neutral-200" 
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Público Alvo</h3>
                      <p className="text-sm text-neutral-800">{brandKit.target_audience}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Proposta de Valor</h3>
                      <p className="text-sm text-neutral-800">{brandKit.value_proposition}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">Tipo</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                          {brandKit.product_type}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">Tom de Voz</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 capitalize">
                          {brandKit.tone}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Dor Principal</h3>
                      <p className="text-sm text-neutral-800">{brandKit.key_pain}</p>
                    </div>
                    
                    <div className="pt-2">
                      <details className="text-sm">
                        <summary className="text-indigo-600 cursor-pointer font-medium hover:text-indigo-800">Ver JSON Completo</summary>
                        <pre className="mt-2 p-4 bg-neutral-900 text-neutral-100 rounded-lg overflow-x-auto text-xs">
                          {JSON.stringify(brandKit, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generator Section */}
          {brandKit && (
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
                    <select 
                      value={postType}
                      onChange={(e) => setPostType(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border"
                    >
                      {postTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Formato</label>
                    <div className="space-y-2">
                      {formats.map(f => (
                        <div key={f} className="flex items-center">
                          <input
                            id={f}
                            name="format"
                            type="radio"
                            checked={format === f}
                            onChange={() => setFormat(f)}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-neutral-300"
                          />
                          <label htmlFor={f} className="ml-3 block text-sm font-medium text-neutral-700">
                            {f}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Estilo da Imagem IA</label>
                    <select 
                      value={imageStyle}
                      onChange={(e) => setImageStyle(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border"
                    >
                      {imageStyles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Modelo de Imagem IA</label>
                    <select 
                      value={imageModel}
                      onChange={(e) => setImageModel(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border"
                    >
                      {imageModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Proporção (Aspect Ratio)</label>
                      <select 
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border"
                      >
                        {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Tamanho (Resolução)</label>
                      <select 
                        value={imageSize}
                        onChange={(e) => setImageSize(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border"
                      >
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
                        className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-xs font-medium rounded text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                        className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-xs font-medium rounded text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                          className="flex-1 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                        >
                          {isGeneratingImage ? (
                            <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Gerando Imagem IA...</>
                          ) : (
                            <><ImageIcon className="-ml-1 mr-2 h-4 w-4" /> Gerar Imagem com IA</>
                          )}
                        </button>
                        
                        <button
                          onClick={downloadCanvas}
                          className="flex-1 flex justify-center items-center py-2.5 px-4 border border-neutral-300 rounded-lg shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                          <Download className="-ml-1 mr-2 h-4 w-4" /> Baixar Card Tipográfico
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Visual Previews */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Typographic Card Preview */}
                  <div className={`${generatedContent ? 'block' : 'hidden'}`}>
                    <h3 className="text-sm font-medium text-neutral-700 mb-2">Card Tipográfico (Pillow/Canvas)</h3>
                    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center p-4">
                      <canvas 
                        ref={canvasRef} 
                        className="max-w-full h-auto shadow-md rounded"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                  
                  {/* AI Generated Image Preview */}
                  {generatedImageUrl && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-700 mb-2">Imagem Gerada (Gemini Flash Image)</h3>
                      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center p-4">
                        <img 
                          src={generatedImageUrl} 
                          alt="AI Generated" 
                          className="max-w-full h-auto shadow-md rounded"
                          style={{ maxHeight: '400px', objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          )}
          
          {!brandKit && !isScraping && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <Wand2 className="h-8 w-8 text-indigo-500" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Bem-vindo ao BrandGen</h2>
              <p className="text-neutral-500 max-w-md">
                Insira a URL de qualquer negócio na barra lateral para extrair a identidade visual e gerar posts prontos para o Instagram.
              </p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
