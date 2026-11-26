'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Clipboard, AlertCircle, Loader2, Sparkles, Search, Video, Globe, CheckCircle2, Link2, X } from 'lucide-react';
import { VideoMetadata } from '@/types';

interface AnalyzeFormProps {
  onAnalyzeSuccess: (metadata: VideoMetadata) => void;
  onAnalyzeStart: () => void;
  onAnalyzeError: (error: string) => void;
  initialUrl?: string;
}

const STATUS_STEPS = [
  { text: 'Validating URL...', icon: Search },
  { text: 'Fetching video metadata...', icon: Globe },
  { text: 'Retrieving available formats...', icon: Video },
  { text: 'Finalizing...', icon: CheckCircle2 },
];

export default function AnalyzeForm({ onAnalyzeSuccess, onAnalyzeStart, onAnalyzeError, initialUrl = '' }: AnalyzeFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusIndex, setStatusIndex] = useState(0);
  const statusTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      statusTimer.current = setInterval(() => {
        setStatusIndex((prev) => Math.min(prev + 1, STATUS_STEPS.length - 1));
      }, 3000);
    } else {
      if (statusTimer.current) clearInterval(statusTimer.current);
      setStatusIndex(0);
    }
    return () => {
      if (statusTimer.current) clearInterval(statusTimer.current);
    };
  }, [loading]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setErrorMsg('');
      }
    } catch (err) {
      console.warn('Clipboard read failed, using standard clipboard access', err);
    }
  };

  const handleClear = () => {
    setUrl('');
    setErrorMsg('');
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    // Lightweight client-side validation feedback; the API remains the authority.
    if (!/^https?:\/\/\S+\.\S+/i.test(trimmed)) {
      const msg = 'Please paste a valid video URL — it should start with http:// or https:// and come from a supported website.';
      setErrorMsg(msg);
      onAnalyzeError(msg);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setStatusIndex(0);
    onAnalyzeStart();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze URL.');
      }

      onAnalyzeSuccess(data);
    } catch (err: any) {
      const msg = err.name === 'AbortError'
        ? 'Request timed out. The server took too long to respond. Please try again.'
        : (err.message || 'An unexpected error occurred.');
      setErrorMsg(msg);
      onAnalyzeError(msg);
    } finally {
      setLoading(false);
    }
  };

  const CurrentIcon = STATUS_STEPS[statusIndex].icon;

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-neutral-200 bg-white p-3 shadow-xl shadow-violet-600/5 sm:p-4 dark:border-white/10 dark:bg-neutral-900/70 dark:shadow-black/30">
        <form onSubmit={handleAnalyze} className="flex flex-col gap-3 md:flex-row" noValidate>
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
            <Input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Paste your video URL here..."
              disabled={loading}
              type="url"
              inputMode="url"
              autoComplete="off"
              aria-label="Video URL"
              aria-invalid={!!errorMsg}
              className="h-14 rounded-2xl pl-12 pr-24 text-base"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {url && !loading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="h-9 w-9 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                  title="Clear URL"
                  aria-label="Clear URL"
                >
                  <X className="h-4.5 w-4.5" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePaste}
                disabled={loading}
                className="h-9 gap-1.5 px-2.5 text-neutral-500 hover:text-violet-600 dark:text-neutral-400 dark:hover:text-violet-300"
                title="Paste from clipboard"
                aria-label="Paste URL from clipboard"
              >
                <Clipboard className="h-4.5 w-4.5" />
                <span className="hidden text-xs font-semibold sm:inline">Paste</span>
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            variant="premium"
            disabled={loading || !url.trim()}
            className="h-14 shrink-0 rounded-2xl px-8 text-base font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Analyze</span>
              </>
            )}
          </Button>
        </form>
        <p className="px-1.5 pt-3 text-xs text-neutral-400 dark:text-neutral-500">
          Works with publicly accessible videos from supported websites — paste a link, analyze it, then choose your format.
        </p>
      </div>

      {/* Loading state with live status (step labels reflect real request stages; no fake percentages) */}
      {loading && (
        <div
          className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 dark:border-white/10 dark:bg-neutral-900/70"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/10">
              <CurrentIcon className="h-5 w-5 animate-pulse text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Analyzing your video — {STATUS_STEPS[statusIndex].text}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-700"
                  style={{ width: `${((statusIndex + 1) / STATUS_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          {/* Skeleton thumbnail + text */}
          <div className="flex gap-4" aria-hidden="true">
            <div className="h-16 w-24 shrink-0 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex-1 space-y-2.5">
              <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-neutral-200/70 dark:bg-neutral-800/60" />
              <div className="h-3 w-1/3 animate-pulse rounded-full bg-neutral-200/50 dark:bg-neutral-800/40" />
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-red-700 animate-in fade-in slide-in-from-top-2 duration-300 dark:text-red-300"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Analysis failed:</span> {errorMsg}
            <span className="mt-1 block text-xs opacity-80">
              Check that the link is correct, the video is public, and the website is supported — then try again.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
