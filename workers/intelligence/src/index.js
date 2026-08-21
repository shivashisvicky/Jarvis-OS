const ALLOWED_ORIGINS = new Set([
  'https://shivashisvicky.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models';
const INTELLIGENCE_PATHS = new Set(['/api/intelligence', '/api/openai-intelligence']);

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://shivashisvicky.github.io';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
  });
}

const SYSTEM = 'You are JARVIS, the intelligence layer of a personal operating system. Be concise, useful and truthful. Do not invent facts or sources. Prefer a direct answer followed by a short explanation or next action. Do not claim to have performed an action unless the application explicitly did it. For media requests, identify useful candidates or explain what to search; never fabricate video IDs.';

async function callGemini(query, apiKey) {
  const endpoint = `${GEMINI_API}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: query }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data?.error?.message || 'Gemini request failed'), { status: response.status, provider: 'gemini' });
  const text = String(data?.candidates?.[0]?.content?.parts?.map(part => part?.text || '').join('') || '').trim();
  if (!text) throw Object.assign(new Error('Gemini returned no text'), { status: 502, provider: 'gemini' });
  return { text, model: GEMINI_MODEL, provider: 'gemini', grounded: false, sources: [] };
}

async function callGroq(query, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, temperature: 0.2, max_tokens: 700, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: query }] }),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data?.error?.message || 'Groq request failed'), { status: response.status, provider: 'groq' });
  const text = String(data?.choices?.[0]?.message?.content || '').trim();
  if (!text) throw Object.assign(new Error('Groq returned no text'), { status: 502, provider: 'groq' });
  return { text, model: GROQ_MODEL, provider: 'groq', grounded: false, sources: [] };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method === 'GET' && url.pathname === '/') {
      return json({ ok: true, service: 'JARVIS Intelligence Gateway', providers: { gemini: Boolean(env.GEMINI_API_KEY), groq: Boolean(env.GROQ_API_KEY) }, model: GEMINI_MODEL }, 200, origin);
    }
    if (!INTELLIGENCE_PATHS.has(url.pathname)) return json({ error: 'Not found' }, 404, origin);
    if (request.method !== 'POST') return json({ error: 'POST required' }, 405, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403, origin);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, origin); }
    const query = String(body?.query || '').trim();
    if (!query) return json({ error: 'query is required' }, 400, origin);
    if (query.length > 4000) return json({ error: 'query is too long' }, 413, origin);

    const errors = [];
    if (env.GEMINI_API_KEY) {
      try { return json(await callGemini(query, env.GEMINI_API_KEY), 200, origin); }
      catch (error) {
        errors.push({ provider: 'gemini', status: error?.status || 502, error: error?.message || 'request failed' });
        if (error?.status && ![401, 403, 429].includes(error.status)) return json({ error: error.message, code: 'GEMINI_REQUEST_FAILED' }, error.status, origin);
      }
    }

    if (env.GROQ_API_KEY) {
      try { return json({ ...(await callGroq(query, env.GROQ_API_KEY)), fallback: true, fallbackFrom: 'gemini' }, 200, origin); }
      catch (error) { errors.push({ provider: 'groq', status: error?.status || 502, error: error?.message || 'request failed' }); }
    }

    if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY) return json({ error: 'No intelligence provider is configured', code: 'INTELLIGENCE_UNAVAILABLE' }, 503, origin);
    return json({ error: 'All configured intelligence providers are unavailable', code: 'INTELLIGENCE_RATE_LIMITED', providers: errors }, 429, origin);
  },
};