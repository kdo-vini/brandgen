import React, { useEffect, useState } from 'react';
import { Loader2, Trash2, Copy, Check, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { GeneratedPost } from '../types';

type Props = {
  brandId: string;
};

export default function PostHistory({ brandId }: Props) {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [brandId]);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('generated_posts')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data as GeneratedPost[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('generated_posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
        <p className="text-sm text-neutral-400">Nada por aqui ainda. Bora criar o primeiro post? 🚀</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        {posts.length} post{posts.length > 1 ? 's' : ''} criado{posts.length > 1 ? 's' : ''}
      </h3>

      {posts.map(post => (
        <div key={post.id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
            onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-900 truncate">
                  {post.hook || 'Post sem título'}
                </span>
                <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                  {post.post_type}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {new Date(post.created_at).toLocaleString('pt-BR')} &middot; {post.format}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                className="text-neutral-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {expandedId === post.id ? (
                <ChevronUp className="h-4 w-4 text-neutral-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              )}
            </div>
          </div>

          {expandedId === post.id && (
            <div className="px-4 pb-4 border-t border-neutral-100 pt-3 space-y-3">
              {post.hook && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Hook</h4>
                    <button onClick={() => copyToClipboard(post.hook!, `hook-${post.id}`)} className="text-neutral-400 hover:text-[#FF6B35]">
                      {copiedField === `hook-${post.id}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-sm font-bold text-neutral-900 mt-1">{post.hook}</p>
                </div>
              )}

              {post.caption && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Legenda</h4>
                    <button onClick={() => copyToClipboard(post.caption!, `caption-${post.id}`)} className="text-neutral-400 hover:text-[#FF6B35]">
                      {copiedField === `caption-${post.id}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap mt-1">{post.caption}</p>
                </div>
              )}

              {post.cta && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">CTA</h4>
                  <p className="text-sm font-medium text-[#FF6B35] mt-1">{post.cta}</p>
                </div>
              )}

              {post.hashtags && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Hashtags</h4>
                  <p className="text-sm text-neutral-500 mt-1">{post.hashtags}</p>
                </div>
              )}

              {post.image_prompt && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Prompt de imagem</h4>
                    <button onClick={() => copyToClipboard(post.image_prompt!, `prompt-${post.id}`)} className="text-neutral-400 hover:text-[#FF6B35]">
                      {copiedField === `prompt-${post.id}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded mt-1 font-mono">{post.image_prompt}</p>
                </div>
              )}

              {post.image_url && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Imagem gerada</h4>
                  <img src={post.image_url} alt="Generated" className="max-h-48 rounded border border-neutral-200" />
                </div>
              )}

              {/* Copy all button */}
              <button
                onClick={() => copyToClipboard(
                  `${post.hook || ''}\n\n${post.caption || ''}\n\n${post.cta || ''}\n\n${post.hashtags || ''}`,
                  `all-${post.id}`
                )}
                className="inline-flex items-center px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
              >
                {copiedField === `all-${post.id}` ? <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                Copiar tudo
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
