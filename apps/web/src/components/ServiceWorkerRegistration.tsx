'use client';

import { useEffect } from 'react';
import { basePath } from '@/lib/deployment';

/**
 * Registers the service worker.
 *
 * next-pwa is configured with `register: true`, which is meant to do this for
 * you — and does, by injecting a registration entry into `_app`. There is no
 * `_app` here. This application is App Router throughout, so next-pwa built
 * `sw.js` on every production build and shipped it, and nothing ever called
 * `navigator.serviceWorker.register`. The manifest said "offline-first", the
 * workspace queued registrations for a connection that had dropped, and the
 * assets to render the page after a reload were never cached.
 *
 * The scope is the base path rather than `/`: a service worker's default scope
 * is the directory it is served from, and on a project site that is `/GCOMS/`.
 * Asking for a wider scope than the script's own directory is refused by the
 * browser, so this has to match the deployment.
 *
 * Development is excluded because next-pwa is configured not to emit `sw.js`
 * there, so registering would only produce a 404 in the console.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register(`${basePath}/sw.js`, { scope: `${basePath}/` })
      .catch((error) => {
        // Not fatal: the app works online without it. Worth saying out loud
        // rather than swallowing, because the failure mode it produces —
        // nothing cached, offline reload shows a browser error page — looks
        // like a bug in the queue rather than a missing worker.
        console.error('Service worker registration failed', error);
      });
  }, []);

  return null;
}
