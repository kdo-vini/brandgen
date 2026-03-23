import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export type ToastType = 'error' | 'success';

export type ToastData = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastItemProps = {
  key?: React.Key;
  toast: ToastData;
  onRemove: (id: string) => void;
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm w-full pointer-events-auto ${
        toast.type === 'error'
          ? 'bg-[#EF476F] text-white'
          : 'bg-[#06D6A0] text-white'
      }`}
    >
      {toast.type === 'error' ? (
        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      )}
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

type ContainerProps = {
  toasts: ToastData[];
  onRemove: (id: string) => void;
};

export default function ToastContainer({ toasts, onRemove }: ContainerProps) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notificações"
    >
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}
