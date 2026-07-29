import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from './providers';
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
  title: 'VeloDown - Modern YouTube Video & Audio Downloader',
  description: 'Download YouTube videos, Shorts, and audio streams in high quality (MP4/MP3) instantly. Premium glassmorphism design, fast, and zero ads.',
  keywords: ['youtube downloader', 'youtube to mp3', 'youtube to mp4', 'download shorts', 'youtube video downloader', 'shorts downloader'],
  authors: [{ name: 'VeloDown Team' }],
  openGraph: {
    title: 'VeloDown - Modern YouTube Video & Audio Downloader',
    description: 'Download YouTube videos and audios in high quality instantly with zero ads.',
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
