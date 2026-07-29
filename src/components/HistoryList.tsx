'use client';

import { useState } from 'react';
import { HistoryItem } from '@/types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, RotateCcw, Trash2, Film, Music, Calendar } from 'lucide-react';

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
        <h3 className="text-lg font-bold text-white uppercase tracking-wider self-start flex items-center gap-2">
          <span>Download History</span>
          <span className="text-xs bg-white/10 dark:bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-semibold normal-case">
            {items.length}
          </span>
        </h3>
        
        {items.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onClearHistory}
            className="self-end sm:self-auto h-9 text-xs"
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
            <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previously downloaded videos..."
              className="pl-11 h-11"
            />
          </div>

          {/* History List Items */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const isAudio = item.format.toLowerCase().includes('mp3');
                
                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden border border-white/5 bg-white/5 dark:bg-black/10 hover:border-white/10 hover:bg-white/10 dark:hover:bg-black/20 transition-all duration-200"
                  >
                    <CardContent className="p-4 flex gap-4 h-full">
                      {/* Left Side: Thumbnail Preview */}
                      <div className="relative aspect-video w-24 shrink-0 rounded-lg overflow-hidden border border-white/5">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-1 right-1 p-0.5 bg-black/60 rounded text-[9px] text-white">
                          {isAudio ? <Music className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                        </div>
                      </div>

                      {/* Right Side: Details & Actions */}
                      <div className="flex flex-col justify-between flex-1 min-w-0">
                        <div className="space-y-1">
                          <h4
                            className="text-sm font-semibold text-white truncate pr-6 relative"
                            title={item.title}
                          >
                            {item.title}
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="absolute right-0 top-0.5 text-neutral-400 hover:text-red-500 transition-colors"
                              title="Delete from history"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </h4>
                          
                          <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-neutral-400">
                            <span className="font-semibold text-neutral-300 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                              {item.format}
                            </span>
                            <span className="flex items-center gap-1 mt-0.5">
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
                            className="h-7 w-full text-xs font-semibold hover:border-white/20"
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
            <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 bg-white/5">
              <p className="text-sm text-neutral-400">No matching videos found in your history.</p>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-white/10 bg-white/5 dark:bg-black/10">
          <Film className="h-10 w-10 text-neutral-500 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-neutral-300">Your download history is empty</h4>
          <p className="text-xs text-neutral-400 mt-1 max-w-[280px] mx-auto">
            Videos and audios you download will be stored locally here for quick access.
          </p>
        </div>
      )}
    </div>
  );
}
