import { getSetting } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { messages, stream = true } = body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Lấy cấu hình Custom API từ Neon DB (hoặc payload nếu có)
    const storedCfg = await getSetting('api_config', null);
    const useCustom = body?.useCustom ?? storedCfg?.useCustom;
    const baseURL = (body?.baseURL || storedCfg?.baseURL || '').replace(/\/$/, '');
    const apiKey = body?.apiKey || storedCfg?.apiKey || '';
    const model = body?.model || storedCfg?.model || 'gpt-4o';

    if (!useCustom || !baseURL || !apiKey) {
      return res.status(200).json({
        usePuter: true,
        message: 'Custom API chưa kích hoạt hoặc thiếu API Key/Base URL trong Neon DB.'
      });
    }

    const upstreamUrl = `${baseURL}/chat/completions`;
    const upstreamResp = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream: !!stream
      })
    });

    if (!upstreamResp.ok) {
      let errMsg = `Upstream error: HTTP ${upstreamResp.status}`;
      try {
        const errJson = await upstreamResp.json();
        errMsg = errJson.error?.message || errJson.message || errMsg;
      } catch (e) {
        try {
          const txt = await upstreamResp.text();
          if (txt) errMsg = txt;
        } catch (_) {}
      }
      return res.status(upstreamResp.status).json({ error: errMsg });
    }

    // Nếu không stream, trả về JSON trực tiếp
    if (!stream) {
      const data = await upstreamResp.json();
      return res.status(200).json(data);
    }

    // Hỗ trợ streaming SSE cho client
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const reader = upstreamResp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }

    res.end();
  } catch (err) {
    console.error('Chat API Error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
    res.end();
  }
}
