'use client';

import { useState } from 'react';
import { login, signInWithGoogle } from '@/app/auth/actions';
import { Button, Input } from '@/components/ui';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, Globe } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await login(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      const isRedirect =
        err instanceof Error && err.message === 'NEXT_REDIRECT';
      if (!isRedirect) {
        setError('Authentication failed. Check your access keys.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-[95vh] flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <div className="text-center mb-14 animate-reveal">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground border border-border px-4 py-1.5 rounded-full mb-8 inline-block shadow-sm">
            Node Authentication
          </span>
          <h1 className="text-6xl font-black text-foreground tracking-tighter mb-4">FLOW.</h1>
          <p className="text-muted-foreground font-medium tracking-tight">Accessing the luminous network archive.</p>
        </div>

        <div className="space-y-10 animate-fade-in">
          {error && (
            <div className="p-5 rounded-2xl bg-red-50 border border-red-100 text-[11px] font-black uppercase tracking-widest text-red-600 animate-reveal">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Identity Coordinate (Email)</label>
              <Input
                name="email"
                type="email"
                placeholder="identity@network.com"
                required
                className="h-16 rounded-[1.25rem] bg-muted/5 border-border focus:border-foreground focus:ring-0 transition-all pl-6 font-medium"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between ml-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Keyword (Password)</label>
                <Link href="/auth/reset-password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all hover:underline">
                  Lost Key?
                </Link>

              </div>
              <Input
                name="password"
                type="password"
                placeholder="••••••••••••"
                required
                className="h-16 rounded-[1.25rem] bg-muted/5 border-border focus:border-foreground focus:ring-0 transition-all pl-6 font-medium"
              />
            </div>

            <Button type="submit" disabled={loading || googleLoading} className="w-full rounded-[1.25rem] h-16 text-[11px] font-black uppercase tracking-[0.3em] gap-4 mt-4 shadow-xl shadow-foreground/5 transition-all active:scale-95">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} strokeWidth={3} />}
              {loading ? 'Processing...' : 'Secure Login'}
            </Button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center px-2">
              <div className="w-full border-t border-border/60"></div>
            </div>
            <span className="relative bg-white px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              External Gateway
            </span>
          </div>

          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full rounded-[1.25rem] h-16 text-[11px] font-black uppercase tracking-[0.3em] gap-4 border-border hover:bg-black hover:text-white transition-all shadow-sm"
          >
            {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} strokeWidth={3} />}
            Sign in with Google
          </Button>

        </div>


        <p className="text-center text-sm text-zinc-500 mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-zinc-900 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
