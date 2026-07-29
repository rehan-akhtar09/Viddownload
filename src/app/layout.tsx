import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from './providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'All Video Downloader - Universal Video Downloader',
  description: 'Download videos from YouTube, TikTok, Instagram, Twitter, Facebook, and more in high quality (MP4/MP3) instantly.',
  keywords: ['video downloader', 'youtube to mp3', 'tiktok downloader', 'instagram video downloader', 'twitter video downloader'],
  authors: [{ name: 'All Video Downloader Team' }],
  openGraph: {
    title: 'All Video Downloader - Universal Video Downloader',
    description: 'Download videos from any site in high quality instantly with zero ads.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100 transition-colors duration-300">
        <ThemeProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
