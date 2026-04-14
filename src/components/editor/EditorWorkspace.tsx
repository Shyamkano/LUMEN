'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { mergeAttributes } from '@tiptap/core';
import { useForm, Controller } from 'react-hook-form';
import suggestion from '@/lib/editor/suggestion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Transition heavy components to static within the dynamic workspace
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { PreviewPanel } from '@/components/editor/PreviewPanel';
import { AIAssistant } from '@/components/editor/AIAssistant';
import { AudioUploader } from '@/components/editor/AudioUploader';
import { ImageUploader } from '@/components/editor/ImageUploader';
import { DraftManager } from '@/components/editor/DraftManager';
import { PersistentImage } from '@/lib/editor/persistent-image';

import { Button } from '@/components/ui';
import { createPost, getPostById, updatePost } from '@/app/actions/posts';
import { saveDraft, getDraft, deleteDraft } from '@/app/actions/drafts';
import { postSchema, type PostFormValues } from '@/lib/validations/post';
import {
  Eye, FileText, Zap, Code, Mic, Ghost,
  Send, ChevronDown, Loader2, X, Save, Lock, Unlock
} from 'lucide-react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExt from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Paragraph from '@tiptap/extension-paragraph';
import { common, createLowlight } from 'lowlight';
import Mention from '@tiptap/extension-mention';
import { searchUsers } from '@/app/actions/profiles';

import type { PostType, Draft } from '@/types';

const POST_TYPE_CONFIG = {
  blog: { icon: FileText, label: 'Blog Post', description: 'Long-form article', color: 'from-emerald-500 to-teal-500' },
  micro: { icon: Zap, label: 'Micro Post', description: 'Quick thought (≤500 chars)', color: 'from-violet-500 to-purple-500' },
  code: { icon: Code, label: 'Code Post', description: 'Code + explanation', color: 'from-orange-500 to-amber-500' },
  audio: { icon: Mic, label: 'Audio Post', description: 'Audio + transcript', color: 'from-sky-500 to-blue-500' },
};

type ViewMode = 'edit' | 'preview' | 'split';

const CustomMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-id'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.id) return {};
          return { 'data-id': attributes.id };
        },
      },
      label: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-label'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.label) return {};
          return { 'data-label': attributes.label };
        },
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const label = node.attrs.label;
    const text = (!label || label === 'null') ? '@Resident' : `@${label}`;
    const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: 'mention-tag',
    });
    return ['span', attrs, text];
  },
});

const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      class: { default: null },
    };
  },
});

function fixContentNodes(content: any) {
  if (!content || typeof content !== 'object') return content;
  
  // Bridge old image nodes to lumenImage
  if (content.type === 'image') {
    content.type = 'lumenImage';
  }

  if (content.type === 'lumenImage' && content.attrs) {
    content.attrs.src = content.attrs.src || content.attrs.url;
  }
  
  if (content.content && Array.isArray(content.content)) {
    content.content.forEach(fixContentNodes);
  }
  return content;
}

const GLOBAL_TIPTAP_EXTENSIONS = [
  StarterKit.configure({
    codeBlock: false,
    heading: { levels: [1, 2, 3, 4] },
    paragraph: false,
    link: false,
    underline: false,
    ...({ image: false } as any),
  }),
  CustomParagraph,
  Placeholder.configure({ placeholder: 'Start writing something brilliant...' }),
  LinkExt.configure({ 
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    HTMLAttributes: { 
      class: 'text-foreground hover:opacity-70 underline underline-offset-4 decoration-2 font-bold transition-all cursor-pointer',
    }
  }),
  PersistentImage,
  Underline,
  CodeBlockLowlight.configure({ lowlight: createLowlight(common) }),
  CustomMention.configure({
    HTMLAttributes: {
      class: 'mention bg-zinc-100/50 dark:bg-zinc-800/50 text-foreground px-1.5 py-0.5 rounded-md font-bold border border-border/50 hover:bg-foreground hover:text-background transition-colors cursor-pointer',
    },
    suggestion,
  }),
  CharacterCount,
];

