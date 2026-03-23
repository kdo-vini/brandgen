/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Key, LogOut, Loader2, UserCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { User } from '@supabase/supabase-js';
import type { Brand, AppView } from './types';
import { supabase } from './lib/supabase';
import BrandList from './components/BrandList';
import BrandForm from './components/BrandForm';
import BrandDetail from './components/BrandDetail';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import ResetPasswordPage from './components/ResetPasswordPage';
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
  const [view, setView] = useState<AppView>('landing');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const resolvedUser = session?.user ?? null;
      setUser(resolvedUser);
      if (resolvedUser) setView('list');
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      if (event === 'SIGNED_OUT') {
        setView('landing');
      }
      if (event === 'PASSWORD_RECOVERY') {
        setView('reset-password');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('landing');
    setSelectedBrand(null);
    addToast('Até logo! Volta logo 👋', 'success');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B35] flex items-center justify-center text-white font-bold text-xl">C</div>
          <Loader2 className="h-5 w-5 animate-spin text-[#FF8C5A]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage onError={(msg) => addToast(msg, 'error')} onSuccess={(msg) => addToast(msg, 'success')} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

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
    <div className="min-h-screen text-neutral-900 font-sans bg-[#FFF8F0]">
      {/* Top Nav - Hidden on Landing Page and Reset Password */}
      {view !== 'landing' && view !== 'reset-password' && (
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
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 hidden sm:block truncate max-w-[160px]">{user.email}</span>
              <button
                onClick={() => setView('profile')}
                className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  view === 'profile'
                    ? 'text-[#FF6B35] bg-[#FFF1EB]'
                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                }`}
                title="Meu perfil"
              >
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil</span>
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={view === 'landing' || view === 'reset-password' ? '' : 'max-w-7xl mx-auto px-6 py-8'}>
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <LandingPage onStart={() => setView('list')} />
            </motion.div>
          )}

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
                user={user}
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
                user={user}
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
                user={user}
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

          {view === 'profile' && (
            <motion.div
              key="profile"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <ProfilePage
                user={user}
                onBack={() => setView('list')}
                onLogout={handleLogout}
                onError={addToast}
                onSuccess={(msg) => addToast(msg, 'success')}
              />
            </motion.div>
          )}

          {view === 'reset-password' && (
            <motion.div
              key="reset-password"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <ResetPasswordPage
                onSuccess={(msg) => addToast(msg, 'success')}
                onError={(msg) => addToast(msg, 'error')}
                onCompleted={() => setView('list')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
