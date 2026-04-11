// ========================
// FLOW Platform — Type Definitions
// ========================

export type PostType = 'blog' | 'micro' | 'code' | 'audio';
export type PostStatus = 'draft' | 'published';

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  followers_count: number;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: Record<string, unknown> | null; // TipTap JSON
  type: PostType;
  status: PostStatus;
  author_id: string;
  slug: string;
  is_anonymous: boolean;
  audio_url: string | null;
  cover_image: string | null;
  tags: string[] | null;
  read_time: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  profile?: Profile | null;
  anonymous_identity?: AnonymousIdentity | null;
  likes_count?: number;
  comments_count?: number;
  code_snippets?: CodeSnippet[] | null;
  audio_metadata?: AudioMetadata | null;
}


export interface CodeSnippet {
  id: string;
  post_id: string;
  code: string;
  language: string;
  title: string | null;
  ai_explanation: string | null;
  created_at: string;
}

export interface AudioMetadata {
  id: string;
  post_id: string;
  audio_url: string;
  duration: number | null; // seconds
  transcript: string | null;
  file_size: number | null;
  created_at: string;
}

export interface AnonymousIdentity {
  id: string;
  user_id: string;
  alias_name: string;
  avatar_seed: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string | null;
  anon_id: string | null;
  content: string;
  parent_id: string | null;
  created_at: string;
  // Joined
  profile?: Profile | null;
  anonymous_identity?: AnonymousIdentity | null;
  replies?: Comment[];
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string | null;
  anon_id: string | null;
  created_at: string;
}

export interface Draft {
  id: string;
  user_id: string;
  title: string | null;
  content: Record<string, unknown> | null;
  type: PostType;
  tags?: string[];
  code_snippets?: { code: string; language: string; title?: string }[];
  last_saved_at: string;
  created_at: string;
}

export interface PostVersion {
  id: string;
  post_id: string;
  content: Record<string, unknown> | null;
  title: string | null;
  version_num: number;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
  post?: Post;
}

// Feed item (unified across all post types)
export interface FeedItem extends Post {
  code_snippets?: CodeSnippet[];
  audio_metadata?: AudioMetadata | null;
}

// AI response types
export interface AITitleSuggestion {
  titles: string[];
}

export interface AITagSuggestion {
  tags: string[];
}

export interface AISummary {
  summary: string;
}

export interface AICodeExplanation {
  explanation: string;
  language: string;
}

export interface AIGrammarFix {
  corrected: string;
  changes: string[];
}
