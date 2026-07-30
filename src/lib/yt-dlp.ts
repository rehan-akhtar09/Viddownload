import fs from 'fs';
import os from 'os';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';
import { create as createYtDlp } from 'yt-dlp-exec';

const bundledYtDlpPath = path.join(
  process.cwd(),
  'runtime-bin',
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
);

export interface VideoBasicInfo {
  title: string;
  uploader: string;
  duration: number;
  view_count: number;
  thumbnail: string;
  upload_date: string;
  width: number;
  height: number;
  availableQualities: {
    '360p': boolean;
    '480p': boolean;
    '720p': boolean;
    '1080p': boolean;
    highest: boolean;
  };
}

interface YtDlpFormat {
  height?: number;
  vcodec?: string;
}

interface YtDlpMetadata {
  title?: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  upload_date?: string;
  view_count?: number;
  thumbnail?: string;
  width?: number;
  height?: number;
  formats?: YtDlpFormat[];
}

export interface DownloadedFile {
  directory: string;
  filePath: string;
  fileName: string;
  contentType: string;
  size: number;
}

const VIDEO_FORMATS: Record<string, string> = {
  'video-highest': 'bestvideo*+bestaudio/best',
  'video-1080p': 'bestvideo*[height<=1080]+bestaudio/best[height<=1080]/best',
  'video-720p': 'bestvideo*[height<=720]+bestaudio/best[height<=720]/best',
  'video-480p': 'bestvideo*[height<=480]+bestaudio/best[height<=480]/best',
  'video-360p': 'bestvideo*[height<=360]+bestaudio/best[height<=360]/best',
};

const ALLOWED_FORMATS = new Set([
  ...Object.keys(VIDEO_FORMATS),
  'audio-128kbps',
  'audio-192kbps',
  'audio-320kbps',
]);

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  return parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || parts[0] === 0;
}

export function validateUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid URL. Please enter a public video link.');
  }

  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    throw new Error('Invalid URL. Please enter a valid video link.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    !['http:', 'https:'].includes(parsed.protocol)
    || !hostname.includes('.')
    || hostname === 'localhost'
    || hostname.endsWith('.local')
    || hostname === '::1'
    || isPrivateIpv4(hostname)
  ) {
    throw new Error('Only public HTTP and HTTPS video URLs are supported.');
  }

  return parsed.toString();
}

export function validateFormat(format: string): string {
  if (!ALLOWED_FORMATS.has(format)) {
    throw new Error('Unsupported download format.');
  }
  return format;
}

function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
    .slice(0, 160);
  return cleaned || 'video';
}

let ytDlpPathPromise: Promise<string> | undefined;

