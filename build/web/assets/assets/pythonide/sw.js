self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", function (e) {
    if (e.request.cache === "only-if-cached" && e.request.mode !== "same-origin") return;
    e.respondWith(
        fetch(e.request).then(function (response) {
            if (response.status === 0) return response;
            const newHeaders = new Headers(response.headers);
            newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
            newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
            newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            });
        }).catch(function (err) {
            console.error(err);
            return new Response("Network error", { status: 503 });
        })
    );
});
