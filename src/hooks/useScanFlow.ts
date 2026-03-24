import { useState, useEffect } from 'react';
import type { ScrapeResult, GeminiAnalysis } from '../types';

const URL_LOADING_STEPS = [
  'Abrindo o site... 🌐',
  'Lendo as cores e textos... 🎨',
  'A IA tá analisando sua marca... 🤖',
  'Quase lá, só um instante... ✨',
];

const IG_LOADING_STEPS = [
  'Lendo a imagem... 📸',
  'Extraindo as cores... 🎨',
  'A IA tá analisando o perfil... 🤖',
  'Quase pronto! ✨',
];

function normalizeBrandUrl(rawUrl: string) {
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) return '';
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://'))
    return trimmedUrl;
  return `https://${trimmedUrl}`;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type UseScanFlowOptions = {
  onScanComplete: (scraped: ScrapeResult, analysis: GeminiAnalysis) => void;
  onInstagramComplete: (
    data: GeminiAnalysis & {
      colors?: string[];
      primary_color?: string;
      secondary_color?: string;
      description?: string;
      keywords?: string[];
    },
  ) => void;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
};

export function useScanFlow({
  onScanComplete,
  onInstagramComplete,
  onSuccess,
  onError,
}: UseScanFlowOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);

  const scanUrl = async (rawUrl: string) => {
    const targetUrl = normalizeBrandUrl(rawUrl);
    if (!targetUrl) {
      onError?.('Opa, cola uma URL aí primeiro! 👆');
      return;
    }

    setIsScanning(true);
    setLoadingStep(URL_LOADING_STEPS[0]);

    try {
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!scrapeRes.ok) {
        let errMsg =
          'Esse site não quis abrir a porta pra gente 😅 Confere o link e tenta de novo?';
        try {
          const errData = await scrapeRes.json();
          errMsg = errData.error || errMsg;
        } catch {
          /* non-JSON response */
        }
        throw new Error(errMsg);
      }

      const scraped: ScrapeResult = await scrapeRes.json();

      await new Promise((resolve) => setTimeout(resolve, 300));
      setLoadingStep(URL_LOADING_STEPS[1]);
      setLoadingStep(URL_LOADING_STEPS[2]);

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scraped }),
      });

      if (!analyzeRes.ok) {
        let errorMsg = 'Ih, travou na análise! Tenta de novo? 🔄';
        try {
          const errData = await analyzeRes.json();
          errorMsg = errData.error || errorMsg;
        } catch (e) {
          console.error('Erro ao ler resposta de erro:', e);
        }
        throw new Error(errorMsg);
      }

      const analysis: GeminiAnalysis = await analyzeRes.json();

      setLoadingStep(URL_LOADING_STEPS[3]);
      onScanComplete(scraped, analysis);

      await new Promise((resolve) => setTimeout(resolve, 500));
      onSuccess?.('Marca analisada! Confere os campos abaixo 👇');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Ih, travou! Tenta de novo? 🔄';
      onError?.(message);
    } finally {
      setIsScanning(false);
      setLoadingStep(null);
    }
  };

  const scanInstagram = async (file: File) => {
    setIsScanning(true);
    setLoadingStep(IG_LOADING_STEPS[0]);

    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';

      setLoadingStep(IG_LOADING_STEPS[1]);

      const res = await fetch('/api/analyze-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      setLoadingStep(IG_LOADING_STEPS[2]);

      if (!res.ok) {
        let errorMsg = 'Não consegui analisar a imagem 😕 Tenta de novo?';
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch {
          /* non-JSON response */
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();

      setLoadingStep(IG_LOADING_STEPS[3]);
      onInstagramComplete(data);

      await new Promise((resolve) => setTimeout(resolve, 400));
      onSuccess?.('Perfil analisado! Confere os campos abaixo 👇');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Ih, travou! Tenta de novo? 🔄';
      onError?.(message);
    } finally {
      setIsScanning(false);
      setLoadingStep(null);
    }
  };

  return { isScanning, loadingStep, scanUrl, scanInstagram };
}
