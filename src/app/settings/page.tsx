'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import { ImageUploader } from '@/components/editor/ImageUploader';
import { Loader2, Save, X, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    website: '',
    twitter: '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [anonIdentity, setAnonIdentity] = useState({
    alias_name: '',
    avatar_seed: '',
  });

  useEffect(() => {
    async function loadAnon() {
      if (user) {
        const { data } = await supabase
          .from('anonymous_identities')
          .select('alias_name, avatar_seed')
          .eq('user_id', user.id)
          .single();
        if (data) setAnonIdentity(data);
      }
    }

    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        website: profile.website || '',
        twitter: profile.twitter || '',
      });
      setAvatarUrl(profile.avatar_url || null);
      setLoading(false);
      loadAnon();
    }
  }, [profile, user, supabase]);

  if (!user || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (formData.username.includes(' ')) {
      setNotification({ show: true, type: 'error', message: 'Username cannot contain spaces.' });
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        ...formData,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id);

    if (anonIdentity.alias_name) {
      await supabase
        .from('anonymous_identities')
        .upsert({
          user_id: user.id,
          alias_name: anonIdentity.alias_name,
          avatar_seed: anonIdentity.avatar_seed || 'default',
        }, { onConflict: 'user_id' });
    }

    setSaving(false);

    if (profileError) {
      setNotification({ show: true, type: 'error', message: profileError.message });
    } else {
      setNotification({ show: true, type: 'success', message: 'Network identity updated successfully.' });
      router.refresh();
      // Auto-hide success after 3 seconds
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
        <div className="flex justify-between items-start">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            notification.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {notification.type === 'success' ? <CheckCircle size={28} /> : <AlertCircle size={28} />}
          </div>
          <button 
            onClick={() => setNotification({ ...notification, show: false })}
            className="p-2 hover:bg-zinc-50 rounded-full transition-all"
          >
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-3xl font-black tracking-tighter uppercase text-zinc-900 leading-none">
            System<br/>Update
          </h3>
          <p className="text-[10px] font-black leading-relaxed uppercase tracking-[0.2em] text-zinc-400">
            Internal protocol status
          </p>
          <div className={`h-px w-10 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          <p className="text-sm text-zinc-600 font-medium leading-relaxed">
            {notification.message}
          </p>
        </div>

        <Button 
          onClick={() => setNotification({ ...notification, show: false })}
          className={`w-full font-black uppercase tracking-widest text-[10px] h-12 rounded-full border-none shadow-none ${
            notification.type === 'success' 
            ? 'bg-zinc-900 text-white hover:bg-black' 
            : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          Confirm Status
        </Button>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in">
      {modalContent}
      <div className="flex flex-col gap-2 mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-background">
            <Sparkles size={16} />
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Network Environment</p>
        </div>
        <h1 className="text-6xl font-black tracking-tighter text-foreground uppercase leading-none">Configuration</h1>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
        <form onSubmit={handleSubmit} className="space-y-12">
          
          <div className="p-10 rounded-[3rem] bg-card border border-border space-y-12">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-foreground border-b border-border pb-6 flex items-center gap-4">
              <span className="w-2 h-2 rounded-full bg-foreground" />
              Primary Profile
            </h2>

            {/* Avatar Upload */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Visual Signature</label>
              <div className="max-w-[200px]">
                <ImageUploader 
                  imageUrl={avatarUrl} 
                  onUpload={setAvatarUrl} 
                  onRemove={() => setAvatarUrl(null)} 
                  label="Update Portrait"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Full Name</label>
                <Input 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  placeholder="Your Name"
                  className="bg-muted/5 border-border focus:border-foreground h-12 rounded-xl transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground select-none font-bold">@</span>
                  <Input 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                    required
                    className="pl-10 bg-muted/5 border-border focus:border-foreground h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Operational Bio</label>
              <textarea 
                value={formData.bio} 
                onChange={e => setFormData({...formData, bio: e.target.value})} 
                rows={4}
                className="w-full px-5 py-4 bg-muted/5 border border-border rounded-2xl outline-none focus:border-foreground transition-all resize-none text-sm font-medium leading-relaxed"
                placeholder="What is your mission?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Digital Home</label>
                <Input 
                  type="url"
                  value={formData.website} 
                  onChange={e => setFormData({...formData, website: e.target.value})} 
                  placeholder="https://..."
                  className="bg-muted/5 border-border focus:border-foreground h-12 rounded-xl"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Social Feed</label>
                <Input 
                  type="url"
                  value={formData.twitter} 
                  onChange={e => setFormData({...formData, twitter: e.target.value})} 
                  placeholder="https://x.com/..."
                  className="bg-muted/5 border-border focus:border-foreground h-12 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={saving} className="rounded-full h-16 px-16 font-black uppercase tracking-[0.3em] bg-foreground text-background hover:scale-[1.02] transition-transform">
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {saving ? 'Syncing Network...' : 'Commit Changes'}
            </Button>
          </div>
        </form>

        {/* Sidebar Settings - Anon Identity */}
        <aside className="space-y-8">
          <div className="p-8 rounded-[2.5rem] bg-black text-white space-y-8 shadow-2xl">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Shadow Identity
            </h2>
            
            <p className="text-[10px] font-bold leading-relaxed text-white/40 uppercase tracking-widest">
              Set your alias for anonymous posting and private signals.
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Code Name / Alias</label>
                <input 
                  value={anonIdentity.alias_name}
                  onChange={e => setAnonIdentity({...anonIdentity, alias_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-white/40 outline-none transition-all"
                  placeholder="Ghost_Protocol"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Avatar Identity Seed</label>
                <input 
                  value={anonIdentity.avatar_seed}
                  onChange={e => setAnonIdentity({...anonIdentity, avatar_seed: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-white/40 outline-none transition-all"
                  placeholder="random_seed"
                />
              </div>

              <div className="pt-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-black text-lg">
                  {anonIdentity.alias_name ? anonIdentity.alias_name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="text-[10px] font-black text-white uppercase tracking-widest">
                  Preview <br />
                  <span className="text-white/40">{anonIdentity.alias_name || 'Not Set'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-muted/5 border border-border border-dashed">
             <h3 className="text-[10px] font-black uppercase tracking-widest mb-4">Network Preferences</h3>
             <label className="flex items-center gap-3 text-xs font-bold cursor-pointer group">
               <div className="w-5 h-5 rounded border border-border group-hover:border-foreground transition-colors flex items-center justify-center">
                 <div className="w-2 h-2 bg-foreground rounded-sm" />
               </div>
               High-Contrast Mode
             </label>
          </div>
        </aside>
      </div>
    </div>
  );
}

