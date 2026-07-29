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
  __veloDownActiveTasks?: Map<string, DownloadTask>;
};

export const activeTasks =
  globalTaskStore.__veloDownActiveTasks ??
  (globalTaskStore.__veloDownActiveTasks = new Map<string, DownloadTask>());

// =============================================================================
// Caching — invalidate after 30 minutes
// =============================================================================

const cacheStore = new Map<string, { data: VideoBasicInfo; expiry: number }>();

function getCached(id: string): VideoBasicInfo | null {
  const entry = cacheStore.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cacheStore.delete(id);
    return null;
  }
  return entry.data;
}

function setCache(id: string, data: VideoBasicInfo): void {
  cacheStore.set(id, { data, expiry: Date.now() + 30 * 60 * 1000 });
}

// =============================================================================
// Helpers
// =============================================================================

// Resolve ffmpeg path (Turbopack may virtualise ffmpeg-static's import)
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
// URL parsing — uses the URL API (no fragile regex)
// =============================================================================

const ALLOWED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export interface ParseResult {
  videoId: string;
  isShort: boolean;
  cleanUrl: string;
}

export function parseYoutubeUrl(input: string): ParseResult {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid YouTube URL');
  }

  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    throw new Error('Invalid YouTube URL');
  }

  // Validate hostname
  const host = parsed.hostname.toLowerCase();
  const isShortDomain = host === 'youtu.be' || host === 'www.youtu.be';
  if (!ALLOWED_HOSTS.has(host)) {
    throw new Error('Invalid YouTube URL');
  }

  let videoId: string | null = null;
  let isShort = false;

  if (isShortDomain) {
    // youtu.be/VIDEO_ID
    videoId = parsed.pathname.slice(1).split('/')[0] || null;
  } else {
    const path = parsed.pathname;

    // /shorts/VIDEO_ID
    const shortsMatch = path.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) {
      videoId = shortsMatch[1];
      isShort = true;
    }

    // /embed/VIDEO_ID
    if (!videoId) {
      const embedMatch = path.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) videoId = embedMatch[1];
    }

    // /live/VIDEO_ID
    if (!videoId) {
      const liveMatch = path.match(/\/live\/([a-zA-Z0-9_-]{11})/);
      if (liveMatch) videoId = liveMatch[1];
    }

    // /v/VIDEO_ID
    if (!videoId) {
      const vMatch = path.match(/\/v\/([a-zA-Z0-9_-]{11})/);
      if (vMatch) videoId = vMatch[1];
    }

    // ?v=VIDEO_ID (query param)
    if (!videoId) {
      const vParam = parsed.searchParams.get('v');
      if (vParam) videoId = vParam;
    }
  }

  if (!videoId || !VIDEO_ID_RE.test(videoId)) {
    throw new Error('Invalid YouTube URL');
  }

  const cleanUrl = isShort
    ? `https://www.youtube.com/shorts/${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;

  return { videoId, isShort, cleanUrl };
}

// Legacy alias kept for the download route
export function cleanUrl(url: string): string {
  try {
    return parseYoutubeUrl(url).cleanUrl;
  } catch {
    return url;
  }
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
 * Fetch ONLY basic video metadata via --print (fast, no format info).
 * Results are cached for 30 minutes.
 */
export async function getVideoBasicInfo(url: string): Promise<VideoBasicInfo> {
  // Check cache first
  let parsed: ParseResult;
  try {
    parsed = parseYoutubeUrl(url);
  } catch {
    throw new Error('Invalid YouTube URL');
  }
  const cached = getCached(parsed.videoId);
  if (cached) return cached;

  const fields = [
    'title', 'uploader', 'duration', 'view_count',
    'thumbnail', 'upload_date', 'width', 'height',
  ];

  const data = await new Promise<string[]>((resolve, reject) => {
    const args = buildYtDlpArgs(...fields.map((f) => ['--print', f]).flat(), url);
    const child = spawn('python', args);

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Request timed out. YouTube is not responding.'));
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

  setCache(parsed.videoId, info);
  return info;
}

/**
 * Full metadata fetch via --dump-json (used only during download where
 * format details are needed).  This is slower so we keep caching tight.
 */
export async function getVideoMetadata(url: string): Promise<YtDlpMetadata> {
  return new Promise((resolve, reject) => {
    const args = buildYtDlpArgs('--dump-json', url);
    const child = spawn('python', args);

    let stdoutData = '';
    let stderrData = '';

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Request timed out. YouTube is not responding. Please try again later.'));
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
        reject(new Error('Failed to parse video metadata from YouTube.'));
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
    return 'YouTube blocked the request. Bot verification is required.';
  }
  if (stderr.includes('Video unavailable') || stderr.includes('This video is unavailable')) {
    return 'This video is unavailable or has been deleted.';
  }
  if (stderr.includes('age') || stderr.includes('Age')) {
    return 'This video is age-restricted and cannot be accessed.';
  }
  const errorLines = stderr.split('\n').filter((l) => l.trim().startsWith('ERROR:'));
  if (errorLines.length > 0) {
    return errorLines[0].replace('ERROR:', '').trim();
  }
  return 'Failed to fetch video information.';
}

/**
 * Start the download process in the background
 */
export function startDownload(taskId: string, url: string, format: string, videoTitle: string) {
  const task = activeTasks.get(taskId);
  if (!task) return;

  task.status = 'downloading';
  activeTasks.set(taskId, task);

  const ffmpegDir = getFfmpegLocation();
  const tempDir = path.join(process.cwd(), '.temp', taskId);

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Construct yt-dlp arguments based on format selection
  const args: string[] = ['-m', 'yt_dlp', '--no-playlist', '--socket-timeout', '15', '--extractor-retries', '1'];

  // Save files as temp_file.%(ext)s inside our specific taskId directory.
  // The final extension is determined by yt-dlp after post-processing.
  const outputTemplate = path.join(tempDir, 'temp_file.%(ext)s');
  args.push('-o', outputTemplate);

  if (ffmpegDir) {
    args.push('--ffmpeg-location', ffmpegDir);
  }

  const isAudio = format.startsWith('audio-');

  if (isAudio) {
    // Audio extraction format
    const quality = format.split('-')[1]; // e.g. 128k, 192k, 320k
    args.push(
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', quality === 'highest' ? '0' : quality.replace('kbps', '')
    );
  } else {
    // Prefer MP4-compatible streams, but keep the fallback for videos where
    // YouTube does not expose an AVC/AAC combination at the requested height.
    let formatQuery = 'bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[ext=mp4]/bestvideo+bestaudio/best';
    if (format === 'video-1080p') {
      formatQuery = 'bestvideo[height<=1080][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=1080][ext=mp4]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best';
    } else if (format === 'video-720p') {
      formatQuery = 'bestvideo[height<=720][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=720][ext=mp4]/bestvideo[height<=720]+bestaudio/best[height<=720]/best';
    } else if (format === 'video-480p') {
      formatQuery = 'bestvideo[height<=480][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=480][ext=mp4]/bestvideo[height<=480]+bestaudio/best[height<=480]/best';
    } else if (format === 'video-360p') {
      formatQuery = 'bestvideo[height<=360][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=360][ext=mp4]/bestvideo[height<=360]+bestaudio/best[height<=360]/best';
    }

    args.push('-f', formatQuery);
    args.push('--merge-output-format', 'mp4');
    // --merge-output-format only controls the container when streams are
    // merged. A progressive WebM fallback would otherwise remain WebM, so
    // explicitly recode every video result to guarantee an MP4 download.
    args.push('--recode-video', 'mp4');
  }

  // Target URL
  args.push(url);

  // Spawn yt-dlp process
  const child = spawn('python', args);

  // Kill download if it takes longer than 10 minutes
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

    // yt-dlp writes progress and FFmpeg post-processing messages to stderr by
    // default, so parse both streams.
    if (line.includes('[ffmpeg]') || line.includes('[VideoConvertor]')) {
      task.status = 'merging';
      task.percent = Math.max(task.percent, 99);
      task.speed = 'Merging...';
      task.eta = 'Wait';
      activeTasks.set(taskId, { ...task });
      return;
    }

    // Example: [download]   2.3% of ~10.42MiB at  3.45MiB/s ETA 00:02
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
      // Cleanup temp dir on failure
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch { }
      return;
    }

    // Find the downloaded file inside tempDir. Video downloads must have
    // completed yt-dlp post-processing before they are exposed to the client.
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

      const originalExt = path.extname(downloadedFile); // .mp4 for video, .mp3 for audio
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
