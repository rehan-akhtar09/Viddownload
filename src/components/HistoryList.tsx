'use client';

import { useState } from 'react';
import { HistoryItem } from '@/types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, RotateCcw, Trash2, Film, Music, Calendar, History } from 'lucide-react';

interface HistoryListProps {
  items: HistoryItem[];
  onDownloadAgain: (url: string) => void;
  onRemoveItem: (id: string) => void;
  onClearHistory: () => void;
}

export default function HistoryList({
  items,
  onDownloadAgain,
  onRemoveItem,
  onClearHistory,
}: HistoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">

      {/* History Header & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <h3 className="flex items-center gap-2.5 self-start text-lg font-bold text-neutral-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/10">
            <History className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </span>
          <span>Download History</span>
          <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
            {items.length}
          </span>
        </h3>

        {items.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onClearHistory}
            className="h-9 self-end text-xs sm:self-auto"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All</span>
          </Button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previously downloaded videos..."
              aria-label="Search download history"
              className="h-11 pl-11"
            />
          </div>

          {/* History List Items */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredItems.map((item) => {
                const isAudio = item.format.toLowerCase().includes('mp3');

                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden transition-all duration-200 hover:border-violet-500/30 hover:shadow-md dark:hover:border-white/15"
                  >
                    <CardContent className="flex h-full gap-4 p-4">
                      {/* Left Side: Thumbnail Preview */}
                      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg border border-neutral-200 dark:border-white/5">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-1 right-1 rounded bg-black/60 p-0.5 text-[9px] text-white">
                          {isAudio ? <Music className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                        </div>
                      </div>

                      {/* Right Side: Details & Actions */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="space-y-1">
                          <h4
                            className="relative truncate pr-6 text-sm font-semibold text-neutral-900 dark:text-white"
                            title={item.title}
                          >
                            {item.title}
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="absolute right-0 top-0.5 text-neutral-400 transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
                              title="Remove from history"
                              aria-label={`Remove ${item.title} from history`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </h4>

                          <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-semibold text-neutral-600 dark:border-white/5 dark:bg-white/5 dark:text-neutral-300">
                              {item.format}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {item.date}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDownloadAgain(item.url)}
                            className="h-7 w-full text-xs font-semibold"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Download Again</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-8 text-center dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No matching videos found in your history.</p>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-12 text-center dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/10">
            <Film className="h-7 w-7 text-violet-600 dark:text-violet-400" />
          </div>
          <h4 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">Your download history is waiting.</h4>
          <p className="mx-auto mt-1.5 max-w-[320px] text-sm text-neutral-500 dark:text-neutral-400">
            Videos and audio files you download will appear here for quick access.
          </p>
        </div>
      )}
    </div>
  );
}
