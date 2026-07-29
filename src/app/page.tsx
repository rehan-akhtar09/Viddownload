'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VideoMetadata, HistoryItem } from '@/types';
import AnalyzeForm from '@/components/AnalyzeForm';
import VideoDetails from '@/components/VideoDetails';
import DownloadProgress from '@/components/DownloadProgress';
import HistoryList from '@/components/HistoryList';

export default function Home() {
  const [activeMetadata, setActiveMetadata] = useState<VideoMetadata | null>(null);
  const [initialUrl, setInitialUrl] = useState('');
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('download-history', []);

  // Active download task states
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [formatLabel, setFormatLabel] = useState('');
  const [taskPercent, setTaskPercent] = useState(0);
  const [taskSpeed, setTaskSpeed] = useState('');
  const [taskEta, setTaskEta] = useState('');
  const [taskStatus, setTaskStatus] = useState<'pending' | 'downloading' | 'merging' | 'completed' | 'failed'>('pending');
  const [taskError, setTaskError] = useState<string>('');

  // Handle analysis events
  const handleAnalyzeStart = () => {
    setActiveMetadata(null);
    setInitialUrl('');
    setActiveTaskId(null);
  };

  const handleAnalyzeSuccess = (metadata: VideoMetadata) => {
    setActiveMetadata(metadata);
  };

  const handleAnalyzeError = (error: string) => {
    // Error is displayed inside AnalyzeForm itself
  };

  // Trigger download process
  const handleDownload = async (format: string, label: string) => {
    if (!activeMetadata) return;

    // Reset task states
    setFormatLabel(label);
    setTaskPercent(0);
    setTaskSpeed('0 MB/s');
    setTaskEta('Starting...');
    setTaskStatus('pending');
    setTaskError('');
    setActiveTaskId(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: activeMetadata.url,
          format,
          title: activeMetadata.title,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start download');
      }

      // Track taskId
      setActiveTaskId(data.taskId);
    } catch (err: unknown) {
      setTaskStatus('failed');
      setTaskError(
        err instanceof Error ? err.message : 'Failed to initiate download job.'
      );
    }
  };

  // Poll active task status without overlapping requests. Any API failure is
  // terminal for this task, preventing an endless console-error loop.
  useEffect(() => {
    if (
      !activeTaskId ||
      !['pending', 'downloading', 'merging'].includes(taskStatus)
    ) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const pollStatus = async () => {
      try {
        const ctrl = new AbortController();
        const tId = setTimeout(() => ctrl.abort(), 15000);

        const res = await fetch(
          `/api/download/status?taskId=${encodeURIComponent(activeTaskId)}`,
          { cache: 'no-store', signal: ctrl.signal }
        );
        clearTimeout(tId);
        const task = await res.json();

        if (!res.ok) {
          throw new Error(task.error || 'Failed to retrieve download status.');
        }
        if (cancelled) return;

        setTaskPercent(task.percent || 0);
        setTaskSpeed(task.speed || '0 MB/s');
        setTaskEta(task.eta || 'Calculating...');
        setTaskStatus(task.status);
        setTaskError(task.error || '');

        if (task.status === 'completed') {
          const newItem: HistoryItem = {
            id: activeTaskId,
            thumbnail: activeMetadata?.thumbnail || '',
            title: activeMetadata?.title || 'YouTube Download',
            format: formatLabel,
            date: new Date().toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            url: activeMetadata?.url || '',
          };

          setHistory((prev) => {
            const filtered = prev.filter((item) => item.id !== activeTaskId);
            return [newItem, ...filtered].slice(0, 20);
          });

          window.location.href = `/api/download/file?taskId=${encodeURIComponent(activeTaskId)}`;
          return;
        }

        if (task.status !== 'failed') {
          timeoutId = setTimeout(pollStatus, 1000);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setTaskStatus('failed');
        setTaskError(
          err instanceof Error ? err.message : 'Failed to retrieve download status.'
        );
      }
    };

    void pollStatus();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeTaskId, taskStatus, activeMetadata, formatLabel, setHistory]);

  const handleDownloadAgain = (url: string) => {
    setInitialUrl(url);
    // Scroll window smoothly to input
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter(item => item.id !== id));
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your download history?')) {
      setHistory([]);
    }
  };

  return (
    <div className="bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col items-center justify-start p-4 md:p-8 relative overflow-x-hidden selection:bg-red-500/30 selection:text-red-200 transition-colors duration-300">

      {/* Premium Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-red-500/5 dark:bg-red-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-amber-400/5 dark:bg-amber-500/10 blur-[120px] pointer-events-none" />

      {/* Main Wrapper */}
      <div className="w-full max-w-4xl z-10 space-y-8 md:space-y-12">

  {/* Hero Section */}
        <section className="text-center space-y-4 pt-4 md:pt-8">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-neutral-900 dark:text-white">
            Download <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-500">Videos</span> from Any Site
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto text-sm md:text-base font-medium">
            Fast, premium, and zero ads. Download videos from YouTube, TikTok, Instagram, Twitter, Facebook, and more.
          </p>
        </section>

        {/* Action Panel */}
        <section className="space-y-6">
          <AnalyzeForm
            onAnalyzeSuccess={handleAnalyzeSuccess}
            onAnalyzeStart={handleAnalyzeStart}
            onAnalyzeError={handleAnalyzeError}
            initialUrl={initialUrl}
          />

          {/* Active Download Progress Bar */}
          {activeTaskId && (
            <DownloadProgress
              formatLabel={formatLabel}
              percent={taskPercent}
              speed={taskSpeed}
              eta={taskEta}
              status={taskStatus}
              error={taskError}
              onClose={() => setActiveTaskId(null)}
            />
          )}

          {/* Video Analysis Result Details */}
          {activeMetadata && (
            <VideoDetails
              metadata={activeMetadata}
              onDownload={handleDownload}
              activeDownloadFormat={activeTaskId ? formatLabel : undefined}
            />
          )}
        </section>

        {/* Bottom Panel: History & Search */}
        <section className="border-t border-black/10 dark:border-white/10 pt-8 md:pt-12">
          <HistoryList
            items={history}
            onDownloadAgain={handleDownloadAgain}
            onRemoveItem={handleRemoveHistoryItem}
            onClearHistory={handleClearHistory}
          />
        </section>



      </div>
    </div>
  );
}
