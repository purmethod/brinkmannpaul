'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const TABS = [
  { href: '/', label: 'week' },
  { href: '/media', label: 'media' },
  { href: '/chat', label: 'plan' },
  { href: '/settings', label: 'settings' },
];

export default function Nav() {
  const path = usePathname();
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);
  if (path.startsWith('/login') || path.startsWith('/oauth')) return null;
  return (
    <nav className="tabs" aria-label="main">
      {TABS.map((t) => {
        const active = t.href === '/' ? path === '/' : path.startsWith(t.href);
        return (
          <a key={t.href} href={t.href} aria-current={active ? 'page' : undefined}>
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}
