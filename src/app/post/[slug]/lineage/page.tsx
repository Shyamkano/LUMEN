import { getPostBySlug, getPostLineage } from '@/app/actions/posts';
import { notFound } from 'next/navigation';
import { LineageTree } from '@/components/post/LineageTree';

export default async function LineagePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug);
  
  if (!post) notFound();

  const lineage = await getPostLineage(post.id);
  if (!lineage) notFound();

  return (
    <div className="min-h-screen bg-background">
      <LineageTree 
        parent={lineage.parent as any}
        current={lineage.current as any}
        forks={lineage.forks as any}
      />
    </div>
  );
}
