/* sw.js — cache offline dell'app shell.
 * Quando aggiorni i file, incrementa CACHE_NAME (es. cacciaTI-v2) così i
 * telefoni scaricano la nuova versione invece di restare sulla vecchia cache. */

const CACHE_NAME = "cacciaTI-v2.2";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/rules-engine.js",
  "./js/storage.js",
  "./js/app.js",
  "./data/regolamento_2026.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    // cache: "reload" evita di riempire la nuova cache con copie vecchie
    // prese dalla cache HTTP del browser (GitHub Pages le tiene ~10 minuti).
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" })))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Rete prima, cache solo come ripiego: con connessione si vede sempre
// l'ultima versione; con segnale assente o debole (bosco, montagna) dopo
// NETWORK_TIMEOUT_MS si usa la copia salvata, così l'app non resta appesa.
const NETWORK_TIMEOUT_MS = 3500;

function networkFirst(request) {
  return new Promise((resolve) => {
    let settled = false;
    const useCache = () =>
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        if (cached && !settled) { settled = true; resolve(cached); }
        return cached;
      });

    const timer = setTimeout(useCache, NETWORK_TIMEOUT_MS);

    fetch(request, { cache: "no-cache" })
      .then((resp) => {
        clearTimeout(timer);
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        if (!settled) { settled = true; resolve(resp); }
      })
      .catch(() => {
        clearTimeout(timer);
        useCache().then((cached) => {
          if (!settled) { settled = true; resolve(cached || Response.error()); }
        });
      });
  });
}

// L'app chiede la versione attiva per mostrarla nell'intestazione.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "GET_VERSION" && event.ports[0]) {
    event.ports[0].postMessage(CACHE_NAME);
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(event.request));
});
