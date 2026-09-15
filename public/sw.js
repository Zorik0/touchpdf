// TouchPDF v1 installed a Workbox service worker at /sw.js that cached the old
// app. Browsers that still have it check this file for updates; this version
// clears those caches, removes itself and reloads open tabs onto the new site.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: "window" });
      for (const client of windows) client.navigate(client.url);
    })(),
  );
});
