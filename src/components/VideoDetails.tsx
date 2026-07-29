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

  return (
    <Card className="overflow-hidden border border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardContent className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Thumbnail and Metadata Tags */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 shadow-lg group">
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
            
            <div className="space-y-2 text-neutral-300 text-sm">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-neutral-400">Channel:</span>
                <span className="text-white font-medium">{channel}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Eye className="h-4 w-4 text-neutral-400" />
                <span>{viewCount} views</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <span>Uploaded on {uploadDate}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Title and Download Options */}
          <div className="lg:col-span-7 flex flex-col space-y-6 justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white leading-snug line-clamp-2" title={title}>
                {title}
              </h2>
              <div className="h-0.5 w-12 bg-red-600 mt-4 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              
              {/* Video Format Section */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-300 uppercase tracking-wider">
                  <Video className="h-4.5 w-4.5 text-red-500" />
                  <span>Video (MP4)</span>
                </div>
                <div className="flex flex-col gap-2">
                  {videoOptions.map((opt) => {
                    const isDownloading = activeDownloadFormat === opt.id;
                    const isAnyDownloading = !!activeDownloadFormat;
                    
                    return (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-200"
                      >
                        <span className="text-sm font-medium text-neutral-200">
                          {opt.label}
                          {!opt.available && (
                            <span className="text-[10px] ml-2 text-neutral-500 italic font-normal">
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
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-300 uppercase tracking-wider">
                  <Music className="h-4.5 w-4.5 text-amber-500" />
                  <span>Audio (MP3)</span>
                </div>
                <div className="flex flex-col gap-2">
                  {audioOptions.map((opt) => {
                    const isDownloading = activeDownloadFormat === opt.id;
                    const isAnyDownloading = !!activeDownloadFormat;
                    
                    return (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-200"
                      >
                        <span className="text-sm font-medium text-neutral-200">{opt.label}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isAnyDownloading}
                          onClick={() => onDownload(opt.id, opt.label)}
                          className="h-8 min-w-[90px] border-white/10 hover:border-white/20"
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
