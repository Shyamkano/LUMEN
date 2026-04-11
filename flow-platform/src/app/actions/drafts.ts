'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PostType } from '@/types';

export async function saveDraft(data: {
  id?: string;
  title: string | null;
  content: Record<string, unknown> | null;
  type: PostType;
  code_snippets?: { code: string; language: string; title?: string }[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (data.id) {
    // Update existing draft
    const { error } = await supabase
      .from('drafts')
      .update({
        title: data.title,
        content: data.content,
        type: data.type,
        code_snippets: data.code_snippets || [],
        last_saved_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/dashboard');
    return { success: true, draftId: data.id };
  } else {
    // Create new draft
    const { data: draft, error } = await supabase
      .from('drafts')
      .insert([{
        user_id: user.id,
        title: data.title,
        content: data.content,
        type: data.type,
        code_snippets: data.code_snippets || [],
      }])
      .select('id')
      .single();

    if (error || !draft) return { error: error?.message || 'Failed to save draft' };
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
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('drafts')
    .delete()
    .eq('id', draftId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}
