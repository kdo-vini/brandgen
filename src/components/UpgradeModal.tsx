import React, { useState } from 'react';
import { X, Sparkles, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User } from '@supabase/supabase-js';
import { PLAN_LIMITS } from '../lib/subscription';

type Props = {
  user: User;
  reason?: 'brand_limit' | 'image_limit' | 'text_limit' | 'general';
  onClose: () => void;
};

const REASONS: Record<NonNullable<Props['reason']>, { title: string; description: string }> = {
  brand_limit: {
    title: 'Você chegou no limite de marcas!',
    description: 'O plano Grátis permite só 1 marca. Faz upgrade pro Social Media Pro e gerencia até 3 marcas.',
  },
  image_limit: {
    title: 'Limite de imagens atingido!',
    description: `Você usou todas as ${PLAN_LIMITS.free.imageGenerationsPerMonth} imagens do mês. No Pro, são ${PLAN_LIMITS.pro.imageGenerationsPerMonth} imagens por mês.`,
  },
  text_limit: {
    title: 'Limite de posts atingido!',
    description: `Você usou todos os ${PLAN_LIMITS.free.textGenerationsPerMonth} posts do mês. No Pro, são ${PLAN_LIMITS.pro.textGenerationsPerMonth} por mês.`,
  },
  general: {
    title: 'Sobe de nível com o Pro!',
    description: 'Mais marcas, mais posts, mais imagens. Tudo que você precisa pra produzir conteúdo de verdade.',
  },
};

const PRO_FEATURES = [
  `Até ${PLAN_LIMITS.pro.brands} marcas`,
  `${PLAN_LIMITS.pro.textGenerationsPerMonth} posts por mês`,
  `${PLAN_LIMITS.pro.imageGenerationsPerMonth} imagens por mês`,
  'Controles avançados de tom e CTA',
  'Estratégia criativa completa',
  'Histórico ilimitado',
];

export default function UpgradeModal({ user, reason = 'general', onClose }: Props) {
  const [loading, setLoading] = useState(false);

  const { title, description } = REASONS[reason];

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Erro ao abrir checkout');
        setLoading(false);
      }
    } catch {
      alert('Erro ao conectar. Tenta de novo.');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-br from-[#FF6B35] to-[#E55A28] px-6 pt-8 pb-6 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold font-display mb-1">{title}</h2>
            <p className="text-sm text-white/80 leading-relaxed">{description}</p>
          </div>

          {/* Plan card */}
          <div className="p-6">
            <div className="border-2 border-[#FF6B35] rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-[#FF6B35] uppercase tracking-wider mb-0.5">Social Media Pro</p>
                  <p className="text-2xl font-bold text-neutral-900 font-display">
                    R$ 97<span className="text-sm font-normal text-neutral-500">/mês</span>
                  </p>
                </div>
                <span className="inline-flex items-center px-2 py-1 bg-[#FFF1EB] text-[#FF6B35] text-xs font-semibold rounded-full">
                  Popular
                </span>
              </div>

              <ul className="space-y-2">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-700">
                    <Check className="h-4 w-4 text-[#06D6A0] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-[#FF6B35] hover:bg-[#E55A28] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Abrindo checkout...</>
              ) : (
                'Quero o Pro agora'
              )}
            </button>

            <p className="text-center text-xs text-neutral-400 mt-3">
              Pagamento seguro via Stripe · Cancela quando quiser
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
