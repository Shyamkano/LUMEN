'use client';

import { useState } from 'react';
import { AlertCircle, Check, Flag, X } from 'lucide-react';
import { reportAsset } from '@/app/actions/engagement';

interface ReportDialogProps {
  postId: string;
  onClose: () => void;
}

export default function ReportDialog({ postId, onClose }: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await reportAsset(postId, reason, details);
      if (result.error) {
        setError(result.error);
      } else {
        setIsSuccess(true);
        setTimeout(onClose, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred while transmitting the signal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const REASONS = [
    'Information Pollution (Misleading)',
    'Low Resonance (Low Quality/Spam)',
    'Harassment or Hate Signal',
    'Intellectual Property Infringement',
    'Technical Malfunction (Broken Content)',
    'Other'
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-red-500">
              <Flag className="w-5 h-5" />
              <h2 className="text-xl font-bold tracking-tight">Signal Violation</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">Signal Received</h3>
              <p className="text-zinc-400 text-sm">
                The Architects will review this post and take appropriate action.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Nature of the Violation</label>
                <div className="grid grid-cols-1 gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`text-left px-4 py-2.5 rounded-lg text-sm border transition-all ${
                        reason === r 
                          ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg' 
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Additional Context (Optional)</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 resize-none h-24 transition-all"
                  placeholder="Provide more evidence for the Architects..."
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reason || isSubmitting}
                  className="flex-[2] px-4 py-2.5 rounded-lg text-sm font-bold bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl"
                >
                  {isSubmitting ? 'Transmitting...' : 'Signal Architects'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
