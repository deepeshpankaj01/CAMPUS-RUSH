import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath);
  const mime = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
});

const PORT = 8092;
server.listen(PORT, async () => {
  console.log(`[Offline Test] Server online at http://127.0.0.1:${PORT}`);

  const browserPath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  const chromeProc = spawn(browserPath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--no-sandbox',
    `http://127.0.0.1:${PORT}`
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9225/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let msgId = 1;
    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve, reject) => {
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await new Promise((resolve) => ws.addEventListener('open', resolve));
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');

    console.log('[Step 1] Loading game online to seed service worker cache...');
    await new Promise((r) => setTimeout(r, 2500));

    // Check service worker registered
    const swCheck = await send('Runtime.evaluate', {
      expression: 'Boolean(navigator.serviceWorker && navigator.serviceWorker.controller)'
    });
    console.log(`[Step 1 Result] Service Worker Active/Controlling: ${swCheck.result.value}`);

    // Set a high score in localStorage to test persistence through offline reload
    await send('Runtime.evaluate', {
      expression: `
        const data = JSON.parse(localStorage.getItem('campus_rush_save_v1') || '{}');
        data.highScore = 99999;
        localStorage.setItem('campus_rush_save_v1', JSON.stringify(data));
      `
    });

    console.log('[Step 2] Disconnecting network (Simulating 100% OFFLINE mode)...');
    await send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });

    // Also close the local HTTP server to guarantee zero network traffic can succeed!
    await new Promise((resolve) => server.close(resolve));
    console.log('[Step 2 Result] HTTP server completely shut down. Network is completely DEAD.');

    console.log('[Step 3] Reloading page while 100% OFFLINE...');
    await send('Page.reload');

    // Give page 2 seconds to load from Cache Storage
    await new Promise((r) => setTimeout(r, 2000));

    // Verify Title
    const titleRes = await send('Runtime.evaluate', {
      expression: 'document.title'
    });
    console.log(`[Offline Verify] Page Title from Cache: "${titleRes.result.value}"`);
    if (titleRes.result.value !== 'Campus Rush') {
      throw new Error(`Failed to load page title offline: ${titleRes.result.value}`);
    }

    // Verify Canvas Element
    const canvasRes = await send('Runtime.evaluate', {
      expression: 'document.querySelector("#canvas-container canvas") !== null'
    });
    console.log(`[Offline Verify] 3D Canvas Rendering from Cache: ${canvasRes.result.value}`);
    if (!canvasRes.result.value) {
      throw new Error('Canvas not found offline');
    }

    // Verify High Score persisted through offline reload
    const scoreRes = await send('Runtime.evaluate', {
      expression: `JSON.parse(localStorage.getItem('campus_rush_save_v1')).highScore`
    });
    console.log(`[Offline Verify] Stored High Score survived reload: ${scoreRes.result.value}`);
    if (scoreRes.result.value !== 99999) {
      throw new Error('High score did not persist');
    }

    // Verify Gameplay starts offline
    console.log('[Step 4] Starting gameplay run while completely OFFLINE...');
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("btn-play-now").click()'
    });
    await new Promise((r) => setTimeout(r, 1200));

    const hudRes = await send('Runtime.evaluate', {
      expression: 'document.getElementById("hud-screen").classList.contains("active")'
    });
    console.log(`[Offline Verify] Gameplay HUD active offline: ${hudRes.result.value}`);
    if (!hudRes.result.value) {
      throw new Error('HUD screen not active offline');
    }

    console.log('>>> TRUE OFFLINE VERIFICATION COMPLETE & PASSED 100%! <<<');
    ws.close();
  } catch (err) {
    console.error('Offline test failed:', err);
    process.exitCode = 1;
  } finally {
    chromeProc.kill();
  }
});
