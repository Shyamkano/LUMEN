import { Ghost, LogOut } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function BannedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Handle logout
  async function handleLogout() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-red-600 rounded-[2.5rem] flex items-center justify-center mb-10 animate-pulse shadow-[0_0_50px_rgba(220,38,38,0.5)]">
        <Ghost size={48} className="text-white" />
      </div>
      
      <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic mb-6">
        Access <span className="text-red-600">Terminated.</span>
      </h1>
      
      <p className="max-w-md text-zinc-500 font-medium leading-relaxed mb-12">
        Your presence on the LUMEN network has been suspended due to protocol violations. This identity is currently locked out of the archive.
      </p>

      <form action={handleLogout}>
        <Button 
          type="submit"
          className="bg-white text-black hover:bg-zinc-200 h-14 px-10 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3"
        >
          Exit Network <LogOut size={18} />
        </Button>
      </form>

      <div className="mt-20 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800">
        Status: Synchronization Denied
      </div>
    </div>
  );
}
