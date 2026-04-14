'use client';

import { ShieldAlert, Trash2, CheckCircle, ExternalLink, MessageSquare } from 'lucide-react';
import { resolveReport } from '@/app/actions/engagement';
import { deletePost } from '@/app/actions/posts';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface Report {
    id: string;
    reason: string;
    details: string | null;
    status: string;
    created_at: string;
    post_id: string;
    post?: {
        title: string;
        slug: string;
    };
    reporter?: {
        username: string;
    };
}

export function ModerationReports({ initialReports }: { initialReports: any[] }) {
    const [reports, setReports] = useState<Report[]>(initialReports);
    const [loading, setLoading] = useState<string | null>(null);

    const handleResolve = async (reportId: string, status: 'reviewed' | 'actioned') => {
        setLoading(reportId);
        const res = await resolveReport(reportId, status);
        if (res.success) {
            setReports(prev => prev.filter(r => r.id !== reportId));
        }
        setLoading(null);
    };

    const handleDelete = async (reportId: string, postId: string) => {
        if (!confirm('ARCHIVE TERMINATION: Are you sure you want to permanently delete this signal?')) return;
        
        setLoading(reportId);
        const res = await deletePost(postId);
        if (res.success) {
            await resolveReport(reportId, 'actioned');
            setReports(prev => prev.filter(r => r.id !== reportId));
        }
        setLoading(null);
    };

    if (reports.length === 0) {
        return (
            <div className="p-12 rounded-[2.5rem] border-2 border-dashed border-black/5 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40">Archive Status</h4>
                    <p className="font-bold text-sm">All Signals Neutralized</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {reports.map((report) => (
                <div key={report.id} className="p-8 rounded-[2.5rem] bg-white border border-black/5 hover:border-red-500/20 transition-all shadow-sm hover:shadow-xl group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                                <ShieldAlert size={12} /> High Priority Alert
                            </span>
                            <h3 className="text-lg font-black tracking-tight leading-tight uppercase">
                                {report.reason}
                            </h3>
                        </div>
                        <Link href={`/post/${report.post?.slug}`} target="_blank">
                           <Button variant="ghost" size="icon" className="rounded-full hover:bg-black hover:text-white transition-all">
                              <ExternalLink size={16} />
                           </Button>
                        </Link>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-50 border border-black/5 mb-8">
                        <p className="text-xs font-medium text-black/60 italic leading-relaxed">
                            "{report.details || 'No additional narrative provided.'}"
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-black/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black uppercase">
                                {report.reporter?.username?.charAt(0) || 'R'}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest leading-none">
                                <p className="text-black/30 mb-1">Signaled By</p>
                                <p>@{report.reporter?.username || 'Resident'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Button 
                                onClick={() => handleResolve(report.id, 'reviewed')}
                                disabled={!!loading}
                                className="flex-1 md:flex-none h-11 rounded-xl bg-zinc-100 text-black hover:bg-black hover:text-white border-0 text-[10px] font-black uppercase tracking-widest"
                            >
                                Dismiss
                            </Button>
                            <Button 
                                onClick={() => handleDelete(report.id, report.post_id)}
                                disabled={!!loading}
                                className="flex-1 md:flex-none h-11 rounded-xl bg-red-500 text-white hover:bg-red-600 border-0 text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-red-500/20"
                            >
                                <Trash2 size={14} /> Terminate Post
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
