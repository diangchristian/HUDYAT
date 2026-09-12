import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
const root = path.resolve("dist");
async function walk(dir) {
  const result = [];
  for (const item of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...await walk(file)); else result.push(file);
  }
  return result;
}
const files = (await walk(root)).filter(file => !file.endsWith(".map") && !["sw.js", "precache.json"].includes(path.basename(file))).sort();
const hash = crypto.createHash("sha256");
for (const file of files) hash.update(await fs.readFile(file));
const version = hash.digest("hex").slice(0, 16);
const assets = files.map(file => "./" + path.relative(root, file).replaceAll("\\", "/"));
if (!assets.includes("./index.html") || !assets.includes("./models/alphabet/weights.bin")) throw Error("PWA assets missing");
const worker = `
const CACHE = "hudyat-client-${version}";
const ASSETS = ${JSON.stringify(assets)};
const urls = new Set(ASSETS.map(asset => new URL(asset, self.registration.scope).href));
self.addEventListener("install", event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  // Complete this version before activating. Failed downloads leave the old worker usable.
  await cache.addAll([...urls]);
})()));
self.addEventListener("activate", event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith("hudyat-client-") && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.includes("/api/")) return;
  if (request.mode === "navigate" && request.url.startsWith(self.registration.scope)) {
    event.respondWith(fetch(request).catch(() => caches.open(CACHE).then(cache => cache.match(new URL("index.html", self.registration.scope).href)).then(response => response || Response.error())));
  } else if (urls.has(request.url)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request)));
  }
});
`;
await fs.writeFile(path.join(root, "sw.js"), worker);
await fs.writeFile(path.join(root, "precache.json"), JSON.stringify({version, assets}, null, 2));
console.log(`PWA: ${assets.length} static assets, release ${version}. API responses excluded.`);
