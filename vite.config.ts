import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  server: {
    host: true,
    port: 3000
  },
  plugins: [
    {
      name: 'inject-sw-assets',
      closeBundle() {
        const distDir = path.resolve('dist');
        const swPath = path.join(distDir, 'sw.js');
        if (!fs.existsSync(swPath)) return;

        const assetsDir = path.join(distDir, 'assets');
        const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
        const assetPaths = assetFiles.map((f) => `./assets/${f}`);

        let swContent = fs.readFileSync(swPath, 'utf-8');
        const precacheList = [
          './',
          './index.html',
          './manifest.webmanifest',
          './favicon.svg',
          './icon-192.svg',
          './icon-512.svg',
          ...assetPaths
        ];

        swContent = swContent.replace(
          /const PRECACHE_ASSETS = \[[\s\S]*?\];/,
          `const PRECACHE_ASSETS = ${JSON.stringify(precacheList, null, 2)};`
        );
        fs.writeFileSync(swPath, swContent, 'utf-8');
        console.log('Injected bundle assets into dist/sw.js precache list:', assetPaths);
      }
    }
  ]
});
