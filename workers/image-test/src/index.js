const ALLOWED_ORIGINS = new Set([
  'https://shivashisvicky.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
const MODEL = 'gemini-3.1-flash-image';
const API = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`;

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://shivashisvicky.github.io';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(origin) } });
}
async function upstream(body, key) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    return await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally { clearTimeout(timer); }
}
function imagePart(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const image = parts.find(p => p?.inlineData?.data || p?.inline_data?.data);
  if (!image) return null;
  const blob = image.inlineData || image.inline_data;
  return { data: String(blob.data), mimeType: String(blob.mimeType || blob.mime_type || 'image/png') };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    const url = new URL(request.url);
    if (url.pathname !== '/api/image') return json({ error: 'Not found' }, 404, origin);
    if (request.method !== 'POST') return json({ error: 'POST required' }, 405, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403, origin);
    const key = env.GEMINI_API_KEY;
    if (!key) return json({ error: 'Image service is not configured', code: 'IMAGE_UNAVAILABLE' }, 503, origin);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, origin); }
    const mode = body?.mode === 'generate' ? 'generate' : 'edit';
    const prompt = String(body?.prompt || '').trim();
    if (!prompt) return json({ error: 'prompt is required' }, 400, origin);
    if (prompt.length > 1800) return json({ error: 'prompt is too long' }, 413, origin);

    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    if (mode === 'edit') {
      const data = String(body?.image || '');
      const mimeType = String(body?.mimeType || 'image/jpeg');
      if (!data) return json({ error: 'image is required for edit mode' }, 400, origin);
      if (!/^image\/(jpeg|png|webp)$/i.test(mimeType)) return json({ error: 'Unsupported image type' }, 415, origin);
      if (data.length > 12_000_000) return json({ error: 'Image is too large after compression' }, 413, origin);
      contents[0].parts.push({ inline_data: { mime_type: mimeType, data } });
    }

    try {
      const response = await upstream({ contents, generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }, key);
      const data = await response.json();
      if (!response.ok) return json({ error: data?.error?.message || 'Gemini image request failed' }, response.status, origin);
      const image = imagePart(data);
      if (!image) return json({ error: 'Gemini returned no image', code: 'IMAGE_EMPTY' }, 502, origin);
      const text = String(data?.candidates?.[0]?.content?.parts?.find(p => p?.text)?.text || '').trim();
      return json({ ok: true, image, text, model: MODEL, mode }, 200, origin);
    } catch (error) {
      const message = error?.name === 'AbortError' ? 'Image generation timed out' : (error?.message || 'Image generation failed');
      return json({ error: message, code: error?.name === 'AbortError' ? 'IMAGE_TIMEOUT' : 'IMAGE_FAILED' }, error?.name === 'AbortError' ? 504 : 502, origin);
    }
  },
};
