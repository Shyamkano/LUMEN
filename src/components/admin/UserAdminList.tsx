'use client';

import { format } from 'date-fns';
import { Mail, MoreHorizontal, ShieldAlert, User, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { deleteUser, toggleBanUser } from '@/app/admin/actions';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui';

interface UserAdminListProps {
  users: any[];
}

export function UserAdminList({ users }: UserAdminListProps) {
  const [userList, setUserList] = useState(users);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Modal State
  const [modalMode, setModalMode] = useState<'delete' | 'message' | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredUsers = userList.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    
    const res = await deleteUser(selectedUser.id);
    if (res.success) {
      setUserList(prev => prev.filter(u => u.id !== selectedUser.id));
      setModalMode(null);
      setSelectedUser(null);
    } else {
      alert(`Error: ${res.error}`);
    }
    setIsProcessing(false);
  };

  const handleToggleBan = async (u: any) => {
    const res = await toggleBanUser(u.id, u.is_banned);
    if (res.success) {
      setUserList(prev => prev.map(user => user.id === u.id ? { ...user, is_banned: !u.is_banned } : user));
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Client-side filter bar */}
      <div className="flex items-center gap-4 bg-white border border-black/5 rounded-full px-6 py-3 shadow-sm max-w-md">
         <Search size={16} className="text-black/30" />
         <input 
          type="text" 
          placeholder="Filter residents by ID or Name..." 
          className="bg-transparent text-sm font-bold outline-none flex-1 text-black placeholder:text-black/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.map((u) => (
          <div key={u.id} className="relative group">
            <div className="bg-white border border-black/5 p-6 rounded-3xl flex items-center justify-between hover:shadow-2xl hover:shadow-black/5 transition-all w-full">
              <div className="flex items-center gap-6">
                <Link href={`/profile/${u.username}`} className="flex items-center gap-6 group/link">
                  <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center font-black text-xl overflow-hidden shadow-lg group-hover/link:scale-105 transition-transform relative">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      u.username?.charAt(0).toUpperCase()
                    )}
                    {u.is_banned && (
                      <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                        <ShieldAlert size={24} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <p className="font-black text-lg tracking-tight text-black group-hover/link:underline underline-offset-4">{u.full_name || u.username}</p>
                       {u.is_banned && <span className="bg-red-100 text-red-600 text-[8px] font-black uppercase px-2 py-0.5 rounded">Banned</span>}
                    </div>
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest flex items-center gap-2">
                      @{u.username} <span className="text-black/10">•</span> Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-400 lowercase">{u.email}</p>
                  </div>
                </Link>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative">
                <button 
                  onClick={() => {
                    setSelectedUser(u);
                    setModalMode('message');
                  }}
                  className="p-3 hover:bg-black hover:text-white rounded-xl transition-all border border-black/5 text-black"
                  title="Message User"
                >
                  <Mail size={16} />
                </button>
                <button 
                  onClick={() => handleToggleBan(u)}
                  className={`p-3 rounded-xl transition-all border border-black/5 ${u.is_banned ? 'bg-red-500 text-white' : 'hover:bg-red-500 hover:text-white text-red-500'}`}
                  title={u.is_banned ? "Unban" : "Ban User"}
                >
                  <ShieldAlert size={16} />
                </button>
                <button 
                  onClick={() => {
                    setSelectedUser(u);
                    setModalMode('delete');
                  }}
                  className="p-3 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-black/5 text-red-600"
                  title="Delete User"
                >
                  <Trash2 size={16} />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === u.id ? null : u.id)}
                    className="p-3 hover:bg-black hover:text-white rounded-xl transition-all border border-black/5 text-black"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {openDropdown === u.id && (
                    <div className="absolute right-0 top-12 w-48 bg-white border border-black/10 rounded-2xl shadow-2xl py-2 z-50 animate-reveal">
                      <Link href={`/profile/${u.username}`} className="flex items-center gap-3 px-4 py-2 text-xs font-bold hover:bg-zinc-50 text-black">
                        View Public Profile
                      </Link>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(u.id);
                          setOpenDropdown(null);
                          alert('Identification string copied to clipboard.');
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-xs font-bold hover:bg-zinc-50 text-black"
                      >
                        Copy User ID
                      </button>
                      <div className="h-px bg-black/5 my-2" />
                      <button 
                         onClick={() => {
                          setSelectedUser(u);
                          setModalMode('delete');
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-xs font-bold hover:bg-red-50 text-red-600"
                      >
                        Force Removal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Modals */}
      <Modal 
        isOpen={modalMode === 'delete'} 
        onClose={() => setModalMode(null)} 
        title="Confirm Removal"
      >
        <div className="space-y-6">
          <p className="text-sm font-medium text-black/60 leading-relaxed">
            You are about to permanently remove <span className="font-black text-black">@{selectedUser?.username}</span> from the network. This will delete their profile, logs, and identity. This cannot be undone.
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleDelete}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-2xl font-black uppercase tracking-widest"
              disabled={isProcessing}
            >
              {isProcessing ? 'Removing...' : 'Confirm Destruction'}
            </Button>
            <button 
              onClick={() => setModalMode(null)}
              className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={modalMode === 'message'} 
        onClose={() => setModalMode(null)} 
        title="Reach Out"
      >
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 bg-zinc-100 rounded-3xl mx-auto flex items-center justify-center">
            <Mail size={32} className="text-black" />
          </div>
          <p className="text-sm font-medium text-black/60 leading-relaxed px-4">
            Contacting <span className="font-black text-black">@{selectedUser?.username}</span> via official channel:<br/>
            <span className="text-[10px] text-zinc-400 font-mono">{selectedUser?.email}</span>
          </p>
          <a 
            href={`mailto:${selectedUser?.email}`}
            className="block w-full bg-black text-white h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3"
          >
            Open Mail Client <Mail size={16} />
          </a>
          <button 
            onClick={() => setModalMode(null)}
            className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] hover:underline"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
