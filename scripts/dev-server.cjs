'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const handlers = {
  '/api/catalog': require('../api/catalog'),
  '/api/checkout': require('../api/checkout'),
  '/api/order': require('../api/order'),
};
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (handlers[url.pathname]) { await handlers[url.pathname](req, res); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filename = path.resolve(root, `.${relative}`);
    if (!filename.startsWith(root + path.sep) || relative.split('/').some((part) => part.startsWith('.'))) { res.writeHead(404); res.end(); return; }
    const content = await fs.readFile(filename);
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    if (!res.headersSent) res.writeHead(404);
    res.end('not found');
  }
});
const port = Number(process.env.PORT || 8766);
server.listen(port, '127.0.0.1', () => console.log(`Shop preview: http://127.0.0.1:${port}`));
