// ═══════════════════════════════════════════════════════════════════
//  Service Worker — App Inventory (PWA)
//  Permite instalar la app y que funcione offline (app shell + assets).
//  Los datos de Firestore NO se cachean aquí: Firestore ya tiene su propia
//  persistencia offline. Sube la versión del CACHE para forzar actualización.
// ═══════════════════════════════════════════════════════════════════
const CACHE = "appinv-v2";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/01-config.js",
  "./js/02-storage.js",
  "./js/03-auth.js",
  "./js/04-ui-state.js",
  "./js/05-seed-data.js",
  "./js/06-rendering.js",
  "./js/07-labs.js",
  "./js/08-navigation.js",
  "./js/09-inventory-tools.js",
  "./js/10-login-users.js",
  "./js/11-loans.js",
  "./js/12-backup-print.js",
  "./js/13-init.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Hosts dinámicos (backend): nunca se interceptan ni cachean.
const DYNAMIC_HOSTS = [
  "firestore.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "www.googleapis.com",
  "api.emailjs.com"
];

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (DYNAMIC_HOSTS.includes(url.hostname)) return; // deja pasar a la red

  // Navegación: network-first (recibe actualizaciones), fallback al index cacheado.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Mismo origen (iconos, manifest): cache-first.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
      )
    );
    return;
  }

  // Terceros estáticos (fuentes de Google, SDK de Firebase): stale-while-revalidate.
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchP = fetch(req)
        .then((res) => {
          if (res && (res.status === 200 || res.type === "opaque")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchP;
    })
  );
});
