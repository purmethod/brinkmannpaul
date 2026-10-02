import type { Metadata, Viewport } from 'next';
import Nav from './nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'cutcake',
  description: 'cut it, plan it, post it.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'cutcake', statusBarStyle: 'default' },
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f4f1' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Nav />
      </body>
    </html>
  );
}
