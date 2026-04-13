'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui';
import { 
  User, 
  Shield, 
  Bell, 
  LogOut, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  Eye, 
  Globe 
} from 'lucide-react';
import Link from 'next/link';
import { logout, deleteAccount } from '@/app/auth/actions';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, XCircle, Trash2, X } from 'lucide-react';

export default function SettingsHubPage() {
  const { user, profile, loading } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    await deleteAccount();
    // Redirect happens in action
  };

  const deleteModal = showDeleteModal && createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={() => !isDeleting && setShowDeleteModal(false)}
      />
      <div className="relative bg-white rounded-[3rem] p-10 max-w-md w-full space-y-8 animate-in zoom-in-95 duration-300 border border-red-100 shadow-[0_32px_128px_rgba(255,0,0,0.1)]">
        <div className="flex justify-between items-start">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <Trash2 size={32} />
          </div>
          <button 
            disabled={isDeleting}
            onClick={() => setShowDeleteModal(false)}
            className="p-2 hover:bg-zinc-100 rounded-full transition-all"
          >
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-3xl font-black tracking-tighter uppercase text-zinc-900 leading-none">
            Terminate<br/>Identity?
          </h3>
          <p className="text-[10px] font-black leading-relaxed uppercase tracking-[0.2em] text-red-600">
            Irreversible Protocol Action
          </p>
          <p className="text-sm text-zinc-600 font-medium leading-relaxed">
            This will permanently erase your archive, narratives, and synchronization data. Access to this coordinate cannot be restored.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Type "DELETE" to confirm</label>
          <input 
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full h-14 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 text-sm font-black tracking-widest outline-none focus:border-red-500 transition-all uppercase"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== 'DELETE' || isDeleting}
            className="w-full h-14 rounded-full bg-red-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-red-700 disabled:opacity-30 disabled:grayscale transition-all"
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Termination'}
          </Button>
          <Button 
            variant="ghost" 
            disabled={isDeleting}
            onClick={() => setShowDeleteModal(false)}
            className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600"
          >
            Abort Action
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
  const sections = [
    {
      title: "Public Identity",
      description: "Manage your visible profile, avatar, and social nodes.",
      href: "/settings/profile",
      icon: User,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Shadow Identity",
      description: "Configure your anonymous alias and private signals.",
      href: "/settings/shadow",
      icon: Shield,
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "Signal Protocol",
      description: "Notification preferences and network activity alerts.",
      href: "/settings/notifications",
      icon: Bell,
      color: "bg-amber-50 text-amber-600"
    },
    {
      title: "Network Presence",
      description: "Theme preferences and accessibility parameters.",
      href: "/settings/preferences",
      icon: Layers,
      color: "bg-emerald-50 text-emerald-600"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 md:py-20 animate-reveal">
      {deleteModal}
      <div className="flex flex-col gap-3 md:gap-4 mb-12 md:mb-20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center text-background">
            <Sparkles size={12} />
          </div>
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">System Manifest</p>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase leading-none">Settings</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {sections.map((section) => (
          <Link 
            key={section.title} 
            href={section.href}
            className="group p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] bg-white border border-border hover:border-foreground transition-all flex flex-col justify-between h-auto md:h-64 hover:shadow-2xl hover:shadow-foreground/5"
          >
            <div className="space-y-4 md:space-y-6">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] ${section.color} flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors duration-500 shadow-sm border border-border/50`}>
                <section.icon size={24} className="md:w-[28px] md:h-[28px]" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-foreground">{section.title}</h3>
                <p className="text-[10px] md:text-xs font-bold text-muted-foreground mt-1 md:mt-2 leading-relaxed uppercase tracking-tight opacity-70">
                  {section.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 mt-6 md:mt-0 border-t border-border/40">
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Configure Protocol
              </span>
              <ChevronRight size={14} className="text-border group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* Account Info Card */}
      <div className="mt-8 md:mt-12 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-muted/5 border border-border border-dashed flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8">
        <div className="flex items-center gap-4 md:gap-6">
           <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black flex items-center justify-center text-white text-xl md:text-2xl font-black">
              {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
           </div>
           <div>
             <p className="text-xs md:text-sm font-black text-foreground uppercase tracking-tight truncate max-w-[150px] md:max-w-none">{profile?.full_name || "Archive Resident"}</p>
             <p className="text-[10px] md:text-xs font-bold text-muted-foreground tracking-tight truncate max-w-[150px] md:max-w-none">{user.email}</p>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
           <Link href={`/profile/${profile?.username}`} className="flex-1 lg:flex-none">
             <Button variant="outline" className="w-full rounded-full h-11 md:h-12 px-5 md:px-6 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] gap-2">
               <Eye size={14} /> Public Archive
             </Button>
           </Link>
           <button 
             onClick={() => setShowDeleteModal(true)}
             className="flex-1 lg:flex-none rounded-full h-11 md:h-12 px-5 md:px-6 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
           >
             <Trash2 size={14} /> Terminate
           </button>
        </div>
      </div>
    </div>
  );
}
