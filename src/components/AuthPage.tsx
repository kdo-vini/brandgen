import React, { useState } from 'react';
import { Loader2, CheckCircle, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

type Props = {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
};

type AuthMode = 'login' | 'signup' | 'forgot' | 'sent';

export default function AuthPage({ onError, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deu ruim com o Google 😬 Tenta de novo?';
      onError(msg);
      setIsLoading(false);
    }
  };

  const mapErrorMessage = (err: any): string => {
    const msg = err?.message || '';
    if (msg.includes('Invalid login credentials')) {
      return 'E-mail ou senha incorretos.';
    }
    if (msg.includes('Email not confirmed')) {
      return 'Você precisa confirmar seu e-mail antes de entrar.';
    }
    if (msg.includes('User already registered') || msg.includes('already been registered')) {
      return 'Este e-mail já está cadastrado.';
    }
    return msg || 'Ops, deu um erro inesperado 😬';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (authMode !== 'forgot' && password.length < 8) {
      onError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (authMode === 'signup' && password !== confirmPassword) {
      onError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onSuccess('Conta criada! Dá uma olhada no seu e-mail pra confirmar.');
        setAuthMode('login');
      } else if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // Sessão estabelecida, App.tsx vai mudar de view
      } else if (authMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin + '/reset-password',
        });
        if (error) throw error;
        setAuthMode('sent');
      }
    } catch (err: unknown) {
      onError(mapErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-2xl border border-neutral-200 shadow-sm w-full max-w-md p-8"
        layout
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B35] flex items-center justify-center text-white font-bold text-xl">
            C
          </div>
          <span className="text-2xl font-bold tracking-tight font-display">Criaê</span>
        </div>

        {authMode === 'sent' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <CheckCircle className="h-12 w-12 text-[#06D6A0] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-neutral-900 font-display mb-2">
              Link enviado! Confere lá 📬
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              Se o e-mail <strong>{email}</strong> estiver na nossa base, mandamos um link para você redefinir sua senha.
            </p>
            <button
              onClick={() => setAuthMode('login')}
              className="text-sm text-[#FF6B35] hover:text-[#E55A28] transition-colors"
            >
              Voltar para o login
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={authMode}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {(authMode === 'login' || authMode === 'signup') && (
                <>
                  <h1 className="text-2xl font-bold text-neutral-900 font-display mb-1">
                    {authMode === 'login' ? 'Que bom te ver de novo! 🚀' : 'Vamos criar sua conta! ✨'}
                  </h1>
                  <p className="text-sm text-neutral-500 mb-8">
                    {authMode === 'login' 
                      ? 'O seu marketeiro pessoal tá te esperando.' 
                      : 'Em menos de 1 minuto você tá pronto pra voar.'}
                  </p>

                  {/* Google */}
                  <button
                    onClick={handleGoogle}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 mb-4"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                    </svg>
                    {authMode === 'login' ? 'Entrar com Google' : 'Criar conta com Google'}
                  </button>

                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-white text-xs text-neutral-400">ou com e-mail</span>
                    </div>
                  </div>
                </>
              )}

              {authMode === 'forgot' && (
                <>
                  <h1 className="text-2xl font-bold text-neutral-900 font-display mb-1">
                    Esqueceu a senha? 🤔
                  </h1>
                  <p className="text-sm text-neutral-500 mb-8">
                    Relaxa! Passa seu e-mail pra gente te mandar um link de recuperação.
                  </p>
                </>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none"
                    />
                  </div>
                </div>

                {authMode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-neutral-700">
                        Senha
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setAuthMode('forgot')}
                          className="text-xs text-[#FF6B35] hover:text-[#E55A28]"
                        >
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-neutral-400" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo de 8 caracteres"
                        required
                        minLength={8}
                        className="block w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none"
                      />
                    </div>
                  </div>
                )}

                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-neutral-400" />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repita sua senha"
                        required
                        minLength={8}
                        className="block w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email.trim() || (authMode !== 'forgot' && !password) || (authMode === 'signup' && !confirmPassword)}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#E55A28] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</>
                  ) : authMode === 'login' ? (
                    'Entrar'
                  ) : authMode === 'signup' ? (
                    'Criar conta'
                  ) : (
                    'Enviar link de reset'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-neutral-500">
                {authMode === 'login' ? (
                  <>
                    Ainda não tem conta?{' '}
                    <button
                      onClick={() => setAuthMode('signup')}
                      className="text-[#FF6B35] hover:text-[#E55A28] font-medium"
                    >
                      Criar agora
                    </button>
                  </>
                ) : authMode === 'signup' ? (
                  <>
                    Já tem uma conta?{' '}
                    <button
                      onClick={() => setAuthMode('login')}
                      className="text-[#FF6B35] hover:text-[#E55A28] font-medium"
                    >
                      Acessar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setAuthMode('login')}
                    className="text-neutral-500 hover:text-neutral-700 font-medium"
                  >
                    Voltar para o login
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
