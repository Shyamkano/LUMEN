import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  // Access Control: Banned Users
  if (user && !request.nextUrl.pathname.startsWith('/banned')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_banned')
      .eq('id', user.id)
      .single();

    if (profile?.is_banned) {
      return NextResponse.redirect(new URL('/banned', request.url));
    }
  }

  // Prevent banned page access for healthy identities
  if (request.nextUrl.pathname.startsWith('/banned')) {
    if (!user) return NextResponse.redirect(new URL('/', request.url));
    const { data: profile } = await supabase.from('profiles').select('is_banned').eq('id', user.id).single();
    if (!profile?.is_banned) return NextResponse.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}
