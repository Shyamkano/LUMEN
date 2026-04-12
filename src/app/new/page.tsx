'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { PreviewPanel } from '@/components/editor/PreviewPanel';
import { AIAssistant } from '@/components/editor/AIAssistant';
import { AudioUploader } from '@/components/editor/AudioUploader';
import { ImageUploader } from '@/components/editor/ImageUploader';
import { DraftManager } from '@/components/editor/DraftManager';
import { Button } from '@/components/ui';
import { createPost, getPostById, updatePost } from '@/app/actions/posts';
import { saveDraft, getDraft, deleteDraft } from '@/app/actions/drafts';
import { postSchema, type PostFormValues } from '@/lib/validations/post';
import slugify from 'slugify';
import {
  Eye, EyeOff, PanelRightOpen, Save,
  FileText, Zap, Code, Mic, Ghost,
  Send, ChevronDown, Loader2, X,
} from 'lucide-react';

import type { PostType, Draft } from '@/types';

const POST_TYPE_CONFIG = {
  blog: { icon: FileText, label: 'Blog Post', description: 'Long-form article', color: 'from-emerald-500 to-teal-500' },
  micro: { icon: Zap, label: 'Micro Post', description: 'Quick thought (≤500 chars)', color: 'from-violet-500 to-purple-500' },
  code: { icon: Code, label: 'Code Post', description: 'Code + explanation', color: 'from-orange-500 to-amber-500' },
  audio: { icon: Mic, label: 'Audio Post', description: 'Audio + transcript', color: 'from-sky-500 to-blue-500' },
};

type ViewMode = 'edit' | 'preview' | 'split';

