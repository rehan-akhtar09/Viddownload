'use client';

import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

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
    <Card className="rounded-3xl shadow-xl shadow-violet-600/5 animate-in fade-in zoom-in-95 duration-300 dark:shadow-black/30" role="status" aria-live="polite">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">

          {/* Header Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isPending && <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />}
              {isDownloading && <Loader2 className="h-5 w-5 animate-spin text-violet-600 dark:text-violet-400" />}
              {isMerging && <Loader2 className="h-5 w-5 animate-spin text-cyan-600 dark:text-cyan-400" />}
              {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {isFailed && <AlertTriangle className="h-5 w-5 text-red-500" />}

              <span className="text-sm font-semibold text-neutral-900 md:text-base dark:text-white">
                {isPending && 'Queuing download job...'}
                {isDownloading && `Downloading in ${formatLabel}...`}
                {isMerging && 'Merging audio and video streams (FFmpeg)...'}
                {isCompleted && 'Download Completed!'}
                {isFailed && 'Download Failed'}
              </span>
            </div>

            {isCompleted && (
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Success
              </span>
            )}
            {isFailed && (
              <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                Failed
              </span>
            )}
          </div>

          {/* Progress Bar & Percentage */}
          {!isFailed && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <span>Progress</span>
                <span className="text-neutral-900 dark:text-white">{Math.round(percent)}%</span>
              </div>
              <Progress value={percent} />
            </div>
          )}

          {/* Stats (Speed & ETA) */}
          {isDownloading && (
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-center dark:border-white/5 dark:bg-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Speed</span>
                <span className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-white">{speed}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Time Remaining</span>
                <span className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-white">{eta}</span>
              </div>
            </div>
          )}

          {isMerging && (
            <div className="animate-pulse rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-3 text-center">
              <span className="text-xs text-cyan-700 dark:text-cyan-300">
                This may take a moment for large 1080p+ files as FFmpeg joins the streams.
              </span>
            </div>
          )}

          {/* Error Message */}
          {isFailed && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-700 md:text-sm dark:text-red-300" role="alert">
              {error || 'An unexpected error occurred during the download process.'}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-2">
            {(isCompleted || isFailed) && (
              <Button variant="outline" size="sm" onClick={onClose} className="h-9 rounded-xl px-4">
                Close
              </Button>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
