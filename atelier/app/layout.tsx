import type { Metadata, Viewport } from 'next';
import { Lora } from 'next/font/google';
import Nav from './nav';
import './globals.css';

const lora = Lora({ subsets: ['latin'], weight: ['400', '700'], variable: '--serif' });

export const metadata: Metadata = {
  title: 'atelier',
  description: 'plan, cut and post — calmly.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'atelier', statusBarStyle: 'default' },
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#ffffff' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={lora.variable}>
      <body>
        <main>{children}</main>
        <Nav />
      </body>
    </html>
  );
}
