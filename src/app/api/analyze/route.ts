import { NextResponse } from 'next/server';
import { getVideoBasicInfo } from '@/lib/yt-dlp';

export const runtime = 'nodejs';
export const maxDuration = 60;

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00';
  const wholeSeconds = Math.floor(seconds);
  const hrs = Math.floor(wholeSeconds / 3600);
  const mins = Math.floor((wholeSeconds % 3600) / 60);
  const secs = wholeSeconds % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(views: number): string {
  if (!views) return '0';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1).replace('.0', '')}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1).replace('.0', '')}K`;
  return views.toLocaleString();
}

function formatDate(value: string): string {
  if (!/^\d{8}$/.test(value)) return value || 'Unknown';
  const year = value.slice(0, 4);
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(Number(year), month - 1, day));
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL. Please enter a public video link.' }, { status: 400 });
    }

    const info = await getVideoBasicInfo(body.url);
    return NextResponse.json({
      title: info.title,
      channel: info.uploader,
      duration: formatDuration(info.duration),
      uploadDate: formatDate(info.upload_date),
      viewCount: formatViews(info.view_count),
      thumbnail: info.thumbnail,
      url: body.url.trim(),
      availableQualities: info.availableQualities,
      isShort: info.duration > 0 && info.duration <= 60 && info.width > 0 && info.height > info.width,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to analyze this URL.';
    console.error('Analyze API error:', message);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
