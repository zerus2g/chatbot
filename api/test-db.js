import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let dbUrl = getDatabaseUrl();

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (body?.connectionString) {
        dbUrl = body.connectionString.trim();
      }
    } catch (e) {}
  }

  if (!dbUrl) {
    return res.status(400).json({
      ok: false,
      error: 'Chưa có chuỗi kết nối DATABASE_URL. Hãy tạo database trên https://neon.com/ và thêm DATABASE_URL.'
    });
  }

  const t0 = Date.now();
  try {
    const sql = neon(dbUrl);
    const result = await sql`SELECT version(), current_database(), current_user;`;
    const elapsed = Date.now() - t0;

    return res.status(200).json({
      ok: true,
      latency_ms: elapsed,
      version: result[0]?.version || 'PostgreSQL (Neon)',
      database: result[0]?.current_database || 'neondb',
      user: result[0]?.current_user || 'default',
      source: dbUrl.includes('neon.tech') ? 'Neon Serverless Postgres' : 'PostgreSQL'
    });
  } catch (err) {
    const elapsed = Date.now() - t0;
    return res.status(500).json({
      ok: false,
      latency_ms: elapsed,
      error: err.message || 'Không thể kết nối đến Neon Database'
    });
  }
}
