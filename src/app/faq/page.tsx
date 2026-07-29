import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'What is All Video Downloader?',
    a: 'All Video Downloader is a free online video downloader that supports thousands of websites including YouTube, TikTok, Instagram, Twitter, Facebook, Vimeo, and more. Paste any video URL to download it in your preferred quality and format.',
  },
  {
    q: 'Is All Video Downloader free to use?',
    a: 'Yes, All Video Downloader is completely free. There are no hidden charges, premium tiers, or usage limits.',
  },
  {
    q: 'What video formats are supported?',
    a: 'We support MP4 (video) and MP3 (audio) formats. The available formats depend on what the source platform provides for the specific video.',
  },
  {
    q: 'Which sites are supported?',
    a: 'All Video Downloader supports YouTube, TikTok, Instagram (reels, posts, stories), Twitter/X, Facebook, Vimeo, Dailymotion, Twitch, Reddit, LinkedIn, Pinterest, and thousands of other sites through the yt-dlp engine.',
  },
  {
    q: 'Is there a limit on video length or size?',
    a: 'No artificial limits are imposed. However, very large files may take longer to process and download depending on your connection speed.',
  },
  {
    q: 'Do you store downloaded videos?',
    a: 'No. All processing happens in real-time. Downloaded files are streamed directly to you and deleted from our servers immediately after download.',
  },
  {
    q: 'Is my privacy protected?',
    a: 'Absolutely. We do not log IP addresses, track downloads, require accounts, or store any personal information. Your privacy is our priority.',
  },
  {
    q: 'Can I use All Video Downloader commercially?',
    a: 'All Video Downloader is intended for personal use only. Commercial use requires prior written consent. You must respect content creators\' copyrights.',
  },
  {
    q: 'Why is my download slow?',
    a: 'Download speed depends on your internet connection, the source server\'s speed, and the file size. We process downloads as fast as the source allows.',
  },
  {
    q: 'What should I do if a site is not supported?',
    a: 'All Video Downloader uses yt-dlp which supports thousands of sites. If a particular site doesn\'t work, please contact us with the URL and we\'ll investigate.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No registration or account is required. Simply paste a URL and download.',
  },
  {
    q: 'Can I download YouTube playlists or entire channels?',
    a: 'Currently, All Video Downloader supports single video downloads only. Playlist and channel download may be added in a future update.',
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20 space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-black/10 dark:border-white/10">
          <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Frequently Asked Questions</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Everything you need to know</p>
          </div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 overflow-hidden"
            >
              <summary className="flex items-center justify-between p-4 md:p-5 cursor-pointer list-none font-semibold text-sm md:text-base text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                {faq.q}
                <svg
                  className="h-5 w-5 shrink-0 text-neutral-400 group-open:rotate-180 transition-transform"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm md:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-black/10 dark:border-white/10 pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
