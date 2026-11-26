import Link from 'next/link';
import { Play, Mail } from 'lucide-react';

const exploreLinks = [
  { href: '/', label: 'Home' },
  { href: '/supported-sites', label: 'Supported Platforms' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About Us' },
  { href: '/contact-us', label: 'Contact Us' },
];

const legalLinks = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/dmca', label: 'DMCA' },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-950 mt-auto">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
                <Play className="h-4 w-4 fill-white text-white translate-x-[1px]" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-neutral-900 dark:text-white">
                All Video <span className="text-violet-600 dark:text-violet-400">Downloader</span>
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
              An easy-to-use tool for saving publicly accessible media from supported websites.
            </p>
            <a
              href="mailto:rehan.ibex04@gmail.com"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <Mail className="h-4 w-4" />
              rehan.ibex04@gmail.com
            </a>
          </div>

          <nav className="space-y-3" aria-label="Explore">
            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Explore</h3>
            <ul className="space-y-2">
              {exploreLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="space-y-3" aria-label="Legal">
            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Please Note</h3>
            <p className="text-xs leading-relaxed text-neutral-400 dark:text-neutral-500">
              All Video Downloader is intended for personal use only. All videos and media
              remain the property of their respective owners and content creators — please
              respect their rights and each platform&apos;s terms of service.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            &copy; {new Date().getFullYear()} All Video Downloader. All rights reserved.
          </p>
          <Link href="/admin" className="text-xs text-neutral-400 hover:text-violet-500 dark:text-neutral-500 dark:hover:text-violet-400 transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
