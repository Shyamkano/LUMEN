'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError('Secure session not detected. Please initiate reset from your email link.');
      }
    };
    checkSession();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/auth/login?updated=true');
    }
  };

  return (
    <div className="min-h-[95vh] flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <div className="text-center mb-14 animate-reveal">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground border border-border px-4 py-1.5 rounded-full mb-8 inline-block shadow-sm">
            Node Recalibration
          </span>
          <h1 className="text-6xl font-black text-foreground tracking-tighter mb-4">REKEY.</h1>
          <p className="text-muted-foreground font-medium tracking-tight">Establishing new access credentials for your node.</p>
        </div>

        <div className="space-y-10 animate-fade-in">
          {error && (
            <div className="p-5 rounded-2xl bg-red-50 border border-red-100 text-[11px] font-black uppercase tracking-widest text-red-600 animate-reveal">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">New Access Keyword (Password)</label>
              <div className="relative">
                <Input
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="h-16 rounded-[1.25rem] bg-muted/5 border-border focus:border-foreground focus:ring-0 transition-all pl-6 font-medium"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full rounded-[1.25rem] h-16 text-[11px] font-black uppercase tracking-[0.3em] gap-4 shadow-xl shadow-foreground/5 transition-all active:scale-95">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} strokeWidth={3} />}
              {loading ? 'Propagating...' : 'Update Credentials'}
            </Button>
          </form>

          <div className="text-center">
            <Link href="/auth/login" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
              Abort and Return
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

