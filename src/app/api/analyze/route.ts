import { NextResponse } from 'next/server';
import { getVideoBasicInfo, parseYoutubeUrl } from '@/lib/yt-dlp';

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

    // Parse + validate via URL API
    let parsed;
    try {
      parsed = parseYoutubeUrl(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 },
      );
    }

    // Fetch basic metadata only (fast path — no format extraction)
    const info = await getVideoBasicInfo(parsed.cleanUrl);

    // All standard qualities are assumed available; yt-dlp auto-fallsback
    // during download if a specific resolution is missing.
    const availableQualities = {
      '360p': true,
      '480p': true,
      '720p': true,
      '1080p': true,
      'highest': true,
    };

    const isShort = parsed.isShort || (info.duration <= 60 && info.width > 0 && info.height > info.width);

    const elapsed = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[perf] analyze: ${elapsed}ms for ${parsed.videoId}`);
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
  if (msg.includes('timed out')) return 'Request timed out. YouTube is not responding.';
  if (msg.includes('private')) return 'This video is private.';
  if (msg.includes('age-restricted')) return 'This video is age-restricted.';
  if (msg.includes('unavailable') || msg.includes('deleted')) return 'This video is unavailable or has been deleted.';
  if (msg.includes('bot')) return 'YouTube blocked the request.';
  if (msg.includes('Live') || msg.includes('live')) return 'Live streams are not supported.';
  return msg || 'An unexpected error occurred.';
}
