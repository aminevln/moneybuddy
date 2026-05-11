/// <reference lib="webworker" />

/**
 * Service Worker minimo per MoneyBuddy.
 *
 * Per ora fa solo le basi:
 * - Si installa silenziosamente
 * - Prende controllo subito (skipWaiting)
 * - Non fa caching (lo aggiungeremo dopo)
 *
 * In futuro qui gestiremo:
 * - Cache offline degli asset
 * - Push notifications
 * - Background sync per le transazioni offline
 */

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", (event) => {
  // skipWaiting fa partire subito la nuova versione del SW
  // senza aspettare che le pagine vecchie si chiudano
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  // claim() fa sì che il SW prenda controllo di tutte le tab aperte
  event.waitUntil(self.clients.claim());
});

// Per ora niente fetch handler: lasciamo che tutto vada in rete normalmente.
export {};