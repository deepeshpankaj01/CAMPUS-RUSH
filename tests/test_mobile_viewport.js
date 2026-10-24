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

const PORT = 8091;
server.listen(PORT, async () => {
  const browserPath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  const chromeProc = spawn(browserPath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=390,844',
    `http://127.0.0.1:${PORT}`
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9224/json');
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
    const viewports = [
      { name: 'Narrow Android', width: 320, height: 640 },
      { name: 'Mid Android', width: 360, height: 740 },
      { name: 'Standard iPhone', width: 390, height: 844, capture: true },
      { name: 'Large iPhone', width: 430, height: 932 },
      { name: 'Foldable Inner', width: 780, height: 800 },
      { name: 'Short Landscape', width: 640, height: 320 },
      { name: 'Wide Landscape', width: 844, height: 390 },
    ];

    console.log('Testing mobile viewports and layout integrity...');

    // First test menu on standard iPhone and capture mobile-menu.png
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise((r) => setTimeout(r, 1500));

    // 1. Mobile Menu Screenshot
    const ssMenu = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('dist/mobile-menu.png', Buffer.from(ssMenu.data, 'base64'));
    console.log('Saved dist/mobile-menu.png');

    // 2. Click Play Now
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("btn-play-now").click()'
    });
    await new Promise((r) => setTimeout(r, 1500));

    // 3. Mobile In-Game Screenshot
    const ssGame = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('dist/mobile-game.png', Buffer.from(ssGame.data, 'base64'));
    console.log('Saved dist/mobile-game.png');

    // 4. Test all viewports during active game
    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: true
      });
      await new Promise((r) => setTimeout(r, 300));

      const overflowCheck = await send('Runtime.evaluate', {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth
        })`,
        returnByValue: true
      });

      const pauseBtnCheck = await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.getElementById('btn-hud-pause');
          if (!btn) return { exists: false };
          const rect = btn.getBoundingClientRect();
          return {
            exists: true,
            visible: rect.width > 0 && rect.height > 0,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            windowWidth: window.innerWidth,
            withinBounds: rect.right <= window.innerWidth && rect.left >= 0
          };
        })()`,
        returnByValue: true
      });

      console.log(`[Viewport: ${vp.name} (${vp.width}x${vp.height})]`);
      console.log(`  Horizontal overflow: ${overflowCheck.result.value.hasOverflow ? 'FAIL' : 'PASS (No horizontal scroll)'} (${overflowCheck.result.value.scrollWidth}px vs ${overflowCheck.result.value.innerWidth}px)`);
      console.log(`  Pause button in bounds: ${pauseBtnCheck.result.value.withinBounds ? 'PASS' : 'FAIL'} (${pauseBtnCheck.result.value.width}x${pauseBtnCheck.result.value.height}px, right edge ${pauseBtnCheck.result.value.right}px / ${pauseBtnCheck.result.value.windowWidth}px)`);

      if (overflowCheck.result.value.hasOverflow) {
        throw new Error(`Horizontal overflow detected at ${vp.width}x${vp.height}`);
      }
      if (!pauseBtnCheck.result.value.withinBounds) {
        throw new Error(`Pause button clipped at ${vp.width}x${vp.height}`);
      }
    }

    console.log('ALL MOBILE VIEWPORT TESTS PASSED PERFECTLY!');
    ws.close();
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  } finally {
    chromeProc.kill();
    server.close();
  }
});
