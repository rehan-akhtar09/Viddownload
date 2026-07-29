import { NextResponse } from 'next/server';
import { getVideoBasicInfo, validateUrl } from '@/lib/yt-dlp';

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr || 'Unknown';
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = parseInt(month) - 1;
  if (monthIndex >= 0 && monthIndex < 12) {
    return `${months[monthIndex]} ${parseInt(day)}, ${year}`;
  }
  return `${year}-${month}-${day}`;
}

function formatViews(views: number): string {
  if (!views) return '0';
  if (views >= 1_000_000_000) return (views / 1_000_000_000).toFixed(1).replace('.0', '') + 'B';
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1).replace('.0', '') + 'K';
  return views.toLocaleString();
}

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const { url } = await request.json();

    let validUrl: string;
    try {
      validUrl = validateUrl(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL. Please enter a valid video link.' },
        { status: 400 },
      );
    }

    const info = await getVideoBasicInfo(validUrl);

    const availableQualities = {
      '360p': true,
      '480p': true,
      '720p': true,
      '1080p': true,
      'highest': true,
    };

    const isShort = info.duration > 0 && info.duration <= 60 && info.width > 0 && info.height > info.width;

    const elapsed = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[perf] analyze: ${elapsed}ms`);
    }

    return NextResponse.json({
      title: info.title,
      channel: info.uploader,
      duration: formatDuration(info.duration),
      uploadDate: formatDate(info.upload_date),
      viewCount: formatViews(info.view_count),
      thumbnail: info.thumbnail,
      url: url,
      availableQualities,
      isShort,
    });
  } catch (err: any) {
    console.error('Analyze API error:', err);
    const message = mapError(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mapError(err: any): string {
  const msg = err?.message || '';
  if (msg.includes('timed out')) return 'Request timed out. The server took too long to respond.';
  if (msg.includes('private')) return 'This video is private.';
  if (msg.includes('age-restricted')) return 'This video is age-restricted.';
  if (msg.includes('unavailable') || msg.includes('deleted')) return 'This video is unavailable or has been deleted.';
  if (msg.includes('bot') || msg.includes('blocked')) return 'The site blocked the request.';
  if (msg.includes('Unsupported URL')) return 'Unsupported URL. Please check the link.';
  if (msg.includes('403')) return 'Access forbidden. The video may be region-restricted.';
  if (msg.includes('404')) return 'Video not found.';
  return msg || 'An unexpected error occurred.';
}
