import { getPostBySlug } from '@/app/actions/posts';
import { GrowthCenter } from '@/components/analytics/GrowthCenter';
import { notFound } from 'next/navigation';

interface PostAnalyticsProps {
  params: Promise<{ slug: string }>;
}

export default async function PostAnalyticsPage({ params }: PostAnalyticsProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
      <GrowthCenter postId={post.id} />
    </div>
  );
}
