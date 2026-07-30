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
  if (hrs > 0) return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
  return date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
}

function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('m.youtube.com')) return 'youtube';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('instagram.com') || u.includes('instagr.am')) return 'instagram';
  if (u.includes('facebook.com') || u.includes('fb.com') || u.includes('fb.watch')) return 'facebook';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
  if (u.includes('vimeo.com')) return 'vimeo';
  if (u.includes('dailymotion.com') || u.includes('dai.ly')) return 'dailymotion';
  return 'unknown';
}

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { signal: controller.signal }); }
  finally { clearTimeout(id); }
}

async function analyzeViaOembed(url: string, platform: string) {
  try {
    let oembedUrl: string;
    if (platform === 'youtube') oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    else if (platform === 'tiktok') oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    else if (platform === 'instagram') oembedUrl = `https://www.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    else if (platform === 'vimeo') oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
    else oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;

    const res = await fetchWithTimeout(oembedUrl);
    if (!res.ok) throw new Error('oembed failed');
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    return {
      title: data.title || 'Video',
      channel: data.author_name || 'Unknown',
      duration: data.duration ? formatDuration(data.duration) : '00:00',
      uploadDate: data.upload_date || 'Unknown',
      viewCount: formatViews(data.view_count || 0),
      thumbnail: data.thumbnail_url || data.thumbnail || '',
      url,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest': true },
      isShort: platform === 'tiktok' || platform === 'instagram',
    };
  } catch { return null; }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== 'string' || !body.url.trim()) {
      return NextResponse.json({ error: 'Invalid URL. Please enter a public video link.' }, { status: 400 });
    }

    const url = body.url.trim();

    // Try yt-dlp first
    try {
      const info = await getVideoBasicInfo(url);
      return NextResponse.json({
        title: info.title,
        channel: info.uploader,
        duration: formatDuration(info.duration),
        uploadDate: formatDate(info.upload_date),
        viewCount: formatViews(info.view_count),
        thumbnail: info.thumbnail,
        url,
        availableQualities: info.availableQualities,
        isShort: info.duration > 0 && info.duration <= 60 && info.width > 0 && info.height > info.width,
      });
    } catch (ytErr) {
      const msg = ytErr instanceof Error ? ytErr.message : '';
      // If yt-dlp says login required, fall back to oembed
      const loginRequired = /login|cookies|sign in|private/i.test(msg);
      if (!loginRequired) throw ytErr;
    }

    // Fallback: oembed/noembed
    const platform = detectPlatform(url);
    const oembed = await analyzeViaOembed(url, platform);
    if (oembed) return NextResponse.json(oembed);

    // Last resort
    return NextResponse.json({
      title: url,
      channel: 'Unknown',
      duration: '00:00',
      uploadDate: 'Unknown',
      viewCount: '0',
      thumbnail: '',
      url,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest': true },
      isShort: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to analyze this URL.';
    console.error('Analyze API error:', message);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