export default function NewPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as PostType) || 'blog';

  const [postType, setPostType] = useState<PostType>(initialType);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [codeSnippets, setCodeSnippets] = useState<{ code: string; language: string; title: string }[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [existingPostId, setExistingPostId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [shadowIdentity, setShadowIdentity] = useState<any>(null);

  // Fetch Author Identity
  useEffect(() => {
    async function fetchIdentity() {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const { data: anon } = await supabase.from('anonymous_identities').select('*').eq('user_id', user.id).single();
        setAuthorProfile(profile);
        setShadowIdentity(anon);
      }
    }
    fetchIdentity();
  }, []);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register, handleSubmit, control, setValue, watch,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: null,
      type: initialType,
      is_anonymous: false,
      status: 'published',
    },
  });

  // Load existing post or draft if ID provided in URL (ONCE only)
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true; // Set IMMEDIATELY to prevent race conditions
    
    const draftIdFromUrl = searchParams.get('draftId');
    const postIdFromUrl = searchParams.get('postId');

    async function loadInitial() {
      if (draftIdFromUrl) {
        const draft = await getDraft(draftIdFromUrl);
        if (draft) {
          loadDraft(draft);
        }
      } else if (postIdFromUrl) {
        const post = await getPostById(postIdFromUrl);
        if (post) {
          setValue('title', post.title);
          setValue('content', post.content);
          setPostType(post.type as PostType);
          setIsAnonymous(post.is_anonymous);
          setCoverImage(post.cover_image);
          setExistingPostId(post.id);
          setIsEditingExisting(true);
          if (post.tags) {
            setTags(post.tags);
          }
          if (post.code_snippets) {
            setCodeSnippets(post.code_snippets);
          }
        }
      }
    }
    loadInitial();
  }, [searchParams]);

  const title = watch('title');
  const content = watch('content');

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!title && !content) return;

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      const result = await saveDraft({
        id: draftId || undefined,
        title: title || null,
        content: content as Record<string, unknown>,
        type: postType,
        code_snippets: codeSnippets,
      });
      if (result.draftId && !draftId) {
        setDraftId(result.draftId);
      }
      setLastSaved(new Date().toLocaleTimeString());
    }, 30000);

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [title, content, postType, codeSnippets, draftId]);

  const handleSaveDraft = async () => {
    const result = await saveDraft({
      id: draftId || undefined,
      title: title || null,
      content: content as Record<string, unknown>,
      type: postType,
      code_snippets: codeSnippets,
    });
    if (result.draftId) {
      setDraftId(result.draftId);
      setLastSaved(new Date().toLocaleTimeString());
    }
  };

  const loadDraft = (draft: Draft) => {
    setValue('title', draft.title || '');
    setValue('content', draft.content);
    setPostType(draft.type);
    setDraftId(draft.id);
    if (draft.code_snippets && Array.isArray(draft.code_snippets)) {
      setCodeSnippets(draft.code_snippets as { code: string; language: string; title: string }[]);
    }
  };

  async function onSubmit(data: PostFormValues) {
    setLoading(true);
    setServerError(null);

    try {
      if (isEditingExisting && existingPostId) {
        // Update existing
        const result = await updatePost(existingPostId, {
          title: data.title || undefined,
          content: data.content as Record<string, unknown>,
          status: 'published',
          tags,
          cover_image: coverImage,
          code_snippets: codeSnippets,
        });
        
        if (result?.error) {
          setServerError(result.error);
          setLoading(false);
        } else {
          // Clear local cache for all types
          ['blog', 'micro', 'code', 'audio'].forEach(t => localStorage.removeItem(`flow-draft-${t}`));
          
          router.push(`/post/${result.slug}`);
        }


      } else {
        // Create new
        const result = await createPost({
          title: data.title,
          content: data.content as Record<string, unknown>,
          type: postType,
          is_anonymous: isAnonymous,
          status: 'published',
          tags,
          audio_url: audioUrl,
          cover_image: coverImage,
          code_snippets: codeSnippets,
        });


        if (result?.error) {
          setServerError(result.error);
          setLoading(false);
        } else {
          // If it was a draft, delete it after successful publish
          if (draftId) {
            await deleteDraft(draftId);
          }
          
          // Clear writing boxes
          setValue('title', '');
          setValue('content', null);
          setCodeSnippets([]);
          setAudioUrl(null);
          setCoverImage(null);
          setDraftId(null);

          // Clear local cache for all types
          ['blog', 'micro', 'code', 'audio'].forEach(t => localStorage.removeItem(`flow-draft-${t}`));

          router.push(`/post/${result.slug}`);
        }


      }
    } catch (err) {
      const isRedirect =
        err instanceof Error && err.message === 'NEXT_REDIRECT';
      if (!isRedirect) {
        setServerError('An error occurred. Please try again.');
        setLoading(false);
      }
    }
  }

  // Micro post uses plain text, not TipTap
  const isMicro = postType === 'micro';

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 animate-fade-in bg-background">
      {/* Top bar - Hardened Visibility & Layout Sync */}
      <div className="flex items-center justify-between mb-16 sticky top-20 bg-background/95 backdrop-blur-md z-30 pt-6 pb-6 border-b border-border/10">
        <div className="flex items-center gap-6">
          <Link href="/feed" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            ← Back
          </Link>

          {/* Identity Signal */}
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border">
            <div className={`w-2 h-2 rounded-full ${isAnonymous ? 'bg-black animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Tracing: <span className="text-foreground">
                {isAnonymous 
                  ? (shadowIdentity?.alias_name || 'Incognito') 
                  : (authorProfile?.full_name || authorProfile?.username || 'Resident')}
              </span>
            </span>
          </div>

          {/* Type selector */}
          <div className="relative">
            <button
              onClick={() => setShowTypeSelector(!showTypeSelector)}
              type="button"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                showTypeSelector ? 'border-foreground bg-foreground text-background shadow-sm' : 'border-border hover:border-foreground text-foreground'
              }`}
            >
              {(() => { const Icon = POST_TYPE_CONFIG[postType].icon; return <Icon size={16} />; })()}
              {POST_TYPE_CONFIG[postType].label}
              <ChevronDown size={14} className={`transition-transform ${showTypeSelector ? 'rotate-180' : ''}`} />
            </button>

            {showTypeSelector && (
              <div className="absolute top-12 left-0 w-64 bg-background rounded-2xl shadow-2xl border border-border py-2 z-50 animate-scale-in">
                {(Object.entries(POST_TYPE_CONFIG) as [PostType, typeof POST_TYPE_CONFIG.blog][]).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => { setPostType(type); setShowTypeSelector(false); setValue('type', type); }}
                      type="button"
                      className={`flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/5 transition-colors ${
                        postType === type ? 'bg-muted/10' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Draft management */}
          <DraftManager onLoadDraft={loadDraft} />

          {/* Save draft */}
          <button onClick={handleSaveDraft} type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Save size={14} />
            {lastSaved ? `Saved ${lastSaved}` : 'Save Draft'}
          </button>

          {/* Anonymous toggle */}
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              isAnonymous
                ? 'bg-foreground text-background border-foreground'
                : 'text-muted-foreground border-border hover:border-muted-foreground'
            }`}
          >
            <Ghost size={14} />
            {isAnonymous ? 'Anonymous' : 'Public'}
          </button>

          {/* View mode toggles */}
          {!isMicro && (
            <div className="flex items-center border border-border rounded-full p-1 bg-muted/5">
              {(['edit', 'preview', 'split'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  type="button"
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    viewMode === mode 
                      ? 'bg-foreground text-background shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Publish */}
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="rounded-full px-8 gap-2 font-bold"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? 'Publishing...' : (isEditingExisting ? 'Save Changes' : 'Publish')}
          </Button>
        </div>
      </div>

      {/* Error */}
      {serverError && (
        <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm animate-fade-in">
          {serverError}
        </div>
      )}

      {/* Main editor area */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={`${viewMode === 'split' && !isMicro ? 'grid grid-cols-2 gap-12' : 'max-w-3xl mx-auto'}`}>
          {/* Editor side */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className="space-y-10">
              {/* Cover Image */}
              <ImageUploader 
                imageUrl={coverImage} 
                onUpload={setCoverImage} 
                onRemove={() => setCoverImage(null)} 
                label={isMicro ? "Add Image" : "Add Cover"}
              />

              {/* Title */}
              <div className="space-y-2">
                <input
                  {...register('title')}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder={isMicro ? "Optional title..." : "Post Title"}
                  className="w-full text-3xl md:text-4xl font-black placeholder:text-muted-foreground/20 outline-none border-none bg-transparent tracking-tight text-foreground"
                />
                
                {/* Tags Input */}
                <div className="flex flex-wrap items-center gap-2 pt-4">
                  {tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted/5 border border-border text-[10px] font-black uppercase tracking-widest text-foreground animate-reveal"
                    >
                      #{tag}
                      <button 
                        type="button" 
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value.replace(/\s/g, '-'))}
                    onKeyDown={handleAddTag}
                    placeholder="Add keywords... (Enter)"
                    className="text-[10px] font-black uppercase tracking-widest text-foreground placeholder:text-muted-foreground/40 outline-none bg-transparent min-w-[150px]"
                  />
                </div>
                
                {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>}
              </div>


              {/* Content editor */}
              {isMicro ? (
                <div className="space-y-3">
                  <Controller
                    control={control}
                    name="content"
                    render={({ field }) => (
                      <textarea
                        value={
                          typeof field.value === 'string' 
                            ? field.value 
                            : field.value?.type === 'doc' 
                              ? (field.value.content?.[0]?.content?.[0]?.text || '') 
                              : ''
                        }
                        onChange={(e) => field.onChange({
                          type: 'doc',
                          content: [{ type: 'paragraph', content: [{ type: 'text', text: e.target.value }] }],
                        })}
                        placeholder="What's happening?"
                        maxLength={500}
                        rows={8}
                        className="w-full p-6 text-xl rounded-3xl border border-border outline-none focus:border-foreground transition-colors resize-none bg-card text-foreground font-body leading-relaxed"
                      />
                    )}
                  />
                  <div className="flex justify-end pr-2">
                    <span className="text-xs font-mono text-muted-foreground bg-muted/10 px-2 py-1 rounded-md">
                      {(typeof content === 'string' 
                        ? content.length 
                        : content?.type === 'doc' 
                          ? (content.content?.[0]?.content?.[0]?.text?.length || 0) 
                          : 0)}/500
                    </span>
                  </div>
                </div>
              ) : (
                <div className="min-h-[500px]">
                  <Controller
                    control={control}
                    name="content"
                    render={({ field }) => (
                      <TipTapEditor
                        content={field.value as Record<string, unknown> | undefined}
                        onChange={field.onChange}
                        placeholder="Write something brilliant..."
                        autoSaveKey={postType}
                      />
                    )}
                  />
                </div>
              )}
              {errors.content && <p className="text-xs text-red-500 font-medium">Please add some content to your post.</p>}

              {/* Code snippets section */}
              {postType === 'code' && (
                <div className="mt-12 pt-12 border-t border-border">
                  <h3 className="text-lg font-bold mb-6">Code Snippets</h3>
                  <CodeEditor snippets={codeSnippets} onChange={setCodeSnippets} />
                </div>
              )}

              {/* Audio uploader */}
              {postType === 'audio' && (
                <div className="mt-12 pt-12 border-t border-border">
                  <h3 className="text-lg font-bold mb-6">Audio File</h3>
                  <AudioUploader
                    audioUrl={audioUrl}
                    onUpload={(url) => {
                      setAudioUrl(url);
                      setValue('audio_url', url);
                    }}
                    onRemove={() => {
                      setAudioUrl(null);
                      setValue('audio_url', null);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Preview side */}
          {(viewMode === 'preview' || viewMode === 'split') && !isMicro && (
            <div className={`${viewMode === 'preview' ? 'max-w-3xl mx-auto' : ''} animate-reveal`}>
              <div className="sticky top-24">
                <div className="flex items-center gap-2 mb-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Eye size={14} />
                  Live Preview
                </div>
                <PreviewPanel
                  title={title || ''}
                  content={content as Record<string, unknown>}
                  type={postType}
                  codeSnippets={codeSnippets}
                />
              </div>
            </div>
          )}
        </div>
      </form>

      {/* AI Assistant */}
      {!isMicro && (
        <AIAssistant
          title={title || ''}
          content={content as Record<string, unknown>}
          onInsertTitle={(t) => setValue('title', t)}
          onAddTag={(t) => {
            if (!tags.includes(t)) {
              setTags(prev => [...prev, t].slice(0, 10)); // Limit to 10 tags
            }
          }}
        />
      )}
    </div>

  );
}
