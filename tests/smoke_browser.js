import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

// 1. Simple local static HTTP server serving dist/
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

const PORT = 8089;
server.listen(PORT, async () => {
  console.log(`Test static server running at http://127.0.0.1:${PORT}`);

  const browserPath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  console.log(`Using browser: ${browserPath}`);

  const chromeProc = spawn(browserPath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `http://127.0.0.1:${PORT}`
  ]);

  // Give browser a moment to launch
  await new Promise((r) => setTimeout(r, 2000));

  try {
    // Connect to CDP
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');

    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('No inspectable page found');
    }

    console.log(`Connecting to CDP target: ${pageTarget.title}`);

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

    // Enable console & runtime
    await send('Console.enable');
    await send('Runtime.enable');
    await send('Page.enable');

    const consoleLogs = [];
    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Console.messageAdded') {
        consoleLogs.push(data.params.message.text);
      }
    });

    // Wait 2 seconds for app to initialize Three.js scene & main menu
    await new Promise((r) => setTimeout(r, 2000));

    // 1. Verify Page Title
    const titleEval = await send('Runtime.evaluate', {
      expression: 'document.title'
    });
    console.log(`Page Title: "${titleEval.result.value}"`);
    if (titleEval.result.value !== 'Deepesh Dash: Campus Rush') {
      throw new Error(`Unexpected title: ${titleEval.result.value}`);
    }

    // 2. Check if Main Menu is active
    const menuEval = await send('Runtime.evaluate', {
      expression: 'document.getElementById("main-menu").classList.contains("active")'
    });
    console.log(`Main Menu Active: ${menuEval.result.value}`);
    if (!menuEval.result.value) {
      throw new Error('Main menu was not active on load');
    }

    // 3. Check Canvas element exists
    const canvasEval = await send('Runtime.evaluate', {
      expression: 'document.querySelector("#canvas-container canvas") !== null'
    });
    console.log(`Three.js WebGL Canvas Rendering: ${canvasEval.result.value}`);
    if (!canvasEval.result.value) {
      throw new Error('Canvas element not found in DOM');
    }

    // 4. Simulate Click on "PLAY NOW"
    console.log('Simulating click on "PLAY NOW"...');
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("btn-play-now").click()'
    });

    await new Promise((r) => setTimeout(r, 1000));

    // 5. Verify HUD is active and Game is Running
    const hudEval = await send('Runtime.evaluate', {
      expression: 'document.getElementById("hud-screen").classList.contains("active")'
    });
    console.log(`HUD Active after Play click: ${hudEval.result.value}`);
    if (!hudEval.result.value) {
      throw new Error('HUD screen did not become active after Play click');
    }

    // 6. Simulate Keyboard Controls (Arrow Left, Space Jump, Down Slide)
    console.log('Simulating player keyboard inputs...');
    await send('Runtime.evaluate', {
      expression: `
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      `
    });

    // Let the game run for 1.5 seconds
    await new Promise((r) => setTimeout(r, 1500));

    // 7. Check if Distance and Score progressed
    const scoreEval = await send('Runtime.evaluate', {
      expression: 'document.getElementById("hud-dist-val").textContent'
    });
    console.log(`Distance traveled: ${scoreEval.result.value}`);

    // Capture screenshot
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('dist/smoke-screenshot.png', Buffer.from(screenshot.data, 'base64'));
    console.log('Saved smoke test screenshot to dist/smoke-screenshot.png');

    console.log('ALL BROWSER SMOKE CHECKS PASSED PERFECTLY!');
    ws.close();
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exitCode = 1;
  } finally {
    chromeProc.kill();
    server.close();
  }
});
