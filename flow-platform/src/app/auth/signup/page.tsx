'use client';

import { useState } from 'react';
import { signup } from '@/app/auth/actions';
import { Button, Input } from '@/components/ui';
import Link from 'next/link';
import { Mail, Lock, User, AtSign, ArrowRight, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await signup(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      const isRedirect =
        err instanceof Error && err.message === 'NEXT_REDIRECT';
      if (!isRedirect) {
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-reveal">
          <h1 className="text-4xl font-serif font-black text-zinc-900 mb-3">Join FLOW</h1>
          <p className="text-zinc-500">Create your account and start publishing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  name="fullName"
                  placeholder="John Doe"
                  required
                  className="pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Username</label>
              <div className="relative">
                <AtSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  name="username"
                  placeholder="johndoe"
                  required
                  className="pl-11"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="pl-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                className="pl-11"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-xl h-12 text-base gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-8">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-zinc-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
