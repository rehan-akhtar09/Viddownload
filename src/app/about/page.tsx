import { Info, Zap, Globe, Lock } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Fast & Free',
    desc: 'High-speed downloads with no hidden fees or premium tiers. Download as many videos as you want.',
  },
  {
    icon: Globe,
    title: 'Universal Support',
    desc: 'Works with YouTube, TikTok, Instagram, Twitter, Facebook, Vimeo, Dailymotion, and thousands more.',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    desc: 'We do not log your IP, track your downloads, or store your files. Your privacy matters.',
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20 space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-black/10 dark:border-white/10">
          <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Info className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">About All Video Downloader</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Built for speed, designed for everyone</p>
          </div>
        </div>

        <section className="space-y-6 text-sm md:text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p>
            All Video Downloader was created to solve a simple problem: downloading video content from the web should be fast, free, and hassle-free. No sign-ups, no ads, no file limits — just paste a link and download.
          </p>
          <p>
            We support the widest range of platforms of any free online downloader. From major social media networks to niche video platforms, All Video Downloader works with thousands of sites using the latest version of yt-dlp under the hood.
          </p>
          <p>
            Our mission is to provide a tool that respects your privacy while delivering maximum utility. We do not store your downloaded files, track your activity, or require an account. Every download is processed on-the-fly and served directly to you.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Why All Video Downloader?</h2>
          <div className="grid gap-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10">
                <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-white">{f.title}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="text-sm md:text-base leading-relaxed text-neutral-500 dark:text-neutral-400 border-t border-black/10 dark:border-white/10 pt-8">
          <p>
            Have questions or feedback? Reach out at{' '}
            <a href="mailto:rehan.ibex04@gmail.com" className="text-red-600 dark:text-red-400 hover:underline">
              rehan.ibex04@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
