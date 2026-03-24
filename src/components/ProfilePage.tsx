import React, { useState } from 'react';
import { ArrowLeft, Loader2, Mail, User, LogOut, Sparkles, Lock, KeyRound, Zap, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { PLAN_LIMITS, planLabel } from '../lib/subscription';
import type { SubscriptionInfo, UsageInfo } from '../lib/subscription';

type Props = {
  user: SupabaseUser;
  subscription: SubscriptionInfo;
  usage: UsageInfo;
  onBack: () => void;
  onLogout: () => void;
  onError: (msg: string, type?: 'error' | 'success') => void;
  onSuccess: (msg: string) => void;
};

export default function ProfilePage({ user, subscription, usage, onBack, onLogout, onError, onSuccess }: Props) {
  const initialName = (user.user_metadata?.full_name as string | undefined) ?? '';
  const [fullName, setFullName] = useState(initialName);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);

  const isGoogleAuth = user.app_metadata?.provider === 'google';
  const avatarLetter = (fullName.trim() || user.email || 'U').charAt(0).toUpperCase();
  const isPro = subscription.plan === 'pro' && subscription.isActive;
  const limits = PLAN_LIMITS[subscription.plan];

  const handleSaveProfile = async () => {
    const trimmedName = fullName.trim();
    setIsSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: trimmedName } });
      if (error) throw error;
      onSuccess('Perfil atualizado! Arrasou 🎉');
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Deu ruim ao salvar 😬 Tenta de novo?', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { onError('A nova senha deve ter pelo menos 8 caracteres.', 'error'); return; }
    if (password !== confirmPassword) { onError('As senhas não coincidem.', 'error'); return; }
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      onSuccess('Senha alterada com sucesso! 🛡️');
      setPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Erro ao alterar a senha 😬', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleUpgrade = async () => {
    setIsLoadingCheckout(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { onError(data.error || 'Erro ao abrir checkout', 'error'); setIsLoadingCheckout(false); }
    } catch {
      onError('Erro ao conectar. Tenta de novo.', 'error');
      setIsLoadingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { onError(data.error || 'Erro ao abrir portal', 'error'); setIsLoadingPortal(false); }
    } catch {
      onError('Erro ao conectar. Tenta de novo.', 'error');
      setIsLoadingPortal(false);
    }
  };

  const hasChanges = fullName.trim() !== initialName;

  const UsageBar = ({ used, max, label }: { used: number; max: number; label: string }) => {
    const pct = Math.min((used / max) * 100, 100);
    const isWarning = pct >= 80;
    return (
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-neutral-500">{label}</span>
          <span className={`font-medium ${isWarning ? 'text-[#EF476F]' : 'text-neutral-700'}`}>
            {used} / {max}
          </span>
        </div>
        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: isWarning ? '#EF476F' : '#FF6B35',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="max-w-2xl mx-auto"
    >
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold font-display flex-shrink-0"
          style={{ backgroundColor: '#FF6B35' }}
        >
          {avatarLetter}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-display">
            {fullName.trim() || 'Seu perfil'}
          </h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Personal data */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="h-4 w-4 text-[#FF8C5A]" />
            <h2 className="text-base font-semibold text-neutral-900 font-display">Dados pessoais</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nome de exibição</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Como você quer ser chamado?"
                className="block w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                E-mail
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                  <Lock className="h-3 w-3" />não editável
                </span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 border border-neutral-200 rounded-lg bg-neutral-50">
                <Mail className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                <span className="text-sm text-neutral-500">{user.email}</span>
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile || !hasChanges}
              className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A28] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSavingProfile ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar alterações'}
            </button>
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-4 w-4 text-[#FF8C5A]" />
            <h2 className="text-base font-semibold text-neutral-900 font-display">Minha assinatura</h2>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                style={
                  isPro
                    ? { backgroundColor: '#1A1A2E', color: '#FFD166' }
                    : { backgroundColor: '#FFF1EB', color: '#FF6B35' }
                }
              >
                {isPro ? '⚡ Social Media Pro' : 'Plano Grátis'}
              </span>
              {subscription.cancelAtPeriodEnd && (
                <span className="text-xs text-[#EF476F]">Cancela no fim do período</span>
              )}
            </div>
            {subscription.currentPeriodEnd && isPro && (
              <span className="text-xs text-neutral-400">
                Renova em {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          {/* Usage meters */}
          <div className="space-y-3 mb-5 p-4 bg-neutral-50 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart2 className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Uso em {usage.month}</span>
            </div>
            <UsageBar used={usage.textGenerations} max={limits.textGenerationsPerMonth} label="Posts gerados" />
            <UsageBar used={usage.imageGenerations} max={limits.imageGenerationsPerMonth} label="Imagens geradas" />
          </div>

          {isPro ? (
            <button
              onClick={handleManageSubscription}
              disabled={isLoadingPortal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              {isLoadingPortal ? <><Loader2 className="h-4 w-4 animate-spin" /> Abrindo...</> : 'Gerenciar assinatura'}
            </button>
          ) : (
            <div>
              <button
                onClick={handleUpgrade}
                disabled={isLoadingCheckout}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#FF6B35', color: 'white' }}
              >
                {isLoadingCheckout ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Abrindo checkout...</>
                ) : (
                  <><Zap className="h-4 w-4" /> Quero o Pro — R$ 129/mês</>
                )}
              </button>
              <p className="mt-2 text-xs text-neutral-400">
                3 marcas · {PLAN_LIMITS.pro.textGenerationsPerMonth} posts · {PLAN_LIMITS.pro.imageGenerationsPerMonth} imagens/mês
              </p>
            </div>
          )}
        </section>

        {/* Change password (hidden for Google Auth) */}
        {!isGoogleAuth && (
          <section className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <KeyRound className="h-4 w-4 text-[#FF8C5A]" />
              <h2 className="text-base font-semibold text-neutral-900 font-display">Alterar senha</h2>
            </div>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nova senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="No mínimo 8 caracteres"
                  minLength={8}
                  className="block w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  minLength={8}
                  className="block w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPassword || !password || !confirmPassword}
                  className="inline-flex items-center gap-2 px-5 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                >
                  {isSavingPassword ? <><Loader2 className="h-4 w-4 animate-spin" /> Atualizando...</> : 'Redefinir senha'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Session */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="h-4 w-4 text-[#FF8C5A]" />
            <h2 className="text-base font-semibold text-neutral-900 font-display">Sessão e segurança</h2>
          </div>
          <div className="flex items-start justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-800">Sair da conta</p>
              <p className="text-xs text-neutral-500 mt-0.5">Encerra a sessão atual neste dispositivo.</p>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#EF476F] hover:text-red-700 transition-colors flex-shrink-0 whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair da conta
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
