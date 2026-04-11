-- ==============================================
-- FLOW Platform — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ==============================================

-- 1. Profiles table (linked to auth.users via trigger)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  twitter TEXT,
  followers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Posts table (multi-type support)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content JSONB,
  type TEXT NOT NULL DEFAULT 'blog' CHECK (type IN ('blog', 'micro', 'code', 'audio')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  audio_url TEXT,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  read_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Code snippets
CREATE TABLE IF NOT EXISTS code_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  title TEXT,
  ai_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Audio metadata
CREATE TABLE IF NOT EXISTS audio_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration INTEGER, -- seconds
  transcript TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Anonymous identities
CREATE TABLE IF NOT EXISTS anonymous_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias_name TEXT NOT NULL,
  avatar_seed TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id) -- one alias per user
);

-- 6. Comments (with nested replies)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id UUID REFERENCES anonymous_identities(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Likes
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id) -- one like per user per post
);

-- 8. Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- 9. Drafts
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content JSONB,
  type TEXT NOT NULL DEFAULT 'blog' CHECK (type IN ('blog', 'micro', 'code', 'audio')),
  tags TEXT[] DEFAULT '{}',
  code_snippets JSONB DEFAULT '[]'::jsonb,
  last_saved_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Post versions (content history)
CREATE TABLE IF NOT EXISTS post_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content JSONB,
  title TEXT,
  version_num INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============= INDEXES =============
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_code_snippets_post ON code_snippets(post_id);
CREATE INDEX IF NOT EXISTS idx_audio_metadata_post ON audio_metadata(post_id);

-- ============= RLS POLICIES =============
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_versions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts
CREATE POLICY "Published posts are viewable by everyone" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "Users can view own drafts" ON posts FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Code snippets
CREATE POLICY "Code snippets are viewable by everyone" ON code_snippets FOR SELECT USING (true);
CREATE POLICY "Post authors can manage snippets" ON code_snippets FOR ALL USING (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = code_snippets.post_id AND posts.author_id = auth.uid())
);

-- Audio metadata
CREATE POLICY "Audio metadata is viewable by everyone" ON audio_metadata FOR SELECT USING (true);
CREATE POLICY "Post authors can manage audio" ON audio_metadata FOR ALL USING (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = audio_metadata.post_id AND posts.author_id = auth.uid())
);

-- Anonymous identities
CREATE POLICY "Users can view own identity" ON anonymous_identities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view anonymous identities" ON anonymous_identities FOR SELECT USING (true);
CREATE POLICY "Users can create own identity" ON anonymous_identities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own identity" ON anonymous_identities FOR UPDATE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks
CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Drafts
CREATE POLICY "Users can manage own drafts" ON drafts FOR ALL USING (auth.uid() = user_id);

-- Post versions
CREATE POLICY "Post versions viewable by post author" ON post_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_versions.post_id AND posts.author_id = auth.uid())
);
CREATE POLICY "Post versions creatable by post author" ON post_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_versions.post_id AND posts.author_id = auth.uid())
);

-- ============= TRIGGER: Auto-create profile on signup =============
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============= TRIGGER: Auto-update updated_at =============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_updated_at ON posts;
CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============= STORAGE BUCKETS =============
-- Run these separately or via Supabase dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('audio-posts', 'audio-posts', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);
