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
  console.log(`[Mobile Viewport Test] Static server running at http://127.0.0.1:${PORT}`);

  const browserPath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  const chromeProc = spawn(browserPath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=800,1000',
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

    // Start game so HUD is visible for layout verification
    console.log('Starting game to test HUD at multiple viewports...');
    await new Promise((r) => setTimeout(r, 1000));
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("btn-play-now").click()'
    });
    await new Promise((r) => setTimeout(r, 800));

    // Test cases covering required widths: 320, 360, 390, 430, 780 + landscape
    const viewports = [
      { name: '320px-portrait', width: 320, height: 640 },
      { name: '360px-portrait', width: 360, height: 740 },
      { name: '390px-portrait', width: 390, height: 844 },
      { name: '430px-portrait', width: 430, height: 932 },
      { name: '780px-foldable', width: 780, height: 800 },
      { name: '320px-landscape', width: 640, height: 320 },
      { name: '390px-landscape', width: 844, height: 390 }
    ];

    for (const vp of viewports) {
      console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: true
      });

      await new Promise((r) => setTimeout(r, 600));

      // 1. Verify no horizontal overflow
      const overflowEval = await send('Runtime.evaluate', {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          bodyScrollWidth: document.body.scrollWidth
        })`,
        returnByValue: true
      });
      const overflow = overflowEval.result.value;
      console.log(`ScrollWidth: ${overflow.scrollWidth}px, InnerWidth: ${overflow.innerWidth}px`);
      if (overflow.scrollWidth > overflow.innerWidth) {
        throw new Error(`Horizontal overflow detected at ${vp.name}: scrollWidth ${overflow.scrollWidth} > innerWidth ${overflow.innerWidth}`);
      }

      // 2. Verify Pause Button is within viewport
      const pauseBoundsEval = await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.getElementById("btn-hud-pause");
          if (!btn) return null;
          const rect = btn.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
          };
        })()`,
        returnByValue: true
      });

      const pb = pauseBoundsEval.result.value;
      console.log(`Pause button bounds: left=${pb.left}, right=${pb.right}, top=${pb.top}, bottom=${pb.bottom}, winW=${pb.windowWidth}`);
      if (!pb || pb.left < 0 || pb.right > pb.windowWidth || pb.top < 0 || pb.bottom > pb.windowHeight) {
        throw new Error(`Pause button clipped outside viewport in ${vp.name}: right=${pb.right}, winWidth=${pb.windowWidth}`);
      }
      if (pb.width < 38 || pb.height < 38) {
        throw new Error(`Pause button touch target too small in ${vp.name}: ${pb.width}x${pb.height}`);
      }

      // 3. Verify Distance / Coins legible and in-bounds
      const distBoundsEval = await send('Runtime.evaluate', {
        expression: `(() => {
          const pill = document.querySelector(".hud-pill.distance");
          if (!pill) return null;
          const rect = pill.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, winW: window.innerWidth };
        })()`,
        returnByValue: true
      });
      const db = distBoundsEval.result.value;
      if (!db || db.left < 0 || db.right > db.winW) {
        throw new Error(`Distance pill clipped in ${vp.name}: right=${db.right}, winWidth=${db.winW}`);
      }

      // 4. Capture screenshot
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      const filename = `dist/viewport-${vp.name}.png`;
      fs.writeFileSync(filename, Buffer.from(ss.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }

    console.log('\n>>> ALL 7 VIEWPORT TESTS PASSED WITH ZERO CLIPPING! <<<');
    ws.close();
  } catch (err) {
    console.error('Mobile viewport test failed:', err);
    process.exitCode = 1;
  } finally {
    chromeProc.kill();
    server.close();
  }
});
