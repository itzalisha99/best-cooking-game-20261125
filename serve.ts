// Ember Kitchen — tiny static server for local playtesting only.
// Serves game/ at http://localhost:8080. Not part of the entry.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const path = join(root, url === '/' ? 'index.html' : url);
  if (!path.startsWith(root) || !existsSync(path)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
}).listen(8080, () => console.log('Ember Kitchen at http://localhost:8080'));
