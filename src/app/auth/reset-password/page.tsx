'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, ArrowRight, Loader2, CheckCircle, Hash } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(searchParams.get('error'));
  const [step, setStep] = useState<'request' | 'verify'>('request');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setStep('verify');
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/auth/update-password');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-12 animate-reveal">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground border border-border px-4 py-1.5 rounded-full mb-8 inline-block shadow-sm">
            Security Protocol
          </span>
          <h1 className="text-5xl font-black text-foreground tracking-tighter mb-4">RESET.</h1>
          <p className="text-muted-foreground font-medium tracking-tight">
            {step === 'request' ? "Requesting a new access coordinate." : "Verify your identity code."}
          </p>
        </div>

        <div className="space-y-8 animate-fade-in">
          {error && (
            <div className="p-5 rounded-2xl bg-red-50 border border-red-100 text-[11px] font-black uppercase tracking-widest text-red-600 animate-reveal">
              {error}
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestOTP} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Identity Coordinate (Email)</label>
                <Input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="identity@network.com"
                  required
                  className="h-16 rounded-[1.25rem] bg-muted/5 border-border focus:border-foreground focus:ring-0 transition-all pl-6 font-medium"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full rounded-[1.25rem] h-16 text-[11px] font-black uppercase tracking-[0.3em] gap-4 shadow-xl shadow-foreground/5 transition-all active:scale-95">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} strokeWidth={3} />}
                {loading ? 'Dispatching...' : 'Request Access Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">8-Digit Access Token</label>
                <div className="relative">
                  <Hash size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    name="token"
                    type="text"
                    maxLength={8}
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="00000000"
                    required
                    className="h-16 rounded-[1.25rem] bg-muted/5 border-border focus:border-foreground focus:ring-0 transition-all pl-14 tracking-[0.5em] font-black text-xl"
                  />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground text-center">Enter the code sent to {email}</p>
              </div>

              <Button type="submit" disabled={loading} className="w-full rounded-[1.25rem] h-16 text-[11px] font-black uppercase tracking-[0.3em] gap-4 shadow-xl shadow-foreground/5 transition-all active:scale-95">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} strokeWidth={3} />}
                {loading ? 'Verifying...' : 'Establish Session'}
              </Button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
              >
                Resend Identity Request
              </button>
            </form>
          )}

          <div className="text-center pt-4">
            <Link href="/auth/login" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
              Abort and Return
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={40} className="animate-spin text-muted-foreground" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
