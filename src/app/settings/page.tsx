'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import { ImageUploader } from '@/components/editor/ImageUploader';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    
    // Simple username validation
    if (formData.username.includes(' ')) {
      alert("Username cannot contain spaces.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...formData,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      alert(error.message);
    } else {
      alert('Profile updated successfully!');
      router.refresh(); // Refresh Next cache to pull new profile info
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-20 animate-fade-in">
      <h1 className="text-4xl font-black tracking-tighter text-foreground mb-12 uppercase">Profile Settings</h1>
      
      <form onSubmit={handleSubmit} className="space-y-12 p-10 rounded-[2.5rem] bg-card border border-border">
        
        {/* Avatar Upload */}
        <div className="space-y-4">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Visual Identity</label>
          <div className="max-w-[240px]">
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
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Full Name</label>
            <Input 
              value={formData.full_name} 
              onChange={e => setFormData({...formData, full_name: e.target.value})} 
              placeholder="Your Name"
              className="bg-muted/5 border-border focus:border-foreground h-12 rounded-xl"
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Username</label>
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
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Manifesto / Bio</label>
          <textarea 
            value={formData.bio} 
            onChange={e => setFormData({...formData, bio: e.target.value})} 
            rows={5}
            className="w-full px-5 py-4 bg-muted/5 border border-border rounded-2xl outline-none focus:border-foreground transition-all resize-none text-sm font-medium leading-relaxed"
            placeholder="What drives you?"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Digital Home</label>
            <Input 
              type="url"
              value={formData.website} 
              onChange={e => setFormData({...formData, website: e.target.value})} 
              placeholder="https://"
              className="bg-muted/5 border-border focus:border-foreground h-12 rounded-xl"
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Social Feed</label>
            <Input 
              type="url"
              value={formData.twitter} 
              onChange={e => setFormData({...formData, twitter: e.target.value})} 
              placeholder="https://x.com/"
              className="bg-muted/5 border-border focus:border-foreground h-12 rounded-xl"
            />
          </div>
        </div>

        <div className="pt-8 border-t border-border">
          <Button type="submit" disabled={saving} className="rounded-full h-14 px-12 font-black uppercase tracking-[0.2em] w-full md:w-auto">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Syncing...' : 'Save Configuration'}
          </Button>
        </div>
      </form>
    </div>
  );
}

