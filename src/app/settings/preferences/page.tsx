'use client';

import { getPreferences, updatePreferences } from '@/app/actions/profiles';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui';
import { Layers, Monitor, Eye, EyeOff, ArrowLeft, Loader2, Palette, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PreferencesPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [prefs, setPrefs] = useState({
    high_contrast: true,
    motion_reduction: false,
    archive_density: 'Standard',
  });

  useEffect(() => {
    async function load() {
      if (user) {
        const data = await getPreferences();
        if (data) {
          setPrefs({
            high_contrast: data.high_contrast,
            motion_reduction: data.motion_reduction,
            archive_density: data.archive_density || 'Standard',
          });
        }
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleUpdate = async () => {
    setSaving(true);
    setSaveStatus('idle');
    const result = await updatePreferences(prefs);
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers size={28} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase">Network Presence</h1>
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
          Tune the aesthetic parameters of your LUMEN archive interface.
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-8 rounded-[3rem] bg-white border border-border space-y-10">
           
           <div className="space-y-6">
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border pb-4">Visual Rendering</h2>
             
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Monitor size={20} className="text-zinc-600" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">Identity Contrast</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Enforce maximum black/white levels.</p>
                  </div>
                </div>
                <div className="w-12 h-6 rounded-full bg-black relative">
                  <div className="absolute top-1 left-7 w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
             </div>

             <div className="flex items-center justify-between opacity-40 grayscale cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <Palette size={20} className="text-zinc-600" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">Chromatic Shift (Themes)</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Locked to Monochrome for this district.</p>
                  </div>
                </div>
                <div className="w-12 h-6 rounded-full bg-zinc-100 relative">
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
             </div>
           </div>

           <div className="space-y-6 pt-4">
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border pb-4">Accessibility Protocols</h2>
             
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <EyeOff size={20} className="text-zinc-600" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">Motion Suppression</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Minimize interface fluid dynamics.</p>
                  </div>
                </div>
                <div className="w-12 h-6 rounded-full bg-zinc-100 relative cursor-pointer" onClick={() => setPrefs({...prefs, motion_reduction: !prefs.motion_reduction})}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${prefs.motion_reduction ? 'left-7 bg-zinc-900' : 'left-1'}`} />
                </div>
             </div>
           </div>
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
            onClick={handleUpdate}
            disabled={saving}
            className="rounded-full h-14 px-12 font-black uppercase tracking-widest text-[10px] bg-black text-white hover:scale-105 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {saving ? 'Processing...' : 'Update Environment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
