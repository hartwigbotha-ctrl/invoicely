// Minimal service worker — its only job is to satisfy PWA installability
// criteria (Chrome/Android requires a registered service worker with a
// fetch handler before it will fire the "beforeinstallprompt" event that
// powers the in-app "Add to Home Screen" button). It intentionally does no
// caching, so the app always loads fresh from the network.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: let the browser handle every request normally.
});
