'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Clipboard, AlertCircle, Loader2, Sparkles, Search, Video, Globe, CheckCircle2 } from 'lucide-react';
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

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setStatusIndex(0);
    onAnalyzeStart();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
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
        ? 'Request timed out. The server took too long to respond.'
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
      <form onSubmit={handleAnalyze} className="relative flex flex-col md:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <Input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="Paste any video URL (YouTube, TikTok, Instagram, Twitter, Facebook...) or Shorts link here..."
            disabled={loading}
            className="pr-12 border-white/10 focus:border-red-500"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePaste}
            disabled={loading}
            className="absolute right-1 top-1 text-neutral-400 hover:text-white"
            title="Paste from clipboard"
          >
            <Clipboard className="h-5 w-5" />
          </Button>
        </div>

        <Button
          type="submit"
          variant="premium"
          disabled={loading || !url.trim()}
          className="h-12 px-6 font-semibold shrink-0"
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

      {/* Loading skeleton with status indicator */}
      {loading && (
        <div className="mt-6 p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-4 mb-5">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <CurrentIcon className="h-5 w-5 text-red-400 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-200">{STATUS_STEPS[statusIndex].text}</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-700"
                  style={{ width: `${((statusIndex + 1) / STATUS_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          {/* Skeleton thumbnail + text */}
          <div className="flex gap-4">
            <div className="w-24 h-16 rounded-lg bg-neutral-800 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="h-3.5 w-3/4 rounded-full bg-neutral-800 animate-pulse" />
              <div className="h-3 w-1/2 rounded-full bg-neutral-800/60 animate-pulse" />
              <div className="h-3 w-1/3 rounded-full bg-neutral-800/40 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 flex items-start gap-2.5 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Analysis Failed:</span> {errorMsg}
          </div>
        </div>
      )}
    </div>
  );
}
