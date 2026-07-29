import { NextResponse } from 'next/server';

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

async function getDirectUrlWithYtDlp(url: string, format: string): Promise<string | null> {
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

async function getDirectUrlFromPage(url: string): Promise<string | null> {
  const platform = detectPlatform(url);

  if (platform === 'youtube') {
    try {
      const htmlRes = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const html = await htmlRes.text();

      const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
      if (playerResponseMatch) {
        const playerResponse = JSON.parse(playerResponseMatch[1]);
        const formats = playerResponse.streamingData?.formats || [];
        const adaptiveFormats = playerResponse.streamingData?.adaptiveFormats || [];
        const allFormats = [...formats, ...adaptiveFormats].filter((f: any) => f.url);
        if (allFormats.length > 0) {
          const sorted = allFormats.sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
          return sorted[0].url;
        }
      }
    } catch {}
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = body.url as string | undefined;
    const format = (body.format as string) || 'highest';
    const title = (body.title as string) || 'video';

    if (!url) {
      return NextResponse.json({ error: 'Missing required parameter: url.' }, { status: 400 });
    }

    // Try yt-dlp first for direct download URL
    const ytDlpUrl = await getDirectUrlWithYtDlp(url, format);
    if (ytDlpUrl) {
      return NextResponse.json({
        taskId: 'direct',
        status: 'completed',
        percent: 100,
        downloadUrl: ytDlpUrl,
        title,
        format,
      });
    }

    // Fallback: try to extract from page HTML
    const pageUrl = await getDirectUrlFromPage(url);
    if (pageUrl) {
      return NextResponse.json({
        taskId: 'direct',
        status: 'completed',
        percent: 100,
        downloadUrl: pageUrl,
        title,
        format,
      });
    }

    // Final fallback: open the source URL
    return NextResponse.json({
      taskId: 'fallback',
      status: 'completed',
      percent: 100,
      downloadUrl: url,
      title,
      format,
    });
  } catch (err: any) {
    console.error('Download API error:', err);
    return NextResponse.json({
      taskId: 'fallback',
      status: 'completed',
      percent: 100,
      downloadUrl: '',
      title: 'video',
      format: 'highest',
    });
  }
}
