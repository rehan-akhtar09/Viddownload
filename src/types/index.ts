export interface VideoMetadata {
  title: string;
  channel: string;
  duration: string;
  uploadDate: string;
  viewCount: string;
  thumbnail: string;
  url: string;
  availableQualities: {
    '360p': boolean;
    '480p': boolean;
    '720p': boolean;
    '1080p': boolean;
    'highest': boolean;
  };
  isShort: boolean;
}

export interface HistoryItem {
  id: string;
  thumbnail: string;
  title: string;
  format: string; // e.g. "MP4 1080p", "MP3 320kbps"
  date: string; // ISO date string or formatted date
  url: string;
}
