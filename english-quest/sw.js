/* old copy moved: remove any old offline cache */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((k) => Promise.all(k.map((n) => caches.delete(n)))).then(() => self.registration.unregister())));
