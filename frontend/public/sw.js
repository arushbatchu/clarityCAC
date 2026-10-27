/**
 * sw.js — Clarity service worker
 * ──────────────────────────────
 * Precaches the app shell on install so the app runs fully offline
 * once it's been opened once or installed to the home screen.
 *
 * Strategy: network first, so updates show up right away. Every
 * successful response is saved, and the saved copy is used only
 * when there's no connection.
 */

const CACHE_NAME = "clarity-v1.2";
const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "./apple-touch-icon.png",
    "./icon.svg",
    "./js/main.js",
    "./js/ui.js",
    "./js/pwa.js",
    "./js/api.js",
    "./js/engine.js",
    "./js/i18n.js",
    "./js/types.js",
    "./js/rules.generated.js",
];

// Install: precache the shell
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

// Activate: purge old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME)
                    .map((k) => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: network first so updates show up right away; the saved copy is only
// used when there's no connection. That's what makes the app work offline.
self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    if (new URL(req.url).origin !== self.location.origin) return; // fonts, local API: leave alone

    event.respondWith(
        fetch(req)
            .then((res) => {
                if (res.ok && res.type === "basic") {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(req, copy));
                }
                return res;
            })
            .catch(() =>
                caches.match(req).then((cached) =>
                    cached || (req.mode === "navigate"
                        ? caches.match("./index.html")
                        : new Response("", { status: 503, statusText: "Offline" })))
            )
    );
});
