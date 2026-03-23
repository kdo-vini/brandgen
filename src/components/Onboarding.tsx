import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

type Props = {
  onStartWithUrl: (url: string) => void;
  onStartManual: () => void;
};

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const, delay },
});

const pills = [
  { icon: '⚡', label: 'Cores e logo automáticos' },
  { icon: '🎯', label: 'Tom de voz da marca' },
  { icon: '✨', label: 'Posts prontos em segundos' },
];

export default function Onboarding({ onStartWithUrl, onStartManual }: Props) {
  const [inputUrl, setInputUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!inputUrl.trim()) {
      inputRef.current?.focus();
      return;
    }

    let formatted = inputUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'https://' + formatted;
    }

    onStartWithUrl(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">

        {/* Logo mark */}
        <motion.div {...fadeUp(0)}>
          <div className="w-16 h-16 rounded-2xl bg-[#FF6B35] flex items-center justify-center text-white text-3xl font-bold font-display mx-auto mb-8">
            C
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold font-display text-neutral-900 mb-4 leading-tight"
          {...fadeUp(0.1)}
        >
          Seu marketing nunca mais vai travar. 🔥
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg text-neutral-600 mb-8 leading-relaxed"
          {...fadeUp(0.2)}
        >
          Cola o link do seu site e a gente descobre tudo sobre a sua marca em segundos. Sem enrolação.
        </motion.p>

        {/* URL input + button */}
        <motion.div className="flex gap-2 mb-6" {...fadeUp(0.3)}>
          <input
            ref={inputRef}
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://suamarca.com.br"
            aria-label="URL do site da sua marca"
            className="flex-1 px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-[#FF6B35] text-neutral-900 placeholder-neutral-400 bg-white text-base"
          />
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-[#FF6B35] hover:bg-[#E55A28] text-white rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
            aria-label="Analisar site"
          >
            Analisar site
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }}
        >
          {pills.map((pill, i) => (
            <motion.span
              key={pill.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-sm text-neutral-700 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 + i * 0.07 }}
            >
              <span aria-hidden="true">{pill.icon}</span>
              {pill.label}
            </motion.span>
          ))}
        </motion.div>

        {/* Manual link */}
        <motion.button
          type="button"
          onClick={onStartManual}
          className="text-sm text-neutral-400 hover:text-[#FF6B35] transition-colors cursor-pointer"
          aria-label="Preencher dados da marca manualmente"
          {...fadeUp(0.5)}
        >
          prefiro preencher manualmente →
        </motion.button>

      </div>
    </div>
  );
}
