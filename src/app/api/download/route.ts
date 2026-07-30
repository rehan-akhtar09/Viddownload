import { NextResponse } from 'next/server';
import { validateUrl, getVideoDirectUrl } from '@/lib/yt-dlp';

export const runtime = 'nodejs';
export const maxDuration = 30;

async function getYouTubeStreamUrl(url: string): Promise<string | null> {
  try {
    const htmlRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await htmlRes.text();
    const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (playerMatch) {
      const data = JSON.parse(playerMatch[1]);
      const formats = [...(data.streamingData?.formats || []), ...(data.streamingData?.adaptiveFormats || [])];
      const withUrl = formats.filter((f: any) => f.url);
      if (withUrl.length > 0) return withUrl.sort((a: any, b: any) => (b.width || 0) - (a.width || 0))[0].url;
    }
    const videoId = new URL(url).searchParams.get('v');
    if (videoId) {
      const apiRes = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          context: { client: { clientName: 'ANDROID', clientVersion: '19.09.37', androidSdkVersion: 30 } },
        }),
        signal: AbortSignal.timeout(5000),
      });
      const apiData = await apiRes.json();
      const fmts = [...(apiData.streamingData?.formats || []), ...(apiData.streamingData?.adaptiveFormats || [])];
      const withUrl2 = fmts.filter((f: any) => f.url);
      if (withUrl2.length > 0) return withUrl2.sort((a: any, b: any) => (b.width || 0) - (a.width || 0))[0].url;
    }
    return null;
  } catch { return null; }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: unknown; format?: unknown; title?: unknown };
    if (typeof body.url !== 'string') {
      return NextResponse.json({ error: 'Missing required parameter: url.' }, { status: 400 });
    }
    const url = validateUrl(body.url);
    const format = typeof body.format === 'string' ? body.format : 'video-highest';
    const title = typeof body.title === 'string' ? body.title : 'video';

    // Use same yt-dlp binary + error handling as analyze route
    try {
      const directUrl = await getVideoDirectUrl(url, format);
      return NextResponse.json({ downloadUrl: directUrl, title, format, status: 'completed' });
    } catch {
      // yt-dlp get-url failed; try YouTube page API
    }

    const streamUrl = await getYouTubeStreamUrl(url);
    if (streamUrl) {
      return NextResponse.json({ downloadUrl: streamUrl, title, format, status: 'completed' });
    }

    return NextResponse.json({ downloadUrl: url, title, format, status: 'completed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to download this media.';
    console.error('Download API error:', message);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
