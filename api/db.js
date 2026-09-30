import { neon } from '@neondatabase/serverless';

let sqlClient = null;

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || '';
}

export function getDb() {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return null;
  if (!sqlClient) {
    sqlClient = neon(dbUrl);
  }
  return sqlClient;
}

/**
 * Tự động khởi tạo bảng lưu trữ nếu chưa có trong Neon PostgreSQL
 */
export async function initDbSchema() {
  const sql = getDb();
  if (!sql) return false;

  await sql`
    CREATE TABLE IF NOT EXISTS aria_settings (
      key VARCHAR(64) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  return true;
}

export async function getSetting(key, defaultValue = null) {
  const sql = getDb();
  if (!sql) return defaultValue;

  try {
    await initDbSchema();
    const rows = await sql`
      SELECT value FROM aria_settings WHERE key = ${key} LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      return rows[0].value;
    }
    return defaultValue;
  } catch (err) {
    console.error(`Error reading setting [${key}]:`, err);
    return defaultValue;
  }
}

export async function setSetting(key, value) {
  const sql = getDb();
  if (!sql) throw new Error('DATABASE_URL chưa được cấu hình');

  await initDbSchema();
  await sql`
    INSERT INTO aria_settings (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, CURRENT_TIMESTAMP)
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
  `;
  return true;
}
