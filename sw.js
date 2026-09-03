// Service worker minimal : juste assez pour que le site soit installable en
// PWA (icône sur l'écran d'accueil, ouverture sans barre d'adresse).
//
// Volontairement AUCUNE mise en cache des pages/scripts : une stratégie
// réseau-d'abord-avec-repli-cache mettait en cache index.html et main.js
// séparément, ce qui pouvait servir une page neuve avec un script obsolète
// (ou l'inverse) après une mise à jour du site, cassant le chargement. On
// préfère toujours la version la plus fraîche du réseau.
const CACHE_VERSION = "cubywear-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Un handler "fetch" vide (laisse passer au réseau normalement) suffit aux
// critères d'installabilité PWA de Chrome, sans risque de désynchronisation.
self.addEventListener("fetch", () => {});
