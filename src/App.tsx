/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Brand, AppView } from './types';
import BrandList from './components/BrandList';
import BrandForm from './components/BrandForm';
import BrandDetail from './components/BrandDetail';
import ToastContainer from './components/Toast';
import { useToast } from './hooks/useToast';

// Global type for AI Studio
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = { duration: 0.2, ease: 'easeOut' as const };

export default function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [view, setView] = useState<AppView>('list');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string>('');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0] p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#FFF1EB] rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="h-8 w-8 text-[#FF8C5A]" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
            Precisamos de uma API Key 🔑
          </h2>
          <p className="text-neutral-600 mb-8">
            Pra usar os modelos de imagem do Gemini, você precisa de uma chave da Google Cloud com faturamento ativo. É rapidinho de configurar!
            <br /><br />
            <a
              href="https://ai.google.dev/gemini-api/docs/billing"
              target="_blank"
              rel="noreferrer"
              className="text-[#FF6B35] hover:text-[#E55A28] font-medium hover:underline"
            >
              Saiba mais sobre faturamento
            </a>
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#E55A28] transition-colors shadow-sm"
          >
            Configurar minha API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-neutral-900 font-sans">
      {/* Top Nav */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => { setView('list'); setSelectedBrand(null); }}
          >
            <div className="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white font-bold">
              C
            </div>
            <h1 className="text-xl font-bold tracking-tight font-display">Criaê</h1>
          </div>
          <div className="text-xs text-neutral-400">
            O seu marketeiro pessoal ✦
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div
              key="list"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <BrandList
                onSelectBrand={(brand) => {
                  setSelectedBrand(brand);
                  setView('detail');
                }}
                onCreateBrand={() => {
                  setSelectedBrand(null);
                  setView('create');
                }}
                onCreateBrandWithUrl={(url) => {
                  setSelectedBrand(null);
                  setOnboardingUrl(url);
                  setView('create');
                }}
                onError={addToast}
              />
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div
              key="create"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <BrandForm
                initialUrl={onboardingUrl}
                onSaved={(brand) => {
                  setSelectedBrand(brand);
                  setOnboardingUrl('');
                  setView('detail');
                }}
                onCancel={() => {
                  setOnboardingUrl('');
                  setView('list');
                }}
                onError={addToast}
                onSuccess={(msg) => addToast(msg, 'success')}
              />
            </motion.div>
          )}

          {view === 'edit' && selectedBrand && (
            <motion.div
              key="edit"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <BrandForm
                existingBrand={selectedBrand}
                onSaved={(brand) => {
                  setSelectedBrand(brand);
                  setView('detail');
                }}
                onCancel={() => setView('detail')}
                onError={addToast}
                onSuccess={(msg) => addToast(msg, 'success')}
              />
            </motion.div>
          )}

          {view === 'detail' && selectedBrand && (
            <motion.div
              key="detail"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <BrandDetail
                brand={selectedBrand}
                onBack={() => {
                  setView('list');
                  setSelectedBrand(null);
                }}
                onEdit={(brand) => {
                  setSelectedBrand(brand);
                  setView('edit');
                }}
                onError={addToast}
                onSuccess={(msg) => addToast(msg, 'success')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
