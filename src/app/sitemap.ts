import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Base URLs
  const routes = ['', '/feed', '/dashboard', '/auth/login', '/auth/signup'].map(
    (route) => ({
      url: `https://lumen-archive.vercel.app${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    })
  );

  // Dynamic Post URLs
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .limit(1000);

  const postRoutes = (posts || []).map((post) => ({
    url: `https://lumen-archive.vercel.app/post/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...routes, ...postRoutes];
}
