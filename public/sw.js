const CACHE_NAME = "protograph-app-v1";

function getBaseHref() {
  const swUrl = new URL(self.location.href);
  return swUrl.pathname.replace(/sw\.js$/, "");
}

function getPrecacheUrls() {
  const baseHref = getBaseHref();
  return [
    new URL(baseHref, self.location.origin).toString(),
    new URL(`${baseHref}index.html`, self.location.origin).toString(),
    new URL(`${baseHref}manifest.webmanifest`, self.location.origin).toString()
  ];
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(getPrecacheUrls())));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => cached);

      return cached ?? fetchPromise;
    })
  );
});
