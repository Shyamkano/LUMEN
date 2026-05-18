import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allows requests from any origin (e.g., your portfolio)
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> | { username: string } }
) {
  try {
    const supabase = await createClient();
    
    // In Next.js 15, params is often a Promise, so we await it just in case
    const resolvedParams = await params;
    const username = resolvedParams.username;

    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '') || request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized. API key is missing. Provide it via Authorization: Bearer <key> or x-api-key header.' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // First get the user profile to get their ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, bio')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify the API key belongs to this user using service role to bypass RLS
    const serviceSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: validKey, error: keyError } = await serviceSupabase
      .from('api_keys')
      .select('id')
      .eq('key', apiKey)
      .eq('user_id', profile.id)
      .single();

    if (keyError || !validKey) {
      return NextResponse.json(
        { error: 'Forbidden. Invalid API key for this user.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Update last_used_at in the background (we don't await this to keep the API fast)
    supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', validKey.id).then();

    // Now fetch the published posts for this user
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, content, type, slug, cover_image, tags, read_time, views, created_at')
      .eq('author_id', profile.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (postsError) {
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Add rendered HTML to each post
    const postsWithHtml = posts.map((post) => {
      let html = '';
      if (post.content && typeof post.content === 'object') {
        try {
          html = generateHTML(post.content, [
            StarterKit,
            LinkExt,
            Underline,
            CodeBlockLowlight.configure({ lowlight }),
          ]);
        } catch (e) {
          console.error('Error generating HTML for post:', post.id, e);
        }
      }
      return {
        ...post,
        html,
      };
    });

    return NextResponse.json(
      {
        profile: profile,
        posts: postsWithHtml,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}
