'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import { ImageUploader } from '@/components/editor/ImageUploader';
import { Loader2, Save, X, CheckCircle, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Link from 'next/link';

export default function ProfileSettingsPage() {
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

  useEffect(() => {
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
    }
  }, [profile]);

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

    setSaving(false);

    if (profileError) {
      setNotification({ show: true, type: 'error', message: profileError.message });
    } else {
      setNotification({ show: true, type: 'success', message: 'Profile updated successfully.' });
      router.refresh();
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
            Update<br/>Success
          </h3>
          <p className="text-[10px] font-black leading-relaxed uppercase tracking-[0.2em] text-zinc-400">
            Registry Synchronization
          </p>
          <p className="text-sm text-zinc-600 font-medium leading-relaxed">
            {notification.message}
          </p>
        </div>

        <Button 
          onClick={() => setNotification({ ...notification, show: false })}
          className="w-full font-black uppercase tracking-widest text-[10px] h-12 rounded-full bg-black text-white"
        >
          Acknowledge
        </Button>
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
        <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase">Registry Identity</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="p-10 rounded-[3rem] bg-card border border-border space-y-10">
          {/* Avatar */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Visual Signature</label>
            <div className="max-w-[160px]">
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
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Display Name</label>
              <Input 
                value={formData.full_name} 
                onChange={e => setFormData({...formData, full_name: e.target.value})} 
                placeholder="Full Name"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Coordinate (@username)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">@</span>
                <Input 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  required
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Professional Bio</label>
            <textarea 
              value={formData.bio} 
              onChange={e => setFormData({...formData, bio: e.target.value})} 
              rows={4}
              className="w-full px-5 py-4 bg-muted/5 border border-border rounded-2xl outline-none focus:border-foreground transition-all resize-none text-sm font-medium leading-relaxed"
              placeholder="Tell your story..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Web Protocol (Website)</label>
              <Input 
                type="url"
                value={formData.website} 
                onChange={e => setFormData({...formData, website: e.target.value})} 
                placeholder="https://..."
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">X/Twitter Log</label>
              <Input 
                type="url"
                value={formData.twitter} 
                onChange={e => setFormData({...formData, twitter: e.target.value})} 
                placeholder="https://x.com/..."
                className="h-12 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="rounded-full h-14 px-12 font-black uppercase tracking-widest text-[10px] bg-black text-white hover:scale-105 transition-all">
            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
            Sync Registry
          </Button>
        </div>
      </form>
    </div>
  );
}
