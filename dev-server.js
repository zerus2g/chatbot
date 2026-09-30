import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tải file .env đơn giản nếu có
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

const PORT = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

  // Mock res.status và res.json giống Vercel Serverless
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (data) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(data));
    return res;
  };

  // Đọc body nếu có (POST / PUT)
  let rawBody = '';
  await new Promise(resolve => {
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', () => {
      try {
        req.body = rawBody ? JSON.parse(rawBody) : {};
      } catch (e) {
        req.body = rawBody;
      }
      resolve();
    });
  });

  // Serverless API routes
  if (pathname === '/api/config') {
    const mod = await import(`./api/config.js?t=${Date.now()}`);
    return mod.default(req, res);
  }
  if (pathname === '/api/test-db') {
    const mod = await import(`./api/test-db.js?t=${Date.now()}`);
    return mod.default(req, res);
  }
  if (pathname === '/api/chat') {
    const mod = await import(`./api/chat.js?t=${Date.now()}`);
    return mod.default(req, res);
  }

  // Tĩnh (Static files)
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const absPath = path.join(__dirname, filePath);

  if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
    const ext = path.extname(absPath);
    res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
    fs.createReadStream(absPath).pipe(res);
  } else {
    res.status(404).end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 ARIA Local Dev Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`- Chat:  http://localhost:${PORT}/index.html`);
  console.log(`- Admin: http://localhost:${PORT}/admin.html`);
  console.log(`- Neon DB Status: ${process.env.DATABASE_URL ? 'Đã thiết lập' : 'Chưa có DATABASE_URL (dùng localStorage fallback)'}\n`);
});
