import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../index.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://chickenroad.gg';

export const metadata: Metadata = {
  title: 'Chicken Road — Win SOL Every 5 Minutes',
  description: 'Cross the road, top the leaderboard, win the prize pot. A Solana-powered skill game.',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: 'Chicken Road — Win SOL Every 5 Minutes',
    description: 'Cross lanes, top the leaderboard, win real SOL every 5 minutes. Powered by $CHICKEN on Solana.',
    url: BASE_URL,
    siteName: 'Chicken Road',
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: 'Chicken Road' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chicken Road — Win SOL Every 5 Minutes',
    description: 'Cross lanes, top the leaderboard, win real SOL every 5 minutes.',
    images: ['/og.svg'],
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
