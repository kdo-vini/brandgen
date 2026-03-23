import React, { useState } from 'react';
import { Loader2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Props = {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onCompleted: () => void;
};

export default function ResetPasswordPage({ onSuccess, onError, onCompleted }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      onError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      onError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      onSuccess('Senha atualizada com sucesso! 🚀');
      onCompleted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar a senha 😬 Tenta de novo?';
      onError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
      <div className="flex justify-center mb-6">
        <div className="w-12 h-12 bg-[#FFF1EB] text-[#FF6B35] rounded-full flex items-center justify-center">
          <KeyRound className="w-6 h-6" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-center text-neutral-900 font-display mb-2">
        Criar nova senha
      </h2>
      <p className="text-sm text-center text-neutral-500 mb-8">
        Digite sua nova senha abaixo para recuperar o acesso à sua conta.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Nova senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="No mínimo 8 caracteres"
            required
            minLength={8}
            className="block w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Confirmar nova senha
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            required
            minLength={8}
            className="block w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !password || !confirmPassword}
          className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#E55A28] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 mt-6"
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Atualizando...</>
          ) : (
            'Salvar nova senha'
          )}
        </button>
      </form>
    </div>
  );
}
