/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import type { Brand, AppView } from './types';
import BrandList from './components/BrandList';
import BrandForm from './components/BrandForm';
import BrandDetail from './components/BrandDetail';

// Global type for AI Studio
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [view, setView] = useState<AppView>('list');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

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
          <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">API Key Necessária</h2>
          <p className="text-neutral-600 mb-8">
            Para usar os modelos avançados de geração de imagem, você precisa selecionar uma chave de API do Google Cloud com faturamento ativado.
            <br/><br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[#FF6B35] hover:text-[#E55A28] font-medium hover:underline">
              Saiba mais sobre faturamento
            </a>
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#E55A28] transition-colors shadow-sm"
          >
            Selecionar API Key
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
        {view === 'list' && (
          <BrandList
            onSelectBrand={(brand) => {
              setSelectedBrand(brand);
              setView('detail');
            }}
            onCreateBrand={() => {
              setSelectedBrand(null);
              setView('create');
            }}
          />
        )}

        {view === 'create' && (
          <BrandForm
            onSaved={(brand) => {
              setSelectedBrand(brand);
              setView('detail');
            }}
            onCancel={() => setView('list')}
          />
        )}

        {view === 'edit' && selectedBrand && (
          <BrandForm
            existingBrand={selectedBrand}
            onSaved={(brand) => {
              setSelectedBrand(brand);
              setView('detail');
            }}
            onCancel={() => setView('detail')}
          />
        )}

        {view === 'detail' && selectedBrand && (
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
          />
        )}
      </main>
    </div>
  );
}
