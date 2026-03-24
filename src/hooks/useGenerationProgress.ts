import { useState, useEffect } from 'react';

const GENERATION_STAGES = [
  { pct: 12, msg: 'Estudando sua marca... 🧠', delay: 800 },
  { pct: 28, msg: 'Definindo o ângulo do post... 💡', delay: 4500 },
  { pct: 48, msg: 'Escrevendo o copy... ✍️', delay: 10000 },
  { pct: 65, msg: 'Construindo o brief visual... 🎨', delay: 16000 },
  { pct: 82, msg: 'O crítico tá avaliando o conteúdo... 🔍', delay: 22000 },
  { pct: 92, msg: 'Finalizando os detalhes... ⚡', delay: 28000 },
  { pct: 97, msg: 'Quase lá, segura mais um segundo... 🙏', delay: 35000 },
];

export function useGenerationProgress(isGenerating: boolean) {
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');

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
      }, delay),
    );

    const creepInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 99) return 99;
        if (prev >= 97) return prev + 0.1;
        return prev;
      });
    }, 1000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(creepInterval);
    };
  }, [isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  return { generationProgress, generationStep };
}
