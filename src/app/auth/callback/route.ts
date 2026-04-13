import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error_desc = requestUrl.searchParams.get('error_description');
  const error_code = requestUrl.searchParams.get('error_code');
  const nextParam = requestUrl.searchParams.get('next') ?? '/feed';
  // Security: Prevent open redirects by ensuring the path is internal
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/feed';
  const origin = requestUrl.origin;


  if (error_desc) {
    return NextResponse.redirect(`${origin}/auth/reset-password?error=${encodeURIComponent(error_desc)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/auth/reset-password?error=${encodeURIComponent(error.message)}`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);


}
