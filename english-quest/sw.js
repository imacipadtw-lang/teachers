/* Placeholder service worker: the pages register sw.js, but this public copy has no offline cache.
   No fetch handler, so every request goes to the network as usual. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
