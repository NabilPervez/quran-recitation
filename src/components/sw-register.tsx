'use client';
import { useEffect } from 'react';

// Registers the offline service worker (public/sw.js) in production builds, then
// hands it the files this page already loaded so the first offline launch works.
export function SWRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    navigator.serviceWorker.register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        const urls = [location.href, ...performance.getEntriesByType('resource').map((e) => e.name)];
        reg.active?.postMessage({ type: 'CACHE_URLS', urls });
      })
      .catch((err) => console.error('SW registration failed', err));
  }, []);
  return null;
}
