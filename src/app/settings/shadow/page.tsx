'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import { Loader2, Save, X, CheckCircle, AlertCircle, Shield, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Link from 'next/link';

export default function ShadowSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const [anonIdentity, setAnonIdentity] = useState({
    alias_name: '',
    avatar_seed: '',
    district: 'identicon',
  });

  useEffect(() => {
    async function loadAnon() {
      if (user) {
        const { data } = await supabase
          .from('anonymous_identities')
          .select('alias_name, avatar_seed, district')
          .eq('user_id', user.id)
          .single();
        if (data) setAnonIdentity({
          alias_name: data.alias_name || '',
          avatar_seed: data.avatar_seed || '',
          district: data.district || 'identicon',
        });
        setLoading(false);
      }
    }
    loadAnon();
  }, [user, supabase]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from('anonymous_identities')
      .upsert({
        user_id: user?.id,
        alias_name: anonIdentity.alias_name,
        avatar_seed: anonIdentity.avatar_seed || 'default',
        district: anonIdentity.district || 'identicon',
      }, { onConflict: 'user_id' });

    setSaving(false);

    if (error) {
      setNotification({ show: true, type: 'error', message: error.message });
    } else {
      setNotification({ show: true, type: 'success', message: 'Shadow identity synchronized.' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    }
  };

  const modalContent = notification.show && (typeof document !== 'undefined') && createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500" 
        onClick={() => setNotification({ ...notification, show: false })}
      />
      <div className="relative bg-white rounded-[3rem] border border-zinc-100 shadow-[0_32px_128px_rgba(0,0,0,0.2)] p-10 max-w-sm w-full space-y-8 animate-in zoom-in-95 duration-300">
        {/* ... similar modal content ... */}
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
          <Shield size={28} />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-black uppercase tracking-tighter">Shadow Locked</h3>
          <p className="text-sm text-zinc-600 font-medium leading-relaxed">{notification.message}</p>
        </div>
        <Button onClick={() => setNotification({ ...notification, show: false })} className="w-full h-12 rounded-full bg-black text-white px-8 font-black uppercase tracking-widest text-[10px]">Confirm Status</Button>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 animate-reveal">
      {modalContent}
      
      <div className="flex flex-col gap-8 mb-12">
        <Link href="/settings" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <div className="flex items-center gap-4">
          <Shield size={32} className="text-purple-600" />
          <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase">Shadow Identity</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="p-10 rounded-[3rem] bg-black text-white space-y-10 shadow-2xl">
          <p className="text-[10px] font-bold leading-relaxed text-white/40 uppercase tracking-widest max-w-md">
            Your shadow identity allows you to publish narratives and respond to signals without revealing your primary registry coordinate.
          </p>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] pl-1">Alias / Code Name</label>
              <input 
                value={anonIdentity.alias_name}
                onChange={e => setAnonIdentity({...anonIdentity, alias_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 h-16 text-sm font-bold focus:border-white/40 outline-none transition-all placeholder:text-white/10"
                placeholder="Ghost_Protocol"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] pl-1">Avatar Identity Seed</label>
              <input 
                value={anonIdentity.avatar_seed}
                onChange={e => setAnonIdentity({...anonIdentity, avatar_seed: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 h-16 text-sm font-bold focus:border-white/40 outline-none transition-all placeholder:text-white/10"
                placeholder="random_seed"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] pl-1">Visual District (Style)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'identicon', name: 'Neural' },
                  { id: 'bottts', name: 'Synthetix' },
                  { id: 'shapes', name: 'Abstract' },
                  { id: 'pixel-art', name: 'Archive' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setAnonIdentity({ ...anonIdentity, district: d.id })}
                    className={`p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
                      anonIdentity.district === d.id 
                        ? 'bg-white text-black border-white' 
                        : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white/5 border border-white/5 backdrop-blur-sm">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] bg-white flex items-center justify-center overflow-hidden shadow-2xl">
                 <img 
                   src={`https://api.dicebear.com/7.x/${anonIdentity.district}/svg?seed=${anonIdentity.avatar_seed || 'default'}&backgroundColor=000000`}
                   className="w-full h-full object-cover invert"
                   alt="Preview"
                 />
              </div>
              <div className="space-y-1 md:space-y-2 text-center sm:text-left">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Active Signature</p>
                <p className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">{anonIdentity.alias_name || 'Unidentified'}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[8px] md:text-[9px] font-bold text-white/40 uppercase tracking-widest">District: {anonIdentity.district}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="rounded-full h-14 px-12 font-black uppercase tracking-widest text-[10px] bg-black text-white border-white/10 hover:bg-white hover:text-black transition-all">
            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
            Seal Identity
          </Button>
        </div>
      </form>
    </div>
  );
}
