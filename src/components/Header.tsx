'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Play, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/supported-sites', label: 'Supported Platforms' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
  { href: '/#history', label: 'Download History' },
  { href: '/blog', label: 'Blog' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 bg-white/85 backdrop-blur-lg dark:border-white/10 dark:bg-neutral-950/85">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 md:px-8 h-16">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="All Video Downloader — home">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-violet-600/20 group-hover:shadow-violet-600/35 transition-shadow">
            <Play className="h-5 w-5 fill-white text-white translate-x-[1px]" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-neutral-900 dark:text-white">
            All Video <span className="text-violet-600 dark:text-violet-400">Downloader</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-violet-600/10 text-violet-700 dark:text-violet-300'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-950">
          <nav className="flex flex-col px-4 py-3 gap-1" aria-label="Mobile navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-violet-600/10 text-violet-700 dark:text-violet-300'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
