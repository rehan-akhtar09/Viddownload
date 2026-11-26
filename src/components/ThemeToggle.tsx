'use client';

import { useTheme } from '@/app/providers';
import { Button } from './ui/button';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid SSR hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="bg-white/5 border-white/10 opacity-0">
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden rounded-xl active:scale-95 transition-all duration-200"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative h-5 w-5 flex items-center justify-center">
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-amber-400 animate-in spin-in-90 duration-350" />
        ) : (
          <Moon className="h-5 w-5 text-violet-500 animate-in spin-in-90 duration-350" />
        )}
      </div>
    </Button>
  );
}
