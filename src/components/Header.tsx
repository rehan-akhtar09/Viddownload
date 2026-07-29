'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Play, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/how-to-download', label: 'How to Download' },
  { href: '/supported-sites', label: 'Supported Sites' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact-us', label: 'Contact' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 md:px-8 h-16">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="h-9 w-9 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:shadow-red-600/40 transition-shadow">
            <Play className="h-5 w-5 fill-white text-white translate-x-[1px]" />
          </div>
          <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-black to-neutral-600 dark:from-white dark:to-neutral-400">
            VeloDown
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
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
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-black/10 dark:border-white/10 bg-white dark:bg-neutral-950">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
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
