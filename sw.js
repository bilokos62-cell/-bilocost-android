/* Bilocost PWA service worker.
 * Deliberately network-only: never cache authenticated or marketplace data.
 * This worker currently handles lifecycle/update only; Firebase traffic remains direct.
 */
const BILOCOST_SW_VERSION = "bilocost-pwa-v1";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});
