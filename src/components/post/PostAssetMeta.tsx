'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldOff, 
  GitBranch, 
  CheckCircle2, 
  XCircle,
  Loader2,
  TrendingUp,
  History,
  Lock,
  Crown,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui';
import { forkPost, validatePost, calculateLegacyScore } from '@/app/actions/engagement';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PostAssetMetaProps {
  postId: string;
  slug: string;
  healthStatus: string;
  validationScore: number;
  isAuthor: boolean;
  isForkable: boolean;
}

export function PostAssetMeta({ postId, slug, healthStatus, validationScore, isAuthor, isForkable }: PostAssetMetaProps) {
  const [forking, setForking] = useState(false);
  const [validating, setValidating] = useState<boolean | null>(null);
  const [legacySplit, setLegacySplit] = useState<{originalPercentage: number, remixerPercentage: number} | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchLegacy() {
      const split = await calculateLegacyScore(postId);
      setLegacySplit(split);
    }
    fetchLegacy();
  }, [postId]);

  const handleFork = async () => {
    setForking(true);
    try {
      const fork = await forkPost(postId);
      router.push(`/new?draftId=${fork.id}`);
    } catch (err) {
      console.error('Remix failed:', err);
      setForking(false);
    }
  };

  const handleValidate = async (isPositive: boolean) => {
    setValidating(isPositive);
    try {
      await validatePost(postId, isPositive);
      router.refresh();
    } catch (err) {
      console.error('Validation failed:', err);
    } finally {
      setValidating(null);
    }
  };

  const getStatusConfig = () => {
    switch (healthStatus) {
      case 'certified': return { icon: ShieldCheck, color: 'text-green-500', label: 'Certified Asset' };
      case 'stale': return { icon: ShieldAlert, color: 'text-amber-500', label: 'Needs Update' };
      case 'archived': return { icon: ShieldOff, color: 'text-zinc-400', label: 'Legacy Archive' };
      default: return { icon: ShieldCheck, color: 'text-green-500', label: 'Certified Asset' };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <div className="flex flex-col gap-6 p-8 rounded-[2.5rem] border border-border bg-white shadow-xl shadow-black/5">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusIcon className={status.color} size={18} />
              <span className="text-xs font-black uppercase tracking-widest">{status.label}</span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
              Resonance Score: <span className="text-foreground">{validationScore}%</span> Community Faith
            </p>
          </div>
          
          {!isAuthor && (
            isForkable ? (
              <Button 
                onClick={handleFork} 
                disabled={forking}
                variant="outline" 
                className="rounded-full h-10 px-6 text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-black hover:text-white transition-all shadow-sm"
              >
                {forking ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />}
                Remix Asset
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-amber-100 bg-amber-50 text-[9px] font-black uppercase tracking-widest text-amber-700">
                <Lock size={12} /> Asset Locked
              </div>
            )
          )}
        </div>

        {legacySplit && (legacySplit.remixerPercentage > 0 || legacySplit.originalPercentage > 0) && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-50 border border-zinc-100 animate-reveal">
            <div className="flex -space-x-1.5">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center border-2 border-white">
                <Crown size={12} className="text-amber-600" />
              </div>
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white">
                <Zap size={12} className="text-blue-600" />
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-tight text-muted-foreground whitespace-nowrap">
              <span className="text-amber-700">{legacySplit.originalPercentage}% Seed Legacy</span> / <span className="text-blue-700">{legacySplit.remixerPercentage}% Remix Expansion</span>
            </p>
          </div>
        )}
      </div>

      <div className="h-px w-full bg-border/50" />

      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Community Validation</p>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => handleValidate(true)}
            disabled={validating !== null}
            variant="outline" 
            className="h-12 rounded-2xl border-green-100 bg-green-50/30 text-green-700 hover:bg-green-100 gap-2 font-black uppercase tracking-widest text-[9px]"
          >
            {validating === true ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Still Works
          </Button>
          <Button 
            onClick={() => handleValidate(false)}
            disabled={validating !== null}
            variant="outline" 
            className="h-12 rounded-2xl border-red-100 bg-red-50/30 text-red-700 hover:bg-red-100 gap-2 font-black uppercase tracking-widest text-[9px]"
          >
            {validating === false ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Needs Update
          </Button>
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Link href={`/post/${slug}/lineage`} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-colors cursor-pointer">
          <History size={12} /> Narrative History
        </Link>
      </div>
    </div>
  );
}
