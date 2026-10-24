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

const PORT = 8090;
server.listen(PORT, async () => {
  const browserPath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  const chromeProc = spawn(browserPath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,720',
    `http://127.0.0.1:${PORT}`
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9223/json');
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

    await new Promise((r) => setTimeout(r, 1500));

    // 1. Capture Main Menu Screenshot
    const ssMenu = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('dist/menu-screenshot.png', Buffer.from(ssMenu.data, 'base64'));
    console.log('Saved dist/menu-screenshot.png');

    // 2. Click Play Now
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("btn-play-now").click()'
    });
    await new Promise((r) => setTimeout(r, 1500));
    const ssGame = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('dist/ingame-screenshot.png', Buffer.from(ssGame.data, 'base64'));
    console.log('Saved dist/ingame-screenshot.png');

    // 3. Click Pause Button
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("btn-hud-pause").click()'
    });
    await new Promise((r) => setTimeout(r, 500));
    const ssPause = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('dist/pause-screenshot.png', Buffer.from(ssPause.data, 'base64'));
    console.log('Saved dist/pause-screenshot.png');

    // 4. Click Resume Button
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("btn-pause-resume").click()'
    });
    await new Promise((r) => setTimeout(r, 500));

    console.log('ALL UI SCREENSHOTS CAPTURED SUCCESSFULLY!');
    ws.close();
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  } finally {
    chromeProc.kill();
    server.close();
  }
});
