import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer, request as proxyRequest } from 'node:http';
import path from 'node:path';

const root = path.resolve('dist');
const port = Number(process.env.PREVIEW_PORT || 4173);
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

createServer(async (request, response) => {
  if (request.url.startsWith('/api/')) {
    const api = proxyRequest({
      hostname: 'localhost',
      port: 3000,
      path: request.url,
      method: request.method,
      headers: request.headers
    }, apiResponse => {
      response.writeHead(apiResponse.statusCode || 502, apiResponse.headers);
      apiResponse.pipe(response);
    });
    api.on('error', () => {
      response.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ message: 'La API no está disponible. Iníciala con npm run dev.' }));
    });
    request.pipe(api);
    return;
  }

  const requested = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const file = path.resolve(root, `.${requested}`);

  if (!file.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`Vista previa: http://localhost:${port}`));