async function installYtDlp(executablePath: string): Promise<string> {
  let assetName: string;
  if (process.platform === 'win32') {
    assetName = 'yt-dlp.exe';
  } else if (process.platform === 'darwin') {
    assetName = 'yt-dlp_macos';
  } else if (process.platform === 'linux' && process.arch === 'arm64') {
    assetName = 'yt-dlp_linux_aarch64';
  } else if (process.platform === 'linux' && process.arch === 'x64') {
    assetName = 'yt-dlp_linux';
  } else {
    throw new Error('AVD_BINARY_PLATFORM_UNSUPPORTED');
  }

  const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${assetName}`;
  const response = await fetch(downloadUrl, { signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`AVD_BINARY_DOWNLOAD_FAILED_${response.status}`);

  const binary = Buffer.from(await response.arrayBuffer());
  if (binary.length < 1_000_000 || binary.length > 100_000_000) {
    throw new Error('AVD_BINARY_DOWNLOAD_INVALID');
  }

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

      const executablePath = path.join(
        os.tmpdir(),
        process.platform === 'win32' ? 'avd-yt-dlp.exe' : 'avd-yt-dlp',
      );

      try {
        await fs.promises.access(bundledYtDlpPath, fs.constants.R_OK);
        if (process.platform === 'win32') return bundledYtDlpPath;

        // Deployment bundles can lose executable mode bits. /tmp is writable on Vercel.
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

async function runYtDlp(
  url: string,
  flags: Record<string, string | number | boolean>,
  options: { timeout: number; maxBuffer: number },
) {
  const executablePath = await resolveYtDlpPath();
  return createYtDlp(executablePath).exec(url, flags, options);
}

function getYtDlpErrorOutput(error: unknown): string {
  if (!(error instanceof Error)) return '';
  const stderr = 'stderr' in error
    ? String((error as Error & { stderr?: unknown }).stderr || '').trim()
    : '';
  return stderr || error.message;
}

function parseYtDlpError(stderr: string): string {
  const message = stderr || '';
  if (/AVD_BINARY_DOWNLOAD_FAILED|AVD_BINARY_DOWNLOAD_INVALID|AVD_BINARY_PLATFORM_UNSUPPORTED/i.test(message)) return 'The server could not install the downloader executable.';
  if (/spawn .*ENOENT/i.test(message)) return 'The server could not launch the downloader executable.';
  if (/EACCES|permission denied/i.test(message)) return 'The downloader executable cannot run on this server.';
  if (/no such file or directory/i.test(message)) return 'A runtime required by the downloader is unavailable on this server.';
  if (/exec format error|not a valid win32 application/i.test(message)) return 'The downloader executable is incompatible with this server.';
  if (/cannot find module|module_not_found/i.test(message)) return 'A required downloader module is unavailable on this server.';
  if (/private video/i.test(message)) return 'This video is private and cannot be downloaded.';
  if (/sign in|login required|cookies/i.test(message)) return 'This media requires login or cookies and cannot be downloaded by this server.';
  if (/not a bot|bot verification/i.test(message)) return 'The platform blocked this server with bot verification.';
  if (/drm|digital rights management/i.test(message)) return 'DRM-protected media cannot be downloaded.';
  if (/video unavailable|media is unavailable|has been removed/i.test(message)) return 'This media is unavailable or has been removed.';
  if (/unsupported url|no suitable extractor/i.test(message)) return 'This URL is not supported by the downloader.';
  if (/http error 403|forbidden/i.test(message)) return 'The platform denied access. The media may be private, expired, or region-restricted.';
  if (/http error 404|not found/i.test(message)) return 'Media not found. Check that the URL is correct and public.';
  if (/age.restrict/i.test(message)) return 'Age-restricted media cannot be accessed by this server.';
  if (/timed? out|timeout/i.test(message)) return 'The platform took too long to respond.';

  const errorLines = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('ERROR:'));
  if (errorLines.length > 0) {
    return errorLines.at(-1)!.replace(/^ERROR:\s*/, '').slice(0, 500);
  }
  return 'The downloader could not process this URL.';
}

function contentTypeForExtension(extension: string): string {
  const types: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
  };
  return types[extension] || 'application/octet-stream';
}

function commonFlags() {
  return {
    noPlaylist: true,
    socketTimeout: 20,
    extractorRetries: 2,
    retries: 2,
    noWarnings: true,
    jsRuntimes: 'node',
  };
}

function parseYtDlpMetadata(stdout: string): YtDlpMetadata {
  try {
    return JSON.parse(stdout) as YtDlpMetadata;
  } catch (parseError) {
    const jsonLine = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.startsWith('{'));
    if (jsonLine) return JSON.parse(jsonLine) as YtDlpMetadata;
    throw parseError;
  }
}

export async function getVideoBasicInfo(input: string): Promise<VideoBasicInfo> {
  const url = validateUrl(input);

  try {
    const result = await runYtDlp(url, {
      ...commonFlags(),
      dumpSingleJson: true,
      skipDownload: true,
    }, {
      timeout: 45_000,
      maxBuffer: 20 * 1024 * 1024,
    });

    const metadata = parseYtDlpMetadata(result.stdout);
    const heights = new Set(
      (metadata.formats ?? [])
        .filter((format) => format.vcodec !== 'none' && Number.isFinite(format.height))
        .map((format) => format.height as number),
    );
    const hasAtLeast = (height: number) => [...heights].some((available) => available >= height);

    return {
      title: metadata.title || 'Untitled video',
      uploader: metadata.uploader || metadata.channel || 'Unknown',
      duration: metadata.duration || 0,
      view_count: metadata.view_count || 0,
      thumbnail: metadata.thumbnail || '',
      upload_date: metadata.upload_date || '',
      width: metadata.width || 0,
      height: metadata.height || 0,
      availableQualities: {
        '360p': hasAtLeast(360),
        '480p': hasAtLeast(480),
        '720p': hasAtLeast(720),
        '1080p': hasAtLeast(1080),
        highest: heights.size > 0,
      },
    };
  } catch (error: unknown) {
    const output = getYtDlpErrorOutput(error);
    if (output) throw new Error(parseYtDlpError(output));
    throw error;
  }
}

const formatToYtDlp: Record<string, string> = {
  'video-highest': 'best',
  'video-1080p': 'best[height<=1080]',
  'video-720p': 'best[height<=720]',
  'video-480p': 'best[height<=480]',
  'video-360p': 'best[height<=360]',
  'audio-128kbps': 'bestaudio/best',
  'audio-192kbps': 'bestaudio/best',
  'audio-320kbps': 'bestaudio/best',
};

export async function getVideoDirectUrl(input: string, format: string): Promise<string> {
  const url = validateUrl(input);
  const formatArg = formatToYtDlp[format] || 'best';

  try {
    const result = await runYtDlp(url, {
      getUrl: true,
      format: formatArg,
      noPlaylist: true,
      socketTimeout: 15,
      noWarnings: true,
    }, {
      timeout: 25_000,
      maxBuffer: 5_000_000,
    });

    const downloadUrl = result.stdout?.trim();
    if (downloadUrl && downloadUrl.startsWith('http')) {
      return downloadUrl;
    }
    throw new Error('No downloadable URL returned by the server.');
  } catch (error) {
    throw new Error(parseYtDlpError(getYtDlpErrorOutput(error)));
  }
}

export async function downloadVideo(
  input: string,
  requestedFormat: string,
  requestedTitle: string,
): Promise<DownloadedFile> {
  const url = validateUrl(input);
  const format = validateFormat(requestedFormat);
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'avd-'));
  const outputTemplate = path.join(directory, 'download.%(ext)s');
  const isAudio = format.startsWith('audio-');

  const flags: Record<string, string | number | boolean> = {
    ...commonFlags(),
    newline: true,
    output: outputTemplate,
  };

  if (ffmpegPath && fs.existsSync(ffmpegPath)) {
    flags.ffmpegLocation = ffmpegPath;
  }

  if (isAudio) {
    const bitrate = format.replace('audio-', '').replace('kbps', '');
    flags.extractAudio = true;
    flags.audioFormat = 'mp3';
    flags.audioQuality = `${bitrate}K`;
  } else {
    flags.format = VIDEO_FORMATS[format];
    flags.mergeOutputFormat = 'mp4';
  }

  try {
    await runYtDlp(url, flags, {
      timeout: 5 * 60_000,
      maxBuffer: 20 * 1024 * 1024,
    });

    const files = await fs.promises.readdir(directory);
    const file = files.find((candidate) => !candidate.endsWith('.part') && !candidate.endsWith('.ytdl'));
    if (!file) {
      throw new Error('The downloader finished without producing a file.');
    }

    const filePath = path.join(directory, file);
    const stats = await fs.promises.stat(filePath);
    const extension = path.extname(file).toLowerCase();
    const title = sanitizeFilename(requestedTitle);

    return {
      directory,
      filePath,
      fileName: `${title}${extension}`,
      contentType: contentTypeForExtension(extension),
      size: stats.size,
    };
  } catch (error: unknown) {
    await fs.promises.rm(directory, { recursive: true, force: true }).catch(() => undefined);
    throw new Error(parseYtDlpError(getYtDlpErrorOutput(error)));
  }
}
