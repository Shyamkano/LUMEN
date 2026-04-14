'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PostType } from '@/types';

/**
 * Normalizes content before saving to ensure image nodes have proper src attributes
 * Converts Server Component references to plain objects first
 */
function normalizeContentForStorage(content: any): any {
  if (!content || typeof content !== 'object') return content;
  
  // Convert Server Component reference to plain object
  const plainContent = JSON.parse(JSON.stringify(content));
  
  console.log('[normalizeContentForStorage] Processing node:', { type: plainContent.type, hasAttrs: !!plainContent.attrs });
  
  // Normalize image nodes
  if (plainContent.type === 'lumenImage' && plainContent.attrs) {
    const imageUrl = plainContent.attrs.src || plainContent.attrs.url;
    if (imageUrl) {
      plainContent.attrs.src = imageUrl;
      plainContent.attrs.url = imageUrl;
      console.log('[normalizeContentForStorage] ✓ Image node preserved:', { src: plainContent.attrs.src, url: plainContent.attrs.url });
    } else {
      console.warn('[normalizeContentForStorage] ⚠️ Image node missing URL:', plainContent.attrs);
    }
  }
  
  // Recursively process nested content
  if (plainContent.content && Array.isArray(plainContent.content)) {
    console.log('[normalizeContentForStorage] Processing', plainContent.content.length, 'child nodes');
    plainContent.content = plainContent.content.map((child: any) => normalizeContentForStorage(child));
  }
  
  return plainContent;
}

export async function saveDraft(data: {
  id?: string;
  title: string | null;
  content: Record<string, unknown> | null;
  type: PostType;
  code_snippets?: { code: string; language: string; title?: string }[];
  parent_id?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const normalizedContent = normalizeContentForStorage(data.content);
  console.log('[saveDraft] Received content:', JSON.stringify(data.content, null, 2));
  console.log('[saveDraft] Normalized content:', JSON.stringify(normalizedContent, null, 2));

  if (data.id) {
    // Update existing draft
    const { error } = await supabase
      .from('drafts')
      .update({
        title: data.title,
        content: normalizedContent,
        type: data.type,
        code_snippets: data.code_snippets || [],
        parent_id: data.parent_id,
        last_saved_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[saveDraft] Update error:', error);
      return { error: error.message };
    }
    console.log('[saveDraft] Draft updated successfully');
    revalidatePath('/dashboard');
    return { success: true, draftId: data.id };
  } else {
    // Create new draft
    const { data: draft, error } = await supabase
      .from('drafts')
      .insert([{
        user_id: user.id,
        title: data.title,
        content: normalizedContent,
        type: data.type,
        code_snippets: data.code_snippets || [],
        parent_id: data.parent_id,
      }])
      .select('id')
      .single();

    if (error || !draft) {
      console.error('[saveDraft] Create error:', error);
      return { error: error?.message || 'Failed to save draft' };
    }
    console.log('[saveDraft] Draft created successfully');
    revalidatePath('/dashboard');
    return { success: true, draftId: draft.id };
  }
}

export async function getDrafts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: drafts } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', user.id)
    .order('last_saved_at', { ascending: false });

  return drafts || [];
}

export async function getDraft(draftId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: draft } = await supabase
    .from('drafts')
    .select('*')
    .eq('id', draftId)
    .eq('user_id', user.id)
    .single();

  return draft;
}

export async function deleteDraft(draftId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Access Denied: Draft cannot be removed without authentication.' };

  const { error } = await supabase
    .from('drafts')
    .delete()
    .match({ id: draftId, user_id: user.id });

  if (error) {
    console.error('Delete error (draft):', error);
    return { error: `Draft Removal Failed: ${error.message}` };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
