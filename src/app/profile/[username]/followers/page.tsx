import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getFollowers } from '@/app/actions/social';
import { UserList } from '@/components/social/UserList';

export default async function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username).replace('@', '');
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', decodedUsername)
    .single();

  if (!profile) notFound();

  const followers = await getFollowers(profile.id);

  return (
    <UserList 
      users={followers} 
      title="Followers" 
      emptyMessage="No one has synchronized with this frequency yet." 
    />
  );
}
