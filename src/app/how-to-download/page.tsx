import { BookOpen } from 'lucide-react';

const steps = [
  {
    num: '1',
    title: 'Copy a Video URL',
    desc: 'Find a video on YouTube, TikTok, Instagram, Twitter, Facebook, or any supported site. Copy the full URL from your browser\'s address bar or the share button.',
  },
  {
    num: '2',
    title: 'Paste into All Video Downloader',
    desc: 'Go to All Video Downloader and paste the URL into the input field on the home page. Click the "Analyze" button to fetch video information.',
  },
  {
    num: '3',
    title: 'Choose Format & Quality',
    desc: 'Once the video is analyzed, you will see available formats and quality options. Select your preferred format (MP4 video or MP3 audio) and quality.',
  },
  {
    num: '4',
    title: 'Download Your File',
    desc: 'Click the "Download" button. Your browser will automatically download the file. That\'s it — no sign-ups, no ads, no limits.',
  },
];

export default function HowToDownload() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20 space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-black/10 dark:border-white/10">
          <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">How to Download</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Download any video in 4 easy steps</p>
          </div>
        </div>

        <div className="space-y-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-5 p-5 md:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10"
            >
              <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg shrink-0">
                {step.num}
              </div>
              <div>
                <h2 className="font-bold text-lg text-neutral-900 dark:text-white mb-1">{step.title}</h2>
                <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="text-sm md:text-base leading-relaxed text-neutral-500 dark:text-neutral-400 border-t border-black/10 dark:border-white/10 pt-8">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Tips for Best Results</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Use the full video URL (including https://) for best results</li>
            <li>Download from platforms you are logged into for higher quality options</li>
            <li>Video length and download speed depend on the source platform&apos;s servers</li>
            <li>MP3 audio is extracted from the video source when available</li>
            <li>You can cancel a download at any time by closing the progress bar</li>
          </ul>
        </section>

        <section className="text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            Need help? Contact us at{' '}
            <a href="mailto:rehan.ibex04@gmail.com" className="text-red-600 dark:text-red-400 hover:underline">
              rehan.ibex04@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
