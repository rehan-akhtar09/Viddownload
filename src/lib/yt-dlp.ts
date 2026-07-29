import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import ffmpegPath from 'ffmpeg-static';

// =============================================================================
// Types
// =============================================================================

export interface DownloadTask {
  id: string;
  url: string;
  format: string;
  percent: number;
  speed: string;
  eta: string;
  status: 'pending' | 'downloading' | 'merging' | 'completed' | 'failed';
  error?: string;
  filePath?: string;
  fileName?: string;
}

export interface VideoBasicInfo {
  title: string;
  uploader: string;
  duration: number;
  view_count: number;
  thumbnail: string;
  upload_date: string;
  width: number;
  height: number;
}

interface YtDlpMetadata {
  title?: string;
  uploader?: string;
  duration?: number;
  upload_date?: string;
  view_count?: number;
  thumbnail?: string;
  thumbnails?: Array<{ url?: string }>;
  formats?: Array<{ height?: number }>;
  width?: number;
  height?: number;
}

// =============================================================================
// Global task registry (survives Turbopack HMR)
// =============================================================================

const globalTaskStore = globalThis as typeof globalThis & {
  __avdActiveTasks?: Map<string, DownloadTask>;
};

export const activeTasks =
  globalTaskStore.__avdActiveTasks ??
  (globalTaskStore.__avdActiveTasks = new Map<string, DownloadTask>());

// =============================================================================
// Caching — invalidate after 30 minutes (keyed by URL to support any site)
// =============================================================================

const cacheStore = new Map<string, { data: VideoBasicInfo; expiry: number }>();

function getCached(key: string): VideoBasicInfo | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: VideoBasicInfo): void {
  cacheStore.set(key, { data, expiry: Date.now() + 30 * 60 * 1000 });
}

// =============================================================================
// Helpers
// =============================================================================

const getFfmpegLocation = (): string => {
  const candidates = [
    ffmpegPath,
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg'),
  ];
  const executablePath = candidates.find(
    (candidate): candidate is string => Boolean(candidate && fs.existsSync(candidate)),
  );
  return executablePath ? path.dirname(executablePath) : '';
};

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_');
}

// =============================================================================
// URL validation — accepts any valid http/https URL (yt-dlp handles parsing)
// =============================================================================

export function validateUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid URL');
  }
  const trimmed = input.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https URLs are supported');
  }
  if (!parsed.hostname.includes('.')) {
    throw new Error('Invalid URL');
  }
  return trimmed;
}

// =============================================================================
// Fast metadata fetch via yt-dlp --print (avoids expensive format extraction)
// =============================================================================

const YT_DLP_BASE = [
  '--no-playlist',
  '--socket-timeout', '10',
  '--extractor-retries', '1',
  '--no-warnings',
];

function buildYtDlpArgs(...extra: string[]): string[] {
  return ['-m', 'yt_dlp', ...YT_DLP_BASE, ...extra];
}

/**
 * Fetch basic video metadata via --print (fast, no format details).
 * Results are cached for 30 minutes by URL.
 */
export async function getVideoBasicInfo(url: string): Promise<VideoBasicInfo> {
  const validUrl = validateUrl(url);

  const cached = getCached(validUrl);
  if (cached) return cached;

  const fields = [
    'title', 'uploader', 'duration', 'view_count',
    'thumbnail', 'upload_date', 'width', 'height',
  ];

  const data = await new Promise<string[]>((resolve, reject) => {
    const args = buildYtDlpArgs(...fields.map((f) => ['--print', f]).flat(), validUrl);
    const child = spawn('python', args);

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Request timed out. The server took too long to respond.'));
    }, 30000);

    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(parseYtDlpError(stderr)));
        return;
      }
      const lines = stdout.trim().split('\n').map((l) => l.trim());
      resolve(lines);
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to launch yt-dlp: ${err.message}`));
    });
  });

  const info: VideoBasicInfo = {
    title: data[0] || 'Unknown Video',
    uploader: data[1] || 'Unknown Channel',
    duration: parseInt(data[2], 10) || 0,
    view_count: parseInt(data[3], 10) || 0,
    thumbnail: data[4] || '',
    upload_date: data[5] || '',
    width: parseInt(data[6], 10) || 0,
    height: parseInt(data[7], 10) || 0,
  };

  setCache(validUrl, info);
  return info;
}

/**
 * Full metadata fetch via --dump-json (used during download where
 * format details are needed). Slower so caching is minimal.
 */
export async function getVideoMetadata(url: string): Promise<YtDlpMetadata> {
  return new Promise((resolve, reject) => {
    const args = buildYtDlpArgs('--dump-json', url);
    const child = spawn('python', args);

    let stdoutData = '';
    let stderrData = '';

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Request timed out. The server took too long to respond.'));
    }, 120000);

    child.stdout.on('data', (data) => { stdoutData += data.toString(); });
    child.stderr.on('data', (data) => { stderrData += data.toString(); });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(parseYtDlpError(stderrData)));
        return;
      }
      try {
        resolve(JSON.parse(stdoutData) as YtDlpMetadata);
      } catch {
        reject(new Error('Failed to parse video metadata.'));
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to launch yt-dlp: ${err.message}`));
    });
  });
}

