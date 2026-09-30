import { getDb, getDatabaseUrl, getSetting, setSetting } from './db.js';

export default async function handler(req, res) {
  // Cho phép CORS nếu cần
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const dbUrl = getDatabaseUrl();

  // GET: Lấy cấu hình từ Neon PostgreSQL
  if (req.method === 'GET') {
    if (!dbUrl) {
      return res.status(200).json({
        databaseConnected: false,
        message: 'DATABASE_URL chưa được cấu hình trên Vercel.',
        apiConfig: null,
        systemPrompt: null,
        savedPrompts: []
      });
    }

    try {
      const apiConfig = await getSetting('api_config', {
        useCustom: false,
        baseURL: '',
        apiKey: '',
        model: 'gpt-4o'
      });

      const systemPrompt = await getSetting('system_prompt', {
        enabled: false,
        name: '',
        content: ''
      });

      const savedPrompts = await getSetting('saved_prompts', []);

      return res.status(200).json({
        databaseConnected: true,
        apiConfig,
        systemPrompt,
        savedPrompts
      });
    } catch (err) {
      return res.status(500).json({
        databaseConnected: false,
        error: err.message
      });
    }
  }

  // POST: Lưu cấu hình vào Neon PostgreSQL
  if (req.method === 'POST') {
    if (!dbUrl) {
      return res.status(400).json({
        success: false,
        error: 'Chưa cấu hình DATABASE_URL trong Environment Variables của Vercel.'
      });
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { apiConfig, systemPrompt, savedPrompts } = body;

      if (apiConfig) {
        await setSetting('api_config', apiConfig);
      }
      if (systemPrompt) {
        await setSetting('system_prompt', systemPrompt);
      }
      if (savedPrompts) {
        await setSetting('saved_prompts', savedPrompts);
      }

      return res.status(200).json({
        success: true,
        message: 'Đã lưu cấu hình thành công vào Neon PostgreSQL'
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