export default function EditorWorkspace() {
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
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [isForkable, setIsForkable] = useState(true);
  const [targetRequestId, setTargetRequestId] = useState<string | null>(null);
  const [openRequests, setOpenRequests] = useState<any[]>([]);
  const [showRequestSelector, setShowRequestSelector] = useState(false);

  const syncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: GLOBAL_TIPTAP_EXTENSIONS,
    content: undefined,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      
      // Synchronization Throttle: Prevents render blocking during high-velocity input
      if (syncRef.current) clearTimeout(syncRef.current);
      syncRef.current = setTimeout(() => {
        setValue('content', json);
      }, 400); // 400ms threshold for fluid input
    },
    editorProps: {
      attributes: {
        class: 'prose prose-zinc prose-lg max-w-none focus:outline-none min-h-[500px] px-1 py-12 editor-content',
      },
    },
  }, []); // Empty dependency array ensures it's created only once


  // Fetch Author Identity
  useEffect(() => {
    let isMounted = true;
    async function fetchIdentity() {
      // Small delay to prevent lock contention with Navbar
      await new Promise(r => setTimeout(r, 100));
      if (!isMounted) return;

      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted) {
          const [{ data: profile }, { data: anon }] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('anonymous_identities').select('*').eq('user_id', user.id).single()
          ]);
          
          if (isMounted) {
            setAuthorProfile(profile);
            setShadowIdentity(anon);
          }
        }
      } catch (err) {
        console.warn('Auth identity check failed (possibly lock contention):', err);
      }
    }
    fetchIdentity();

    // Fetch Open Requests (Signal Gaps)
    async function fetchRequests() {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.from('post_requests').select('*').eq('status', 'open').order('created_at', { ascending: false });
      setOpenRequests(data || []);
    }
    fetchRequests();

    return () => { isMounted = false; };
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

  // Load existing post or draft if ID provided in URL
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    
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
          
          let content = post.content;
          if (typeof content === 'string') {
            try { content = JSON.parse(content); } catch (e) {}
          }
          setValue('content', fixContentNodes(content));
          
          setPostType(post.type as PostType);
          setIsAnonymous(post.is_anonymous);
          setCoverImage(post.cover_image);
          setExistingPostId(post.id);
          setIsEditingExisting(true);
          if (post.tags) setTags(post.tags);
          if (post.code_snippets) setCodeSnippets(post.code_snippets);
        }
      }
    }
    loadInitial();
  }, [searchParams, setValue]);

  const title = watch('title');
  const content = watch('content');

  const handleSaveDraft = async () => {
    // Synchronization checkpoint
    // CRITICAL FIX: Ensure content is a plain serializable object
    const plainContent = JSON.parse(JSON.stringify(content));
    const result = await saveDraft({
      id: draftId || undefined,
      title: title || null,
      content: plainContent as Record<string, unknown>,
      type: postType,
      code_snippets: codeSnippets,
      parent_id: parentId,
    });
    if (result.draftId) {
      setDraftId(result.draftId);
      setLastSaved(new Date().toLocaleTimeString());
    }
  };

  const loadDraft = (draft: Draft) => {
    setValue('title', draft.title || '');
    
    let content = draft.content;
    if (typeof content === 'string') {
      try { content = JSON.parse(content); } catch (e) {}
    }
    setValue('content', fixContentNodes(content));
    
    setPostType(draft.type);
    setDraftId(draft.id);
    if (draft.code_snippets && Array.isArray(draft.code_snippets)) {
      setCodeSnippets(draft.code_snippets as any);
    }
    if (draft.parent_id) {
      setParentId(draft.parent_id);
    }
  };

  async function onSubmit(data: PostFormValues) {
    setLoading(true);
    setServerError(null);

    // Finalizing narrative state

    try {
      if (isEditingExisting && existingPostId) {
        // CRITICAL FIX: Ensure content is a plain serializable object
        // editor.getJSON() may return Proxies that RSC cannot serialize properly
        const plainContent = JSON.parse(JSON.stringify(data.content));
        
        const result = await updatePost(existingPostId, {
          title: data.title || undefined,
          content: plainContent as Record<string, unknown>,
          status: 'published',
          tags,
          cover_image: coverImage,
          code_snippets: codeSnippets,
        });
        
        if (result?.error) {
          setServerError(result.error);
          setLoading(false);
        } else {
          router.push(`/post/${result.slug}`);
        }
      } else {
        // CRITICAL FIX: Ensure content is a plain serializable object
        // editor.getJSON() may return Proxies that RSC cannot serialize properly
        const plainContent = JSON.parse(JSON.stringify(data.content));
        
        const result = await createPost({
          title: data.title,
          content: plainContent as Record<string, unknown>,
          type: postType,
          is_anonymous: isAnonymous,
          status: 'published',
          tags,
          audio_url: audioUrl,
          cover_image: coverImage,
          code_snippets: codeSnippets,
          parent_id: parentId,
          is_forkable: isForkable,
          resolved_request_id: targetRequestId || undefined,
        });

        if (result?.error) {
          setServerError(result.error);
          setLoading(false);
        } else {
          if (draftId) await deleteDraft(draftId);
          router.push(`/post/${result.slug}`);
        }
      }
    } catch (err) {
      if (!(err instanceof Error && err.message === 'NEXT_REDIRECT')) {
        setServerError('An error occurred. Please try again.');
        setLoading(false);
      }
    }
  }

  const isMicro = postType === 'micro';

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 animate-fade-in bg-background pb-32 md:pb-8">
      {/* Top bar */}
      <div className="sticky top-16 md:top-20 bg-background/95 backdrop-blur-md z-40 -mx-6 px-6 pt-6 pb-6 border-b border-border/10 mb-12 md:mb-16">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/feed" className="w-10 h-10 flex items-center justify-center rounded-full border border-border hover:border-foreground transition-all shrink-0">
              <X size={16} />
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowTypeSelector(!showTypeSelector)}
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                  showTypeSelector ? 'border-foreground bg-foreground text-background shadow-xl' : 'border-border hover:border-foreground text-foreground'
                }`}
              >
                {(() => { const Icon = POST_TYPE_CONFIG[postType].icon; return <Icon size={14} />; })()}
                <span className="hidden xs:inline">{POST_TYPE_CONFIG[postType].label}</span>
                <ChevronDown size={12} className={`transition-transform ${showTypeSelector ? 'rotate-180' : ''}`} />
              </button>

              {showTypeSelector && (
                <div className="absolute top-12 left-0 w-64 bg-background rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.15)] border border-border py-2 z-50 animate-scale-in">
                  {(Object.entries(POST_TYPE_CONFIG) as [PostType, any][]).map(([type, config]) => {
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
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{config.label}</p>
                          <p className="text-[10px] opacity-40 uppercase font-bold tracking-tighter text-muted-foreground">{config.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowRequestSelector(!showRequestSelector)}
                type="button"
                className={`flex items-center gap-2 px-4 py-2 h-10 md:h-12 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                  targetRequestId ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-lg' : 'border-border hover:border-foreground text-muted-foreground'
                }`}
              >
                <Zap size={14} />
                <span>{targetRequestId ? 'Resolving Request' : 'Link Community Request'}</span>
              </button>
              
              {showRequestSelector && (
                <div className="absolute top-14 right-0 w-80 bg-background rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.15)] border border-border py-4 z-50 animate-scale-in">
                  <div className="px-6 pb-2 border-b border-border mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Open Community Requests</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto no-scrollbar">
                    {openRequests.map(req => (
                      <button
                        key={req.id}
                        type="button"
                        onClick={() => { setTargetRequestId(req.id); setShowRequestSelector(false); }}
                        className="w-full px-6 py-3 text-left hover:bg-muted/5 transition-all space-y-1"
                      >
                        <p className="text-xs font-black uppercase tracking-tight">{req.title}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{req.reward_points} pts reward</p>
                      </button>
                    ))}
                    {openRequests.length === 0 && (
                      <div className="px-6 py-4 italic text-[10px] text-muted-foreground uppercase">No open requests detected.</div>
                    )}
                  </div>
                  {targetRequestId && (
                    <div className="mt-4 px-6 pt-2 border-t border-border">
                      <button 
                         onClick={() => setTargetRequestId(null)} 
                         className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-700"
                      >
                        Disconnect Request
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="rounded-full h-10 md:h-12 px-6 md:px-8 gap-2 font-black uppercase tracking-widest text-[10px]"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{loading ? 'Syncing...' : (isEditingExisting ? 'Save' : 'Publish')}</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-8 overflow-x-auto no-scrollbar pb-2">
           <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/5 border border-border shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${isAnonymous ? 'bg-black animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Tracing: <span className="text-foreground">
                {isAnonymous 
                  ? (shadowIdentity?.alias_name || 'Incognito') 
                  : (authorProfile?.full_name || authorProfile?.username || 'Resident')}
              </span>
            </span>
          </div>

          <div className="shrink-0 flex items-center">
            <DraftManager onLoadDraft={loadDraft} />
          </div>

          <button onClick={handleSaveDraft} type="button" className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground transition-all">
            <Save size={12} />
            {lastSaved ? `Synced ${lastSaved}` : 'Sync Draft'}
          </button>

          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            type="button"
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
              isAnonymous
                ? 'bg-foreground text-background border-foreground shadow-lg'
                : 'text-muted-foreground border-border hover:border-foreground hover:text-foreground'
            }`}
          >
            <Ghost size={12} />
            {isAnonymous ? 'Shadow Protocol Active' : 'Protocol: Public'}
          </button>
          
          <button
            onClick={() => setIsForkable(!isForkable)}
            type="button"
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
              isForkable
                ? 'text-emerald-600 border-emerald-100 bg-emerald-50/30'
                : 'text-amber-600 border-amber-100 bg-amber-50/30'
            }`}
          >
            {isForkable ? <Unlock size={12} /> : <Lock size={12} />}
            {isForkable ? 'Allow Remixing' : 'Asset Locked'}
          </button>

          {!isMicro && (
            <div className="shrink-0 flex items-center border border-border rounded-full p-1 bg-muted/5">
              {(['edit', 'preview', 'split'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  type="button"
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                    viewMode === mode 
                      ? 'bg-foreground text-background shadow-md' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {serverError && (
        <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm animate-fade-in">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={`${viewMode === 'split' && !isMicro ? 'grid grid-cols-1 lg:grid-cols-2 gap-12' : 'max-w-3xl mx-auto'}`}>
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className="space-y-10">
              <ImageUploader 
                imageUrl={coverImage} 
                onUpload={setCoverImage} 
                onRemove={() => setCoverImage(null)} 
                label={isMicro ? "Add Image" : "Add Cover"}
              />

              <div className="space-y-2">
                <input
                  {...register('title')}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                  placeholder={isMicro ? "Optional title..." : "Post Title"}
                  className="w-full text-3xl md:text-4xl font-black placeholder:text-muted-foreground/20 outline-none border-none bg-transparent tracking-tight text-foreground"
                />
                
                <div className="flex flex-wrap items-center gap-2 pt-4">
                  {tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted/5 border border-border text-[10px] font-black uppercase tracking-widest text-foreground animate-reveal"
                    >
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
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

              {isMicro ? (
                <div className="space-y-3">
                  <Controller
                    control={control}
                    name="content"
                    render={({ field }) => (
                      <textarea
                        value={typeof field.value === 'string' ? field.value : (field.value as any)?.content?.[0]?.content?.[0]?.text || ''}
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
                </div>
              ) : (
                <div className="min-h-[500px]">
                  <Controller
                    control={control}
                    name="content"
                    render={({ field }) => (
                      <TipTapEditor
                        editor={editor}
                        content={field.value as any}
                        onChange={field.onChange}
                        placeholder="Write something brilliant..."
                        autoSaveKey={postType}
                        onOpenAI={() => setShowAIAssistant(true)}
                      />
                    )}
                  />
                </div>
              )}
              {errors.content && <p className="text-xs text-red-500 font-medium">Please add some content to your post.</p>}

              {postType === 'code' && (
                <div className="mt-12 pt-12 border-t border-border">
                  <h3 className="text-lg font-bold mb-6">Code Snippets</h3>
                  <CodeEditor snippets={codeSnippets} onChange={setCodeSnippets} />
                </div>
              )}

              {postType === 'audio' && (
                <div className="mt-12 pt-12 border-t border-border">
                  <h3 className="text-lg font-bold mb-6">Audio File</h3>
                  <AudioUploader
                    audioUrl={audioUrl}
                    onUpload={(url) => { setAudioUrl(url); setValue('audio_url', url); }}
                    onRemove={() => { setAudioUrl(null); setValue('audio_url', null); }}
                  />
                </div>
              )}
            </div>
          )}

          {(viewMode === 'preview' || viewMode === 'split') && !isMicro && (
            <div className={`${viewMode === 'preview' ? 'max-w-3xl mx-auto' : ''} animate-reveal`}>
              <div className="sticky top-24">
                <div className="flex items-center gap-2 mb-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Eye size={14} /> Live Preview
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

      <AIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        title={title || ''}
        content={content as Record<string, unknown>}
        onInsertTitle={(t) => setValue('title', t)}
        onInsertContent={(c) => editor?.chain().focus().insertContent(c).run()}
        onAddTag={(t) => { if (!tags.includes(t)) setTags(prev => [...prev, t].slice(0, 10)); }}
      />
    </div>
  );
}
