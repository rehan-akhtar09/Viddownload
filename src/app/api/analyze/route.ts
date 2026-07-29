import { NextResponse } from 'next/server';

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(views: number): string {
  if (!views) return '0';
  if (views >= 1_000_000_000) return (views / 1_000_000_000).toFixed(1).replace('.0', '') + 'B';
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1).replace('.0', '') + 'K';
  return views.toLocaleString();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Unknown';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  return dateStr;
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
  if (u.includes('twitch.tv')) return 'twitch';
  if (u.includes('reddit.com') || u.includes('redd.it')) return 'reddit';
  return 'unknown';
}

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function analyzeWithYtDlp(url: string) {
  try {
    const ytDlpExec = (await import('yt-dlp-exec')).exec;
    const res = await ytDlpExec(url, {
      dumpJson: true,
      noPlaylist: true,
      socketTimeout: 10,
      noWarnings: true,
    });
    const data = JSON.parse(res.stdout);

    return {
      title: data.title || 'Unknown Video',
      channel: data.uploader || data.channel || 'Unknown',
      duration: formatDuration(data.duration || 0),
      uploadDate: data.upload_date ? formatDate(data.upload_date) : 'Unknown',
      viewCount: formatViews(data.view_count || 0),
      thumbnail: data.thumbnail || '',
      url: url,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest': true },
      isShort: data.duration > 0 && data.duration <= 60 && data.width > 0 && data.height > data.width,
    };
  } catch {
    return null;
  }
}

async function analyzeWithOembed(url: string, platform: string) {
  try {
    let oembedUrl = '';
    if (platform === 'youtube') {
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    } else if (platform === 'tiktok') {
      oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    } else if (platform === 'instagram') {
      oembedUrl = `https://www.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    } else if (platform === 'facebook') {
      oembedUrl = `https://graph.facebook.com/v19.0/oembed_video?url=${encodeURIComponent(url)}&format=json`;
    } else if (platform === 'vimeo') {
      oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
    } else if (platform === 'twitter') {
      oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
    } else {
      oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    }

    const oembedRes = await fetchWithTimeout(oembedUrl);
    if (!oembedRes.ok) throw new Error('oembed failed');
    const data = await oembedRes.json();
    if (data.error) throw new Error(data.error);

    return {
      title: data.title || 'Video',
      channel: data.author_name || 'Unknown',
      duration: '00:00',
      uploadDate: 'Unknown',
      viewCount: '0',
      thumbnail: data.thumbnail_url || data.thumbnail || '',
      url: url,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest': true },
      isShort: platform === 'tiktok' || platform === 'instagram' || platform === 'twitter',
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
    } catch {
      return NextResponse.json({ error: 'Invalid URL. Please enter a valid video link.' }, { status: 400 });
    }

    const cleanUrl = url.trim();
    const platform = detectPlatform(cleanUrl);

    // Try yt-dlp first for full metadata
    const ytDlpResult = await analyzeWithYtDlp(cleanUrl);
    if (ytDlpResult) return NextResponse.json(ytDlpResult);

    // Fallback to oembed APIs
    const oembedResult = await analyzeWithOembed(cleanUrl, platform);
    if (oembedResult) return NextResponse.json(oembedResult);

    // Last resort: return basic info
    return NextResponse.json({
      title: cleanUrl,
      channel: 'Unknown',
      duration: '00:00',
      uploadDate: 'Unknown',
      viewCount: '0',
      thumbnail: '',
      url: cleanUrl,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest': true },
      isShort: false,
    });
  } catch (err: any) {
    console.error('Analyze API error:', err);
    return NextResponse.json({ error: 'Failed to analyze video. Please check the URL and try again.' }, { status: 500 });
  }
}
