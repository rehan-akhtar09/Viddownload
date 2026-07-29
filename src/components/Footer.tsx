import Link from 'next/link';
import { Play, Mail } from 'lucide-react';

const footerLinks = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/dmca', label: 'DMCA' },
  { href: '/about', label: 'About Us' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact-us', label: 'Contact Us' },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-950 mt-auto">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
                <Play className="h-4 w-4 fill-white text-white translate-x-[1px]" />
              </div>
              <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-black to-neutral-600 dark:from-white dark:to-neutral-400">
                All Video Downloader
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
              Universal video downloader supporting YouTube, TikTok, Instagram, Twitter, Facebook, and thousands of other sites.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:rehan.ibex04@gmail.com"
                  className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  rehan.ibex04@gmail.com
                </a>
              </li>
            </ul>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 pt-2">
              For personal use only. Respect content creators&apos; rights.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 flex items-center justify-center gap-4">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            &copy; {new Date().getFullYear()} All Video Downloader. All rights reserved.
          </p>
          <Link href="/admin" className="text-xs text-neutral-500 hover:text-red-400 transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
