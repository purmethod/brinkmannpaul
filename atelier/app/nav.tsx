'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Icon } from './ui';

const TABS = [
  { href: '/', label: 'create', icon: 'create' },
  { href: '/channels', label: 'channels', icon: 'channels' },
  { href: '/settings', label: 'settings', icon: 'settings' },
];

export default function Nav() {
  const path = usePathname();
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);
  if (path.startsWith('/login') || path.startsWith('/oauth') || path.startsWith('/p/') || path.startsWith('/review')) return null;
  return (
    <nav className="tabs" aria-label="main">
      {TABS.map((t) => {
        const inChannels = path.startsWith('/channels') || path.startsWith('/review');
        const active = t.href === '/' ? !path.startsWith('/settings') && !inChannels : t.href === '/channels' ? inChannels : path.startsWith(t.href);
        return (
          <a key={t.href} href={t.href} aria-current={active ? 'page' : undefined}>
            <Icon name={t.icon} size={25} stroke={active ? 1.9 : 1.5} />
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}
