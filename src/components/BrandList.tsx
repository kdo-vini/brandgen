import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import type { Brand } from '../types';
import Onboarding from './Onboarding';

type Props = {
  onSelectBrand: (brand: Brand) => void;
  onCreateBrand: () => void;
  onCreateBrandWithUrl?: (url: string) => void;
  onError?: (msg: string) => void;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

export default function BrandList({ onSelectBrand, onCreateBrand, onCreateBrandWithUrl, onError }: Props) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setBrands(data as Brand[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Ei, tem certeza? Isso apaga a marca e todos os posts gerados. Sem volta! 😬')) return;

    setDeleting(id);
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) {
      onError?.('Deu ruim ao deletar 😬 Tenta de novo?');
    } else {
      setBrands(prev => prev.filter(b => b.id !== id));
    }
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8C5A]" />
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <Onboarding
        onStartWithUrl={(url) => onCreateBrandWithUrl?.(url) ?? onCreateBrand()}
        onStartManual={onCreateBrand}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 font-display">Suas marcas 🎨</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {brands.length === 0
              ? 'Nenhuma marca ainda'
              : `${brands.length} marca${brands.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={onCreateBrand}
          className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF6B35] hover:bg-[#E55A28] transition-colors"
        >
          + Nova marca
        </button>
      </div>

      <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07 } },
          }}
        >
          {brands.map(brand => (
            <motion.div key={brand.id} variants={cardVariants}>
              <div
                onClick={() => onSelectBrand(brand)}
                className="bg-white rounded-xl border border-neutral-200 p-5 cursor-pointer hover:shadow-md hover:border-[#FFE0D0] transition-all group h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt="" className="w-10 h-10 object-contain rounded-lg border border-neutral-100" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: brand.primary_color }}
                      >
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-neutral-900 group-hover:text-[#FF6B35] transition-colors">{brand.name}</h3>
                      {brand.product_type && (
                        <span className="text-xs text-neutral-500 capitalize">{brand.product_type}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(brand.id, e)}
                    disabled={deleting === brand.id}
                    className="text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Excluir marca"
                    aria-label="Excluir marca"
                  >
                    {deleting === brand.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="flex gap-1.5 mb-3">
                  {brand.colors.slice(0, 5).map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-neutral-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {brand.url && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <Globe className="h-3 w-3" />
                    <span className="truncate">{brand.url.replace(/^https?:\/\//, '')}</span>
                  </div>
                )}

                {brand.tone && (
                  <div className="mt-2 flex gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 capitalize">
                      {brand.tone}
                    </span>
                    {brand.language && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                        {brand.language}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Add new brand card */}
          <motion.div variants={cardVariants}>
            <div
              onClick={onCreateBrand}
              className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-5 cursor-pointer hover:border-[#FF8C5A] hover:bg-[#FFF1EB]/30 transition-all flex flex-col items-center justify-center min-h-[160px]"
            >
              <Plus className="h-8 w-8 text-neutral-300 mb-2" />
              <span className="text-sm font-medium text-neutral-400">Nova marca</span>
            </div>
          </motion.div>
        </motion.div>
    </div>
  );
}
