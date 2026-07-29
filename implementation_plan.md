# Implementation Plan - Modern YouTube Video & Audio Downloader (Web App)

This document details the architecture, design, and step-by-step plan to build a production-ready Next.js web application for downloading YouTube videos and YouTube Shorts.

## User Review Required

> [!IMPORTANT]
> **Dependencies and Executables**
> 1. **`yt-dlp` (via Python):** Since the system has Python 3.14.3 and pip, we will install `yt-dlp` using `pip install yt-dlp`. This is the most robust and frequently updated tool for bypassing YouTube restrictions and extracting video details/download links.
> 2. **`ffmpeg-static`:** We will use the npm package `ffmpeg-static` to automatically provide a static FFmpeg executable on the server (Windows). This allows merging video and audio streams (required for 1080p+ quality) and converting to MP3 without requiring the user to install FFmpeg globally.
> 3. **Local Storage:** The download history and theme preference will be persisted in the client's browser local storage, which eliminates the need for a database.

> [!WARNING]
> **Download and Merging Process**
> High-quality YouTube video streams (1080p and higher) do not have pre-merged audio from YouTube. The application will download the video and audio streams separately to a temporary folder on the backend, merge them using FFmpeg, and then stream the combined file to the user's browser. This process requires temporary disk space on the host running the app.

---

## Open Questions
- *None at this time. All requirements are well-defined. If you have preferences on the layout or themes, let me know!*

---

## Proposed Changes

We will build the application in the workspace root `c:\Users\User\Desktop\new gen\cli_gemini\yt video`.

### Folder Structure

We will initialize a Next.js (App Router) + TypeScript + Tailwind CSS project with the following structure:

```
yt video/
├── public/                 # Static assets
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Main layout (Theme provider integration)
│   │   ├── page.tsx        # Home Page UI (Glassmorphic landing page)
│   │   ├── providers.tsx   # React context providers (Theme, etc.)
│   │   └── api/
│   │       ├── analyze/
│   │       │   └── route.ts # API to fetch video metadata via yt-dlp
│   │       ├── download/
│   │       │   └── route.ts # API to trigger download and track progress
│   │       └── download/file/
│   │           └── route.ts # API to stream the final file to browser
│   ├── components/
│   │   ├── AnalyzeForm.tsx  # URL Input, Paste & Analyze button
│   │   ├── VideoDetails.tsx # Thumbnail, Title, Formats list
│   │   ├── DownloadProgress.tsx # Progress bar, Speed, ETA
│   │   ├── HistoryList.tsx  # Scrollable list of past 20 downloads with Search
│   │   ├── ThemeToggle.tsx  # Light/Dark mode switcher
│   │   └── ui/              # shadcn-like glassmorphic UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── progress.tsx
│   ├── hooks/
│   │   └── useLocalStorage.ts # Custom hook for download history & theme
│   ├── lib/
│   │   └── yt-dlp.ts       # Service to interface with yt-dlp and parse stdout
│   └── types/
│       └── index.ts        # TypeScript interface definitions
├── package.json
└── tsconfig.json
```

---

### Component Specifications

#### 1. UI Components (`src/components/ui/`)
- Custom premium React components with a **glassmorphism** design:
  - Semi-transparent backgrounds (`backdrop-blur-md bg-white/10 dark:bg-black/30`)
  - Smooth borders (`border border-white/20 dark:border-white/10`)
  - Rich hover effects, transitions, and skeletons for loading states.
  - Integration with Lucide React icons.

#### 2. Theme Toggle (`src/components/ThemeToggle.tsx`)
- Toggle switch that swaps Tailwind `dark` class on the `<html>` node.
- Persists user preferences (light vs dark vs system) in local storage.

#### 3. Analyze Form (`src/components/AnalyzeForm.tsx`)
- Clean URL input with automated validation for normal YouTube URLs (`youtube.com/watch?v=...`, `youtu.be/...`) and Shorts (`youtube.com/shorts/...`).
- "Paste" button using the browser Clipboard API.
- Loading states with skeleton animations while fetching metadata.

#### 4. Video Details (`src/components/VideoDetails.tsx`)
- Displays title, channel, duration (formatted), upload date, and view count.
- Groups download options into columns: **Video** (360p, 480p, 720p, 1080p, Best Quality) and **Audio** (MP3 128k, 192k, 320k).
- Each format has an active download button.

#### 5. Download Progress (`src/components/DownloadProgress.tsx`)
- Real-time download progress bar showing:
  - Progress percentage.
  - Download speed (MB/s).
  - Estimated remaining time (ETA).
  - Custom progress feedback.

#### 6. History & Search (`src/components/HistoryList.tsx`)
- Lists the last 20 downloads stored in browser localStorage.
- Search input to filter history items by title.
- "Download Again" button to re-analyze/re-download instantly.

---

### API Specifications

#### 1. `POST /api/analyze`
- Validates the incoming URL.
- Spawns `yt-dlp --dump-json <url>` to retrieve metadata.
- Filters and structures the response to return:
  - Metadata: Title, channel, duration, upload date, views, thumbnail.
  - Formats: List of available video and audio qualities.

#### 2. `POST /api/download`
- Accepts URL and selected format (e.g. `1080p`, `mp3-320k`).
- Generates a unique `taskId`.
- Spawns a background worker (`yt-dlp` with `--ffmpeg-location`) and streams progress stdout to the client using a server-sent events stream or a progress polling state in memory. We will use a fast status API (`/api/download/status?taskId=...`) for maximum reliability on Windows local servers.
- The file is saved temporarily in standard OS temp folders or a dedicated `.temp` directory in the workspace.

#### 3. `GET /api/download/status?taskId=...`
- Returns current progress percentage, speed, ETA, and completion status.

#### 4. `GET /api/download/file?taskId=...`
- Serves the merged/downloaded file to the browser with headers `Content-Disposition: attachment; filename="..."`.
- Deletes the temporary file from the server disk immediately after transmission.

---

## Verification Plan

### Automated Tests
- TypeScript compilation check: `npm run build` or `npx tsc --noEmit`.
- Next.js development server run: `npm run dev`.

### Manual Verification
1. **URL Validation:** Enter invalid URLs, verify error toasts.
2. **Analysis:** Analyze a normal YouTube video and a YouTube Short. Check metadata displays correctly.
3. **Audio Download:** Download MP3 320kbps, verify that FFmpeg correctly extracts and encodes the MP3, and the file downloads through the browser.
4. **Video Download (720p & 1080p):** Download 1080p video, verify that `yt-dlp` fetches video + audio separately, merges them using `ffmpeg-static`, and serves a single MP4 file.
5. **Theme Switching:** Toggle between light and dark modes, verify persistent states on page reload.
6. **History:** Download a video, check history update. Search for the video title. Click "Download again".
