'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VideoMetadata, HistoryItem } from '@/types';

import AnalyzeForm from '@/components/AnalyzeForm';
import VideoDetails from '@/components/VideoDetails';
import DownloadProgress from '@/components/DownloadProgress';
import HistoryList from '@/components/HistoryList';
import Link from 'next/link';
import { Calendar, ArrowRight, FileText } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryName: string | null;
  createdAt?: string;
}

export default function Home() {
  const [activeMetadata, setActiveMetadata] = useState<VideoMetadata | null>(null);
  const [initialUrl, setInitialUrl] = useState('');
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('download-history', []);

  // Active download task states
  const [activeFormat, setActiveFormat] = useState<string | undefined>();
  const [formatLabel, setFormatLabel] = useState('');
  const [taskPercent, setTaskPercent] = useState(0);
  const [taskSpeed, setTaskSpeed] = useState('');
  const [taskEta, setTaskEta] = useState('');
  const [taskStatus, setTaskStatus] = useState<'pending' | 'downloading' | 'merging' | 'completed' | 'failed'>('pending');
  const [taskError, setTaskError] = useState<string>('');

  const [recentBlogs, setRecentBlogs] = useState<BlogPost[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/blogs');
        const data = await res.json();
        setRecentBlogs(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch { }
    })();
  }, []);

  const formatDate = (ts?: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  };

  // Handle analysis events
  const handleAnalyzeStart = () => {
    setActiveMetadata(null);
    setInitialUrl('');
    setTaskStatus('pending');
    setTaskError('');
  };

  const handleAnalyzeSuccess = (metadata: VideoMetadata) => {
    setActiveMetadata(metadata);
  };

  const handleAnalyzeError = (error: string) => {
    // Error is displayed inside AnalyzeForm itself
  };

  // Keep extraction and file delivery in one request. Serverless route handlers
  // cannot reliably share an in-memory task registry between polling requests.
  const handleDownload = async (format: string, label: string) => {
    if (!activeMetadata) return;

    setActiveFormat(format);
    setFormatLabel(label);
    setTaskPercent(10);
    setTaskSpeed('Preparing');
    setTaskEta('This may take a minute');
    setTaskStatus('downloading');
    setTaskError('');

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: activeMetadata.url,
          format,
          title: activeMetadata.title,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || 'The server could not download this media.');
      }

      setTaskPercent(95);
      setTaskSpeed('Finalizing');
      setTaskEta('Almost ready');

      const contentType = res.headers.get('Content-Type') || '';
      if (contentType.startsWith('application/json')) {
        const data = await res.json() as { downloadUrl?: string; error?: string };
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        } else {
          throw new Error(data.error || 'No download URL received');
        }
      } else {
        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition') || '';
        const utf8Name = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
        const fallbackName = disposition.match(/filename="([^"]+)"/i)?.[1];
        const fileName = utf8Name ? decodeURIComponent(utf8Name) : (fallbackName || 'download.mp4');
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      }

      setTaskStatus('completed');
      setActiveFormat(undefined);
      setTaskPercent(100);
      setTaskSpeed('Complete');
      setTaskEta('00:00');

      const historyId = `${Date.now()}-${format}`;
      const newItem: HistoryItem = {
        id: historyId,
        thumbnail: activeMetadata.thumbnail || '',
        title: activeMetadata.title || 'Video Download',
        format: label,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        url: activeMetadata.url,
      };
      setHistory((prev) => [newItem, ...prev].slice(0, 20));
    } catch (err: unknown) {
      setTaskStatus('failed');
      setActiveFormat(undefined);
      setTaskPercent(0);
      setTaskError(err instanceof Error ? err.message : 'Failed to download this media.');
    }
  };

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
          {(taskStatus !== 'pending' || taskError) && (
            <DownloadProgress
              formatLabel={formatLabel}
              percent={taskPercent}
              speed={taskSpeed}
              eta={taskEta}
              status={taskStatus}
              error={taskError}
              onClose={() => {
                setTaskStatus('pending');
                setTaskError('');
              }}
            />
          )}

          {/* Video Analysis Result Details */}
          {activeMetadata && (
            <VideoDetails
              metadata={activeMetadata}
              onDownload={handleDownload}
              activeDownloadFormat={activeFormat}
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

        {/* Latest Blog Posts */}
        {recentBlogs.length > 0 && (
          <section className="border-t border-black/10 dark:border-white/10 pt-8 md:pt-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-red-600/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Latest from Blog</h2>
              </div>
              <Link href="/blog" className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:underline font-medium">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4">
              {recentBlogs.map((post) => (
                <Link
                  key={post.id}
                  href={'/blog/' + post.slug}
                  className="block p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 hover:border-red-500/30 transition-all group"
                >
                  <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                    {post.categoryName && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 font-medium">
                        {post.categoryName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                    {post.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
