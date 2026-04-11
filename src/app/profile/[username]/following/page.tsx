import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getFollowing } from '@/app/actions/social';
import { UserList } from '@/components/social/UserList';

export default async function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username).replace('@', '');
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', decodedUsername)
    .single();

  if (!profile) notFound();

  const following = await getFollowing(profile.id);

  return (
    <UserList 
      users={following} 
      title="Following" 
      emptyMessage="This individual is not following any external signals." 
      backUrl={`/profile/${decodedUsername}`}
    />
  );
}
