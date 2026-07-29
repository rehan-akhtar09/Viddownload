import { NextResponse } from 'next/server';
import { activeTasks, startDownload } from '@/lib/yt-dlp';

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

async function getYtDlpDirectUrl(url: string, format: string): Promise<string | null> {
  try {
    const { exec } = await import('yt-dlp-exec');
    const formatMap: Record<string, string> = {
      'highest': 'best',
      '1080p': 'bestvideo[height<=1080]+bestaudio/best',
      '720p': 'bestvideo[height<=720]+bestaudio/best',
      '480p': 'bestvideo[height<=480]+bestaudio/best',
      '360p': 'bestvideo[height<=360]+bestaudio/best',
    };
    const formatArg = formatMap[format] || 'best';
    const res = await exec(url, {
      getUrl: true,
      format: formatArg,
      noPlaylist: true,
      socketTimeout: 15,
      noWarnings: true,
    });
    const downloadUrl = res.stdout?.trim();
    if (downloadUrl && downloadUrl.startsWith('http')) {
      return downloadUrl;
    }
    return null;
  } catch {
    return null;
  }
}

async function getYouTubeStreamUrl(url: string): Promise<string | null> {
  try {
    const htmlRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await htmlRes.text();

    // Try ytInitialPlayerResponse
    const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (playerMatch) {
      const data = JSON.parse(playerMatch[1]);
      const formats = [...(data.streamingData?.formats || []), ...(data.streamingData?.adaptiveFormats || [])];
      const withUrl = formats.filter((f: any) => f.url);
      if (withUrl.length > 0) {
        const sorted = withUrl.sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
        return sorted[0].url;
      }
    }

    // Try ytInitialData fallback
    const initialMatch = html.match(/ytInitialData\s*=\s*({.+?});/);
    if (initialMatch) {
      const data = JSON.parse(initialMatch[1]);
      const videoId = new URL(url).searchParams.get('v');
      if (videoId) {
        const apiKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
        const apiRes = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            context: {
              client: {
                clientName: 'ANDROID',
                clientVersion: '19.09.37',
                androidSdkVersion: 30,
              },
            },
          }),
          signal: AbortSignal.timeout(5000),
        });
        const apiData = await apiRes.json();
        const fmts = [...(apiData.streamingData?.formats || []), ...(apiData.streamingData?.adaptiveFormats || [])];
        const withUrl2 = fmts.filter((f: any) => f.url);
        if (withUrl2.length > 0) {
          const sorted2 = withUrl2.sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
          return sorted2[0].url;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function getTikTokStreamUrl(url: string): Promise<string | null> {
  try {
    const apiRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await apiRes.json();
    if (data.thumbnail_url) return data.thumbnail_url;
    return url;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let url = '';
  let format = 'highest';
  let title = 'video';

  try {
    const body = await request.json();
    url = (body.url as string) || '';
    format = (body.format as string) || 'highest';
    title = (body.title as string) || 'video';

    if (!url) {
      return NextResponse.json({ error: 'Missing required parameter: url.' }, { status: 400 });
    }

    // Generate unique task ID
    const taskId = 'task_' + Math.random().toString(36).substring(2, 15);

    // Register initial task status
    activeTasks.set(taskId, {
      id: taskId,
      url,
      format,
      percent: 0,
      speed: '0 MB/s',
      eta: 'Starting...',
      status: 'pending',
    });

    // Start background download process asynchronously
    startDownload(taskId, url, format, title);

    // Return the task details immediately so the client can start polling
    return NextResponse.json({
      taskId,
      status: 'pending',
      percent: 0,
    });
  } catch (err: any) {
    console.error('Download initiation error:', err);
    return NextResponse.json({ error: 'Failed to initiate download job: ' + err.message }, { status: 500 });
  }
}
