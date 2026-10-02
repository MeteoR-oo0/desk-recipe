import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "/desk-recipe/",
  plugins: [
    react(),
    {
      name: "desk-recipe-offline",
      generateBundle(options, bundle) {
        const base = "/desk-recipe/";
        const assets = [
          base,
          base + "index.html",
          base + "sample-desk.png",
          base + "favicon.svg",
          base + "icon-192.png",
          base + "icon-512.png",
          base + "manifest.json",
          ...Object.keys(bundle).map((path) => base + path),
        ];
        const source = `const CACHE='desk-recipe-${Date.now()}';const ASSETS=${JSON.stringify(assets)};
      self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting()});
      self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('desk-recipe-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
      self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/desk-recipe/index.html')));return}if(ASSETS.includes(url.pathname))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)))});`;
        this.emitFile({ type: "asset", fileName: "sw.js", source });
      },
    },
  ],
});
