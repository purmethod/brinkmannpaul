import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'studio', robots: { index: false, follow: false } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <a href="/">new</a>
          <a href="/status">queue</a>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
