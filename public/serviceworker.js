const CACHE_NAME = "mtstreams-shell-v3";
const APP_SHELL = ["/", "/index.html", "/offline.html", "/manifest.json"];

self.addEventListener("install", (event) => {
      event.waitUntil(
            caches.open(CACHE_NAME)
                  .then((cache) => cache.addAll(APP_SHELL))
                  .catch((error) => console.warn("MTStreams could not cache the app shell:", error.message))
                  .then(() => self.skipWaiting())
      );
});

self.addEventListener("activate", (event) => {
      event.waitUntil(
            caches.keys()
                  .then((keys) =>
                        Promise.all(
                              keys
                                    .filter((key) => key.startsWith("mtstreams-shell-") && key !== CACHE_NAME)
                                    .map((key) => caches.delete(key))
                        )
                  )
                  .then(() => self.clients.claim())
      );
});

self.addEventListener("fetch", (event) => {
      const request = event.request;

      if (request.method !== "GET" || request.headers.has("range")) return;

      const url = new URL(request.url);

      if (url.origin !== self.location.origin) return;
      if (url.pathname.startsWith("/api/")) return;

      if (request.mode === "navigate") {
            event.respondWith(
                  fetch(request)
                        .then((response) => {
                              if (response.ok) {
                                    const copy = response.clone();
                                    event.waitUntil(
                                          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy))
                                    );
                              }
                              return response;
                        })
                        .catch(async () =>
                              (await caches.match("/index.html")) ||
                              (await caches.match("/offline.html"))
                        )
            );
            return;
      }

      const isStaticAsset = ["script", "style", "image", "font"].includes(request.destination);

      if (!isStaticAsset) return;

      event.respondWith(
            caches.match(request).then((cached) => {
                  if (cached) return cached;

                  return fetch(request).then((response) => {
                        if (response.ok && response.type === "basic") {
                              const copy = response.clone();
                              event.waitUntil(
                                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
                              );
                        }
                        return response;
                  });
            })
      );
});
