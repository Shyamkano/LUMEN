import { getNicheInsights } from '@/app/actions/engagement';
import { NicheHeatmap } from '@/components/analytics/NicheHeatmap';
import { Button } from '@/components/ui';
import { ArrowLeft, Globe } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NicheMapPage() {
  const mapData = await getNicheInsights();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
        
        {/* Navigation */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Back to Library
              </Link>
              <div className="flex items-center gap-3">
                <Globe size={32} className="text-foreground" />
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                  Global <br /> Intelligence
                </h1>
              </div>
           </div>

           <div className="p-6 rounded-[2rem] bg-white border border-border shadow-sm max-w-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Network Status</p>
              <p className="text-xs font-medium text-foreground leading-relaxed">
                Analyzing the collective focus across all <strong>{mapData.length}</strong> active niches in the narrative network.
              </p>
           </div>
        </div>

        {mapData.length > 0 ? (
          <NicheHeatmap mapData={mapData} />
        ) : (
          <div className="py-40 text-center border-2 border-dashed border-border rounded-[4rem] bg-white">
             <div className="max-w-md mx-auto space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Intelligence pending...</p>
                <p className="text-sm font-bold text-muted-foreground uppercase leading-relaxed">The network is currently accumulating resonance signals. Check back shortly.</p>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
