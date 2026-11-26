'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VideoMetadata, HistoryItem } from '@/types';

import AnalyzeForm from '@/components/AnalyzeForm';
import VideoDetails from '@/components/VideoDetails';
import DownloadProgress from '@/components/DownloadProgress';
import HistoryList from '@/components/HistoryList';
import Link from 'next/link';
import {
  Calendar, ArrowRight, FileText, Link2, Sparkles, Download,
  Video, Music, Shield, History, Zap, Globe,
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryName: string | null;
  createdAt?: string;
}

const PLATFORMS = [
  'YouTube', 'TikTok', 'Instagram', 'Twitter / X', 'Facebook',
  'Vimeo', 'Dailymotion', 'Twitch', 'SoundCloud', 'Reddit',
];

const STEPS = [
  {
    icon: Link2,
    title: 'Copy Video Link',
    text: 'Copy the URL of a publicly accessible video from a supported website.',
  },
  {
    icon: Sparkles,
    title: 'Paste and Analyze',
    text: 'Paste your link into the downloader and let the application analyze the available media.',
  },
  {
    icon: Download,
    title: 'Choose and Download',
    text: 'Select an available format and quality, then save your file.',
  },
];

const FEATURES = [
  {
    icon: Link2,
    title: 'Simple URL-Based Downloading',
    text: 'One link is all it takes — paste it in and the available media is analyzed for you.',
  },
  {
    icon: Video,
    title: 'Available Video Qualities',
    text: 'Choose from the MP4 qualities the source actually offers, from 360p up to the highest available.',
  },
  {
    icon: Music,
    title: 'Audio Formats',
    text: 'Save just the sound as an MP3 at 128, 192, or 320 kbps.',
  },
  {
    icon: Shield,
    title: 'No Registration Needed',
    text: 'No account, no sign-up — open the page and start downloading.',
  },
  {
    icon: History,
    title: 'Local Download History',
    text: 'Your recent downloads are kept in your browser for quick access, nothing is uploaded.',
  },
  {
    icon: Zap,
    title: 'Fast URL Analysis',
    text: 'Links are analyzed in seconds, showing title, duration, and formats before you download.',
  },
];

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
    <div className="relative flex flex-col items-center justify-start overflow-x-hidden bg-neutral-50 p-4 text-neutral-900 transition-colors duration-300 selection:bg-violet-600/25 md:p-8 dark:bg-neutral-950 dark:text-neutral-100">

      {/* Subtle background accents */}
      <div className="pointer-events-none absolute left-1/2 top-[-20%] aspect-square w-[70%] -translate-x-1/2 rounded-full bg-violet-600/[0.07] blur-[130px] dark:bg-violet-600/10" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-15%] right-[-10%] aspect-square w-[40%] rounded-full bg-cyan-500/[0.05] blur-[120px] dark:bg-cyan-500/[0.07]" aria-hidden="true" />

      {/* Main Wrapper */}
      <div className="z-10 w-full max-w-4xl space-y-14 md:space-y-20">

        {/* Hero Section */}
        <section className="space-y-5 pt-6 text-center md:pt-12">
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-violet-600/20 bg-violet-600/[0.07] px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Free to use — no registration
          </span>
          <h1 className="animate-fade-up animate-fade-up-1 text-4xl font-black leading-[1.05] tracking-tight text-neutral-900 md:text-6xl dark:text-white">
            Your Videos. Your Way.
            <span className="block bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
              Download with Ease.
            </span>
          </h1>
          <p className="animate-fade-up animate-fade-up-2 mx-auto max-w-xl text-sm font-medium text-neutral-500 md:text-base dark:text-neutral-400">
            Download publicly accessible videos from supported websites with a simple link.
            Paste, analyze, choose your available format, and save.
          </p>
        </section>

        {/* Action Panel */}
        <section className="animate-fade-up animate-fade-up-3 space-y-6" aria-label="Video downloader">
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

        {/* Supported Platforms */}
        <section id="supported-platforms" className="scroll-mt-24 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="flex items-center justify-center gap-2.5 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              <Globe className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              Supported Platforms
            </h2>
            <p className="mx-auto max-w-md text-sm text-neutral-500 dark:text-neutral-400">
              One downloader for the sites you already use — powered by yt-dlp, with support for 1,700+ websites.
            </p>
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-2.5" aria-label="Popular supported platforms">
            {PLATFORMS.map((name) => (
              <li
                key={name}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/40 hover:text-violet-700 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:text-violet-300"
              >
                {name}
              </li>
            ))}
            <li>
              <Link
                href="/supported-sites"
                className="inline-flex items-center gap-1 rounded-full border border-violet-600/25 bg-violet-600/[0.07] px-4 py-2 text-sm font-semibold text-violet-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-600/10 dark:text-violet-300"
              >
                View all sites <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          </ul>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="scroll-mt-24 space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">How It Works</h2>
            <p className="mx-auto max-w-md text-sm text-neutral-500 dark:text-neutral-400">
              From link to saved file in three simple steps.
            </p>
          </div>
          <ol className="relative grid gap-4 md:grid-cols-3 md:gap-6">
            <div className="pointer-events-none absolute left-0 right-0 top-10 hidden border-t border-dashed border-neutral-300 md:block dark:border-white/10" aria-hidden="true" />
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="relative rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-neutral-900"
              >
                <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 shadow-lg shadow-violet-600/20">
                  <step.icon className="h-6 w-6 text-white" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-[11px] font-bold text-violet-700 dark:border-white/10 dark:bg-neutral-950 dark:text-violet-300">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-1.5 font-bold text-neutral-900 dark:text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section className="space-y-8" aria-label="Features">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Why Use All Video Downloader</h2>
            <p className="mx-auto max-w-md text-sm text-neutral-500 dark:text-neutral-400">
              The real capabilities of the tool — nothing more, nothing dressed up.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-md dark:border-white/10 dark:bg-neutral-900"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/10 transition-colors group-hover:bg-violet-600/15">
                  <feature.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="mb-1 text-sm font-bold text-neutral-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Download History */}
        <section id="history" className="scroll-mt-24 border-t border-neutral-200 pt-10 md:pt-14 dark:border-white/10">
          <HistoryList
            items={history}
            onDownloadAgain={handleDownloadAgain}
            onRemoveItem={handleRemoveHistoryItem}
            onClearHistory={handleClearHistory}
          />
        </section>

        {/* Latest Blog Posts */}
        {recentBlogs.length > 0 && (
          <section className="border-t border-neutral-200 pt-10 md:pt-14 dark:border-white/10">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/10">
                  <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Latest from Blog</h2>
              </div>
              <Link href="/blog" className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4">
              {recentBlogs.map((post) => (
                <Link
                  key={post.id}
                  href={'/blog/' + post.slug}
                  className="group block rounded-2xl border border-neutral-200 bg-white p-4 transition-all hover:border-violet-500/30 hover:shadow-md dark:border-white/10 dark:bg-neutral-900"
                >
                  <div className="mb-1.5 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {post.categoryName && (
                      <span className="rounded-full bg-violet-600/10 px-1.5 py-0.5 font-medium text-violet-700 dark:text-violet-300">
                        {post.categoryName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 transition-colors group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                    {post.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
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