function parseYtDlpError(stderr: string): string {
  if (!stderr) return 'Failed to fetch video information.';
  if (stderr.includes('Private video') || stderr.includes('private video')) {
    return 'This video is private and cannot be downloaded.';
  }
  if (stderr.includes('Sign in to confirm you are not a bot')) {
    return 'The site blocked the request. Bot verification is required.';
  }
  if (stderr.includes('Video unavailable') || stderr.includes('This video is unavailable')) {
    return 'This video is unavailable or has been deleted.';
  }
  if (stderr.includes('HTTP Error 403')) {
    return 'Access forbidden. The video may be region-restricted.';
  }
  if (stderr.includes('HTTP Error 404')) {
    return 'Video not found. The URL may be invalid.';
  }
  if (stderr.includes('age') || stderr.includes('Age') || stderr.includes('age-restricted')) {
    return 'This video is age-restricted and cannot be accessed.';
  }
  if (stderr.includes('Unsupported URL') || stderr.includes('not a valid URL')) {
    return 'Unsupported URL. Please check the link and try again.';
  }
  const errorLines = stderr.split('\n').filter((l) => l.trim().startsWith('ERROR:'));
  if (errorLines.length > 0) {
    return errorLines[0].replace('ERROR:', '').trim();
  }
  return 'Failed to fetch video information.';
}

// =============================================================================
// Download engine
// =============================================================================

export function startDownload(taskId: string, url: string, format: string, videoTitle: string) {
  const task = activeTasks.get(taskId);
  if (!task) return;

  task.status = 'downloading';
  activeTasks.set(taskId, task);

  const ffmpegDir = getFfmpegLocation();
  const tempDir = path.join(process.cwd(), '.temp', taskId);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const args: string[] = ['-m', 'yt_dlp', '--no-playlist', '--socket-timeout', '15', '--extractor-retries', '1'];

  const outputTemplate = path.join(tempDir, 'temp_file.%(ext)s');
  args.push('-o', outputTemplate);

  if (ffmpegDir) {
    args.push('--ffmpeg-location', ffmpegDir);
  }

  const isAudio = format.startsWith('audio-');

  if (isAudio) {
    const quality = format.split('-')[1];
    args.push(
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', quality === 'highest' ? '0' : quality.replace('kbps', '')
    );
  } else {
    // Generic format query — works for YouTube, TikTok, Instagram, Twitter/X, etc.
    // Falls back gracefully when a specific height isn't available.
    let formatQuery = 'bestvideo+bestaudio/best';
    if (format === 'video-1080p') {
      formatQuery = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/bestvideo+bestaudio/best';
    } else if (format === 'video-720p') {
      formatQuery = 'bestvideo[height<=720]+bestaudio/best[height<=720]/bestvideo+bestaudio/best';
    } else if (format === 'video-480p') {
      formatQuery = 'bestvideo[height<=480]+bestaudio/best[height<=480]/bestvideo+bestaudio/best';
    } else if (format === 'video-360p') {
      formatQuery = 'bestvideo[height<=360]+bestaudio/best[height<=360]/bestvideo+bestaudio/best';
    }

    args.push('-f', formatQuery);
    args.push('--merge-output-format', 'mp4');
    args.push('--recode-video', 'mp4');
  }

  args.push(url);

  const child = spawn('python', args);

  const downloadTimeout = setTimeout(() => {
    child.kill();
    task.status = 'failed';
    task.error = 'Download timed out after 10 minutes.';
    activeTasks.set(taskId, { ...task });
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { }
  }, 600000);

  const handleOutput = (data: Buffer, stream: 'stdout' | 'stderr') => {
    const line = data.toString();
    console.log(`[yt-dlp ${stream}]: ${line.trim()}`);

    if (line.includes('[ffmpeg]') || line.includes('[VideoConvertor]')) {
      task.status = 'merging';
      task.percent = Math.max(task.percent, 99);
      task.speed = 'Merging...';
      task.eta = 'Wait';
      activeTasks.set(taskId, { ...task });
      return;
    }

    const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
    const speedMatch = line.match(/at\s+([\d.]+\w+\/s|Unknown speed)/);
    const etaMatch = line.match(/ETA\s+(\d+:\d+|Unknown)/);

    if (percentMatch) {
      task.percent = parseFloat(percentMatch[1]);
      if (speedMatch) task.speed = speedMatch[1];
      if (etaMatch) task.eta = etaMatch[1];
      task.status = 'downloading';
      activeTasks.set(taskId, { ...task });
    }
  };

  child.stdout.on('data', (data: Buffer) => handleOutput(data, 'stdout'));
  child.stderr.on('data', (data: Buffer) => handleOutput(data, 'stderr'));

  child.on('close', (code) => {
    clearTimeout(downloadTimeout);
    if (code !== 0) {
      task.status = 'failed';
      task.error = 'Download failed. Check URL or network connection.';
      activeTasks.set(taskId, { ...task });
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch { }
      return;
    }

    try {
      const files = fs.readdirSync(tempDir);
      const downloadedFile = files.find((file) => {
        if (file.endsWith('.part') || file.endsWith('.ytdl')) return false;
        return isAudio ? file.toLowerCase().endsWith('.mp3') : file.toLowerCase().endsWith('.mp4');
      });

      if (!downloadedFile) {
        task.status = 'failed';
        task.error = 'Downloaded file not found on disk.';
        activeTasks.set(taskId, { ...task });
        return;
      }

      const originalExt = path.extname(downloadedFile);
      const cleanTitle = sanitizeFilename(videoTitle);
      const displayFilename = `${cleanTitle}${originalExt}`;
      const finalFilePath = path.join(tempDir, downloadedFile);

      task.status = 'completed';
      task.percent = 100;
      task.speed = '0 MB/s';
      task.eta = '00:00';
      task.filePath = finalFilePath;
      task.fileName = displayFilename;
      activeTasks.set(taskId, { ...task });
    } catch (err: unknown) {
      task.status = 'failed';
      const message = err instanceof Error ? err.message : 'Unknown file-system error';
      task.error = `Error finalizing file: ${message}`;
      activeTasks.set(taskId, { ...task });
    }
  });
}
