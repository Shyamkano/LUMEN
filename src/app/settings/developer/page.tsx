'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Key, Copy, CheckCircle, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DeveloperSettingsPage() {
  const { user, loading } = useAuth();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [fetchingKeys, setFetchingKeys] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    setFetchingKeys(true);
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApiKeys(data);
    }
    setFetchingKeys(false);
  };

  const generateNewKey = async () => {
    if (!user) return;
    setGenerating(true);
    
    // Simple secure random key generator
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const newKey = 'lm_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

    const { error } = await supabase.from('api_keys').insert({
      user_id: user.id,
      name: `API Key ${apiKeys.length + 1}`,
      key: newKey,
    });

    if (!error) {
      await fetchApiKeys();
    }
    setGenerating(false);
  };

  const deleteKey = async (id: string) => {
    await supabase.from('api_keys').delete().eq('id', id);
    fetchApiKeys();
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading || fetchingKeys) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 md:py-20 animate-reveal">
      <Link href="/settings" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12">
        <ArrowLeft size={16} /> Back to Hub
      </Link>

      <div className="flex flex-col gap-3 md:gap-4 mb-12 md:mb-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Key size={12} />
          </div>
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Developer Protocol</p>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase leading-none">API Access</h1>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight mt-2 max-w-2xl">
          Generate API keys to authenticate external integrations like your personal portfolio. Do not share these keys.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center pb-6 border-b border-border">
          <h2 className="text-xl font-black uppercase tracking-tight">Active Keys</h2>
          <Button 
            onClick={generateNewKey} 
            disabled={generating}
            className="rounded-full h-10 px-5 text-[10px] font-black uppercase tracking-widest gap-2 bg-foreground text-background hover:scale-105 transition-transform"
          >
            {generating ? <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" /> : <><Plus size={14} /> Generate Key</>}
          </Button>
        </div>

        {apiKeys.length === 0 ? (
          <div className="p-10 rounded-3xl border border-dashed border-border bg-muted/5 flex flex-col items-center justify-center text-center space-y-4">
             <Key size={40} className="text-muted-foreground/30" />
             <div>
               <p className="font-black uppercase text-foreground">No active keys</p>
               <p className="text-xs text-muted-foreground font-medium mt-1">Generate your first API key to start integrating.</p>
             </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-6 rounded-2xl border border-border bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <h3 className="font-black uppercase text-sm">{apiKey.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs font-mono bg-zinc-100 px-3 py-1 rounded text-zinc-600">
                      {apiKey.key.substring(0, 10)}••••••••••••••••••••
                    </code>
                    <button 
                      onClick={() => copyToClipboard(apiKey.key)}
                      className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 transition-colors"
                      title="Copy full key"
                    >
                      {copiedKey === apiKey.key ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                  {apiKey.last_used_at && (
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-3 font-bold">
                      Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <button 
                  onClick={() => deleteKey(apiKey.id)}
                  className="w-full sm:w-auto p-3 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors flex items-center justify-center gap-2 group"
                >
                  <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest sm:hidden">Revoke Key</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-16 p-6 rounded-[2rem] bg-zinc-900 text-zinc-400 border border-zinc-800 space-y-4 text-xs font-mono leading-relaxed overflow-x-auto">
        <p className="text-white font-sans text-sm font-black uppercase tracking-wider">Example Usage</p>
        <pre>
{`const fetchBlogs = async () => {
  const response = await fetch('https://your-lumen.com/api/external/posts/your_username', {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });
  const data = await response.json();
  console.log(data);
};`}
        </pre>
      </div>
    </div>
  );
}
