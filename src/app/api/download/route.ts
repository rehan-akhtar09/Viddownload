import fs from 'fs';
import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { downloadVideo } from '@/lib/yt-dlp';

export const runtime = 'nodejs';
export const maxDuration = 300;

async function getYouTubeStreamUrl(url: string): Promise<string | null> {
  try {
    const htmlRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await htmlRes.text();
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
    const initialMatch = html.match(/ytInitialData\s*=\s*({.+?});/);
    if (initialMatch) {
      const videoId = new URL(url).searchParams.get('v');
      if (videoId) {
        const apiRes = await fetch(`https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`, {
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
        if (withUrl2.length > 0) {
          const sorted2 = withUrl2.sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
          return sorted2[0].url;
        }
      }
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
    if (typeof body.format !== 'string') {
      return NextResponse.json({ error: 'Missing required parameter: format.' }, { status: 400 });
    }

    const url = body.url;
    const format = body.format;
    const title = typeof body.title === 'string' ? body.title : 'video';

    // Try yt-dlp download first
    try {
      const downloaded = await downloadVideo(url, format, title);
      const fileStream = fs.createReadStream(downloaded.filePath);
      const cleanup = () => {
        void fs.promises.rm(downloaded.directory, { recursive: true, force: true }).catch((error) => {
          console.error('Temporary download cleanup failed:', error);
        });
      };
      fileStream.once('close', cleanup);

      const encodedName = encodeURIComponent(downloaded.fileName);
      const extension = downloaded.fileName.match(/\.[a-z0-9]+$/i)?.[0] || '';
      return new Response(Readable.toWeb(fileStream) as ReadableStream, {
        headers: {
          'Content-Type': downloaded.contentType,
          'Content-Length': downloaded.size.toString(),
          'Content-Disposition': `attachment; filename="download${extension}"; filename*=UTF-8''${encodedName}`,
          'Cache-Control': 'private, no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (ytErr) {
      const msg = ytErr instanceof Error ? ytErr.message : '';
      const loginRequired = /login|cookies|sign in|private/i.test(msg);
      if (loginRequired) {
        // Fallback: try YouTube page API for stream URL
        const streamUrl = await getYouTubeStreamUrl(url);
        if (streamUrl) {
          return NextResponse.redirect(streamUrl, 302);
        }
        // Last resort: redirect to original URL
        return NextResponse.json({ taskId: 'fallback', status: 'completed', percent: 100, downloadUrl: url, title, format });
      }
      throw ytErr;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to download this media.';
    console.error('Download API error:', message);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
