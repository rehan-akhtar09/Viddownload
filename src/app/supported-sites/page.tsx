import { Globe } from 'lucide-react';

const categories = [
  {
    name: 'Social Media',
    sites: ['YouTube', 'TikTok', 'Instagram', 'Twitter / X', 'Facebook', 'Reddit', 'LinkedIn', 'Pinterest', 'Snapchat'],
  },
  {
    name: 'Video Platforms',
    sites: ['Vimeo', 'Dailymotion', 'Twitch', 'Vevo', 'Vine Archive', 'VideoPress', 'Veoh', 'Metacafe'],
  },
  {
    name: 'Educational & Streaming',
    sites: ['Coursera', 'Udemy', 'Skillshare', 'Khan Academy', 'Crunchyroll', 'Funimation', 'Viki', 'TED Talks'],
  },
  {
    name: 'Music & Audio',
    sites: ['SoundCloud', 'Bandcamp', 'Mixcloud', 'Audiomack', 'Shazam', 'Spotify (metadata)', 'Tidal', 'Deezer'],
  },
  {
    name: 'News & Media',
    sites: ['BBC', 'CNN', 'Fox News', 'NBC', 'NPR', 'Bloomberg', 'The Guardian', 'Vox Media'],
  },
];

export default function SupportedSites() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20 space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-black/10 dark:border-white/10">
          <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Supported Sites</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Thousands of platforms, one downloader</p>
          </div>
        </div>

        <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
          All Video Downloader is powered by yt-dlp, which supports over 1,700 websites and platforms. Here are some of the most popular ones we support. Some platforms may require the content to be public, and download success can vary by platform due to each site's own restrictions.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10"
            >
              <h2 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">{cat.name}</h2>
              <ul className="space-y-1">
                {cat.sites.map((site) => (
                  <li
                    key={site}
                    className="text-sm text-neutral-600 dark:text-neutral-300 flex items-center gap-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    {site}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <section className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 border-t border-black/10 dark:border-white/10 pt-8">
          <p>
            Don&apos;t see your favorite site? Paste any video URL into All Video Downloader and try it. If it doesn&apos;t work, let us know at{' '}
            <a href="mailto:rehan.ibex04@gmail.com" className="text-red-600 dark:text-red-400 hover:underline">
              rehan.ibex04@gmail.com
            </a>{' '}
            and we will look into adding support.
          </p>
        </section>
      </div>
    </div>
  );
}
