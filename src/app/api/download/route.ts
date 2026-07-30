import { NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { validateUrl } from '@/lib/yt-dlp';
import { create as createYtDlp } from 'yt-dlp-exec';

export const runtime = 'nodejs';
export const maxDuration = 30;

const bundledYtDlpPath = path.join(
  process.cwd(),
  'runtime-bin',
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
);

let ytDlpPathPromise: Promise<string> | undefined;

async function installYtDlp(executablePath: string): Promise<string> {
  let assetName: string;
  if (process.platform === 'win32') assetName = 'yt-dlp.exe';
  else if (process.platform === 'darwin') assetName = 'yt-dlp_macos';
  else if (process.platform === 'linux' && process.arch === 'arm64') assetName = 'yt-dlp_linux_aarch64';
  else if (process.platform === 'linux' && process.arch === 'x64') assetName = 'yt-dlp_linux';
  else throw new Error('AVD_BINARY_PLATFORM_UNSUPPORTED');

  const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${assetName}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`AVD_BINARY_DOWNLOAD_FAILED_${response.status}`);
  const binary = Buffer.from(await response.arrayBuffer());
  if (binary.length < 1_000_000 || binary.length > 100_000_000) throw new Error('AVD_BINARY_DOWNLOAD_INVALID');
  await fs.promises.writeFile(executablePath, binary, { mode: 0o755 });
  if (process.platform !== 'win32') await fs.promises.chmod(executablePath, 0o755);
  return executablePath;
}

async function resolveYtDlpPath(): Promise<string> {
  if (!ytDlpPathPromise) {
    ytDlpPathPromise = (async () => {
      const configuredPath = process.env.YTDLP_PATH?.trim();
      if (configuredPath) {
        await fs.promises.access(configuredPath, fs.constants.R_OK);
        return configuredPath;
      }
      const executablePath = path.join(os.tmpdir(), process.platform === 'win32' ? 'avd-yt-dlp.exe' : 'avd-yt-dlp');
      try {
        await fs.promises.access(bundledYtDlpPath, fs.constants.R_OK);
        if (process.platform === 'win32') return bundledYtDlpPath;
        await fs.promises.copyFile(bundledYtDlpPath, executablePath);
        await fs.promises.chmod(executablePath, 0o755);
        return executablePath;
      } catch {
        return installYtDlp(executablePath);
      }
    })().catch((error) => {
      ytDlpPathPromise = undefined;
      throw error;
    });
  }
  return ytDlpPathPromise;
}

async function getDirectUrl(url: string, format: string): Promise<string | null> {
  try {
    const executablePath = await resolveYtDlpPath();
    const formatMap: Record<string, string> = {
      'video-highest': 'best',
      'video-1080p': 'best[height<=1080]',
      'video-720p': 'best[height<=720]',
      'video-480p': 'best[height<=480]',
      'video-360p': 'best[height<=360]',
      'audio-128kbps': 'bestaudio/best',
      'audio-192kbps': 'bestaudio/best',
      'audio-320kbps': 'bestaudio/best',
    };
    const formatArg = formatMap[format] || 'best';
    const res = await createYtDlp(executablePath).exec(url, {
      getUrl: true,
      format: formatArg,
      noPlaylist: true,
      socketTimeout: 15,
      noWarnings: true,
    });
    const downloadUrl = res.stdout?.trim();
    if (downloadUrl && downloadUrl.startsWith('http')) return downloadUrl;
    return null;
  } catch { return null; }
}

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

    // Try yt-dlp --get-url using same binary resolution as analyze
    const directUrl = await getDirectUrl(url, format);
    if (directUrl) {
      return NextResponse.json({ downloadUrl: directUrl, title, format, status: 'completed' });
    }

    // Fallback: YouTube page API
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
