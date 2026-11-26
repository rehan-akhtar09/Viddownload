'use client';

import { VideoMetadata } from '@/types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Video, Music, Calendar, Eye, Clock, Download, Loader2 } from 'lucide-react';

interface VideoDetailsProps {
  metadata: VideoMetadata;
  onDownload: (format: string, formatLabel: string) => void;
  activeDownloadFormat?: string;
}

export default function VideoDetails({ metadata, onDownload, activeDownloadFormat }: VideoDetailsProps) {
  const { title, channel, duration, uploadDate, viewCount, thumbnail, availableQualities } = metadata;

  const videoOptions = [
    { id: 'video-360p', label: 'MP4 360p', available: availableQualities['360p'] },
    { id: 'video-480p', label: 'MP4 480p', available: availableQualities['480p'] },
    { id: 'video-720p', label: 'MP4 720p', available: availableQualities['720p'] },
    { id: 'video-1080p', label: 'MP4 1080p', available: availableQualities['1080p'] },
    { id: 'video-highest', label: 'Highest Quality', available: true },
  ];

  const audioOptions = [
    { id: 'audio-128kbps', label: 'MP3 128kbps', bitrate: '128kbps' },
    { id: 'audio-192kbps', label: 'MP3 192kbps', bitrate: '192kbps' },
    { id: 'audio-320kbps', label: 'MP3 320kbps', bitrate: '320kbps' },
  ];

  const rowClasses =
    'flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 pl-3.5 transition-all duration-200 hover:border-violet-500/30 hover:bg-violet-600/5 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-white/10';

  return (
    <Card className="overflow-hidden rounded-3xl shadow-xl shadow-violet-600/5 animate-in fade-in slide-in-from-bottom-4 duration-500 dark:shadow-black/30">
      <CardContent className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Thumbnail and Metadata Tags */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="group relative aspect-video w-full overflow-hidden rounded-xl border border-neutral-200 shadow-md dark:border-white/10">
              <img
                src={thumbnail}
                alt={title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-xs font-semibold text-white">
                <Clock className="h-3.5 w-3.5" />
                <span>{duration}</span>
              </div>
            </div>

            <dl className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
              <div className="flex items-center gap-2.5">
                <dt className="font-semibold text-neutral-400 dark:text-neutral-500">Channel:</dt>
                <dd className="font-medium text-neutral-900 dark:text-white">{channel}</dd>
              </div>
              <div className="flex items-center gap-2.5">
                <Eye className="h-4 w-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                <dd>{viewCount} views</dd>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                <dd>Uploaded on {uploadDate}</dd>
              </div>
            </dl>
          </div>

          {/* Right Column: Title and Download Options */}
          <div className="lg:col-span-7 flex flex-col space-y-6 justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold leading-snug text-neutral-900 line-clamp-2 dark:text-white" title={title}>
                {title}
              </h2>
              <div className="mt-4 h-0.5 w-12 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

              {/* Video Format Section */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  <Video className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                  <span>Video (MP4)</span>
                </div>
                <div className="flex flex-col gap-2">
                  {videoOptions.map((opt) => {
                    const isDownloading = activeDownloadFormat === opt.id;
                    const isAnyDownloading = !!activeDownloadFormat;

                    return (
                      <div key={opt.id} className={rowClasses}>
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {opt.label}
                          {!opt.available && (
                            <span className="ml-2 text-[10px] font-normal italic text-neutral-400 dark:text-neutral-500">
                              (N/A)
                            </span>
                          )}
                        </span>
                        <Button
                          variant={opt.id === 'video-highest' ? 'premium' : 'outline'}
                          size="sm"
                          disabled={!opt.available || isAnyDownloading}
                          onClick={() => onDownload(opt.id, opt.label)}
                          className="h-8 min-w-[90px]"
                          aria-label={`Download ${opt.label}`}
                        >
                          {isDownloading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" />
                              <span>Download</span>
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audio Format Section */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  <Music className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Audio (MP3)</span>
                </div>
                <div className="flex flex-col gap-2">
                  {audioOptions.map((opt) => {
                    const isDownloading = activeDownloadFormat === opt.id;
                    const isAnyDownloading = !!activeDownloadFormat;

                    return (
                      <div key={opt.id} className={rowClasses}>
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{opt.label}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isAnyDownloading}
                          onClick={() => onDownload(opt.id, opt.label)}
                          className="h-8 min-w-[90px]"
                          aria-label={`Download ${opt.label}`}
                        >
                          {isDownloading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" />
                              <span>Download</span>
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
