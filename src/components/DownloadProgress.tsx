'use client';

import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Loader2, CheckCircle2, AlertTriangle, Download, Sparkles } from 'lucide-react';

interface DownloadProgressProps {
  formatLabel: string;
  percent: number;
  speed: string;
  eta: string;
  status: 'pending' | 'downloading' | 'merging' | 'completed' | 'failed';
  error?: string;
  onClose: () => void;
}

export default function DownloadProgress({
  formatLabel,
  percent,
  speed,
  eta,
  status,
  error,
  onClose,
}: DownloadProgressProps) {
  const isPending = status === 'pending';
  const isDownloading = status === 'downloading';
  const isMerging = status === 'merging';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <Card className="border border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          
          {/* Header Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isPending && <Loader2 className="h-5 w-5 text-neutral-400 animate-spin" />}
              {isDownloading && <Loader2 className="h-5 w-5 text-red-500 animate-spin" />}
              {isMerging && <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />}
              {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {isFailed && <AlertTriangle className="h-5 w-5 text-red-500" />}
              
              <span className="font-semibold text-white text-sm md:text-base">
                {isPending && 'Queuing download job...'}
                {isDownloading && `Downloading in ${formatLabel}...`}
                {isMerging && 'Merging audio and video streams (FFmpeg)...'}
                {isCompleted && 'Download Completed!'}
                {isFailed && 'Download Failed'}
              </span>
            </div>
            
            {isCompleted && (
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                Success
              </span>
            )}
            {isFailed && (
              <span className="text-xs font-semibold uppercase tracking-wider text-red-400 px-2 py-0.5 rounded bg-red-500/10">
                Failed
              </span>
            )}
          </div>

          {/* Progress Bar & Percentage */}
          {!isFailed && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-neutral-400">
                <span>Progress</span>
                <span className="text-white">{Math.round(percent)}%</span>
              </div>
              <Progress value={percent} />
            </div>
          )}

          {/* Stats (Speed & ETA) */}
          {isDownloading && (
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/5 p-3 text-center border border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Speed</span>
                <span className="text-sm font-semibold text-white mt-0.5">{speed}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Time Remaining</span>
                <span className="text-sm font-semibold text-white mt-0.5">{eta}</span>
              </div>
            </div>
          )}

          {isMerging && (
            <div className="rounded-xl bg-amber-500/5 p-3 text-center border border-amber-500/10 animate-pulse">
              <span className="text-xs text-amber-300">
                This may take a moment for large 1080p+ files as FFmpeg joins the streams.
              </span>
            </div>
          )}

          {/* Error Message */}
          {isFailed && (
            <div className="rounded-xl bg-red-500/10 p-3 border border-red-500/20 text-xs md:text-sm text-red-300">
              {error || 'An unexpected error occurred during the download process.'}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-2">
            {(isCompleted || isFailed) && (
              <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl h-9 px-4">
                Close
              </Button>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
