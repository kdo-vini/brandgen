import React, { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { BrandAsset } from '../types';

type Props = {
  user: User;
  brandId: string;
};

export default function AssetUploader({ user, brandId }: Props) {
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<BrandAsset['type']>('product_photo');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAssets();
  }, [brandId]);

  const fetchAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('brand_assets')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAssets(data as BrandAsset[]);
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files) as File[]) {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${brandId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);

      // Save reference in DB
      const { data: assetData, error: dbError } = await supabase
        .from('brand_assets')
        .insert({
          user_id: user.id,
          brand_id: brandId,
          type: uploadType,
          url: urlData.publicUrl,
          filename: file.name,
          metadata: { size: file.size, type: file.type, path: filePath }
        })
        .select()
        .single();

      if (!dbError && assetData) {
        setAssets(prev => [assetData as BrandAsset, ...prev]);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (asset: BrandAsset) => {
    setDeleting(asset.id);

    // Delete from storage
    const storagePath = (asset.metadata as any)?.path;
    if (storagePath) {
      await supabase.storage.from('brand-assets').remove([storagePath]);
    }

    // Delete from DB
    await supabase.from('brand_assets').delete().eq('id', asset.id);
    setAssets(prev => prev.filter(a => a.id !== asset.id));
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-700">Fotos do produto 📸</h3>
        <div className="flex items-center gap-2">
          <select
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value as BrandAsset['type'])}
            className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 focus:border-[#FF6B35] focus:outline-none focus:ring-[#FF6B35]"
          >
            <option value="product_photo">Produto</option>
            <option value="reference">Referencia</option>
            <option value="logo">Logo</option>
          </select>
          <label className="inline-flex items-center px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 cursor-pointer transition-colors">
            {uploading ? (
              <><Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" /> Enviando...</>
            ) : (
              <><Upload className="mr-1.5 h-3.5 w-3.5" /> Enviar foto</>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
        </div>
      ) : assets.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center cursor-pointer hover:border-[#FF8C5A] hover:bg-[#FFF1EB]/30 transition-all"
        >
          <ImageIcon className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">Arrasta as fotos do produto aqui ou clica pra escolher</p>
          <p className="text-xs text-neutral-300 mt-1">JPG, PNG ou WebP • Quanto mais foto, melhor o contexto pra IA!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {assets.map(asset => (
            <div key={asset.id} className="relative group rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
              <img
                src={asset.url}
                alt={asset.filename || 'Asset'}
                className="w-full h-32 object-cover"
              />
              <button
                onClick={() => handleDelete(asset)}
                disabled={deleting === asset.id}
                className="absolute top-1.5 right-1.5 p-1 bg-white/80 rounded-md text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {deleting === asset.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
              {asset.filename && (
                <div className="px-2 py-1">
                  <p className="truncate text-xs text-neutral-500">{asset.filename}</p>
                  <p className="truncate text-[10px] uppercase tracking-wide text-neutral-300">{asset.type}</p>
                </div>
              )}
            </div>
          ))}

          {/* Add more button */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-200 rounded-lg flex flex-col items-center justify-center min-h-[128px] cursor-pointer hover:border-[#FF8C5A] transition-colors"
          >
            <Upload className="h-5 w-5 text-neutral-300 mb-1" />
            <span className="text-xs text-neutral-400">+ Adicionar</span>
          </div>
        </div>
      )}
    </div>
  );
}
