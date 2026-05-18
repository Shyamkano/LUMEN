import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> | { username: string; slug: string } }
) {
  try {
    const supabase = await createClient();
    
    // Await params for Next.js 15+ compatibility
    const resolvedParams = await params;
    const { username, slug } = resolvedParams;

    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '') || request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized. API key is missing. Provide it via Authorization: Bearer <key> or x-api-key header.' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!username || !slug) {
      return NextResponse.json(
        { error: 'Username and slug are required' },
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

    // Verify the API key belongs to this user
    const { data: validKey, error: keyError } = await supabase
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

    // Update last_used_at in the background
    supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', validKey.id).then();

    // Now fetch the specific published post by slug for this user
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, title, content, type, slug, cover_image, tags, read_time, views, created_at')
      .eq('author_id', profile.id)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Generate HTML from the TipTap JSON content
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
        console.error('Error generating HTML:', e);
      }
    }

    return NextResponse.json(
      {
        post: {
          ...post,
          html, // Include the rendered HTML
        },
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
