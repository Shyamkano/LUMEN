'use client';

import { getPreferences, updatePreferences } from '@/app/actions/profiles';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui';
import { Bell, Mail, Smartphone, Globe, ArrowLeft, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function NotificationPreferencesPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [preferences, setPreferences] = useState({
    email_signals: true,
    push_signals: false,
    mentions: true,
    network_updates: true,
  });

  useEffect(() => {
    async function load() {
      if (user) {
        const data = await getPreferences();
        if (data) {
          setPreferences({
            email_signals: data.email_signals,
            push_signals: data.push_signals,
            mentions: data.mentions,
            network_updates: data.network_updates,
          });
        }
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const toggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    const result = await updatePreferences(preferences);
    setSaving(false);
    if (result.success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-20 animate-reveal">
      <div className="flex flex-col gap-8 mb-16">
        <Link href="/settings" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Bell size={28} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase">Signal Protocol</h1>
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
          Configure how you receive synchronization alerts from the LUMEN network.
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-8 rounded-[3rem] bg-white border border-border space-y-8">
           <PreferenceItem 
             icon={Mail} 
             title="Email Signals" 
             description="Receive critical archive updates via digital mail."
             active={preferences.email_signals}
             onClick={() => toggle('email_signals')}
           />
           <PreferenceItem 
             icon={Smartphone} 
             title="Mobile Pulse" 
             description="Push notifications for real-time network activity."
             active={preferences.push_signals}
             onClick={() => toggle('push_signals')}
           />
           <div className="h-px bg-border/50" />
           <PreferenceItem 
             icon={Sparkles} 
             title="Mention Echo" 
             description="Be alerted when other residents cite your narratives."
             active={preferences.mentions}
             onClick={() => toggle('mentions')}
           />
           <PreferenceItem 
             icon={Globe} 
             title="Network Broadcasts" 
             description="LUMEN system updates and protocol changes."
             active={preferences.network_updates}
             onClick={() => toggle('network_updates')}
           />
        </div>

        <div className="flex justify-between items-center pt-8">
          <div className="flex items-center gap-2">
            {saveStatus === 'success' && (
              <p className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <CheckCircle2 size={12} /> Registry Synchronized
              </p>
            )}
            {saveStatus === 'error' && (
              <p className="text-[10px] font-black uppercase text-red-500 flex items-center gap-2 animate-in shake">
                <AlertCircle size={12} /> Sync Error
              </p>
            )}
          </div>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="rounded-full h-14 px-12 font-black uppercase tracking-widest text-[10px] bg-black text-white hover:scale-105 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {saving ? 'Syncing...' : 'Lock Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PreferenceItem({ icon: Icon, title, description, active, onClick }: any) {
  return (
    <div className="flex items-center justify-between group cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${active ? 'bg-zinc-900 text-white' : 'bg-muted/10 text-muted-foreground'}`}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight text-foreground">{title}</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{description}</p>
        </div>
      </div>
      <div className={`w-12 h-6 rounded-full transition-all relative ${active ? 'bg-black' : 'bg-zinc-200'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? 'left-7' : 'left-1'}`} />
      </div>
    </div>
  );
}
