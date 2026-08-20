const ALLOWED_ORIGINS = new Set([
  'https://shivashisvicky.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models';

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://shivashisvicky.github.io';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
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

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === 'GET') {
      return json({
        ok: true,
        service: 'JARVIS Intelligence Gateway',
        provider: 'gemini',
        model: GEMINI_MODEL,
        status: 'online',
      }, 200, origin);
    }

    if (request.method !== 'POST') return json({ error: 'POST required' }, 405, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403, origin);
    if (!env.GEMINI_API_KEY) return json({ error: 'Gemini API key is not configured', code: 'INTELLIGENCE_UNAVAILABLE' }, 503, origin);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, origin); }
    const query = String(body?.query || '').trim();
    if (!query) return json({ error: 'query is required' }, 400, origin);
    if (query.length > 4000) return json({ error: 'query is too long' }, 413, origin);

    const system = 'You are JARVIS, the intelligence layer of a personal operating system. Be concise, useful and truthful. Do not invent facts or sources. Use Google Search grounding when current information, recent events, recommendations or verification would improve the answer. Prefer a direct answer followed by a short explanation or next action. Do not claim to have performed an action unless the application explicitly did it. For media requests, identify useful candidates or explain what to search; never fabricate video IDs.';
    const endpoint = `${GEMINI_API}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

    try {
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: query }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 900 },
        }),
      });
      const data = await upstream.json();
      if (!upstream.ok) {
        const message = data?.error?.message || 'Gemini request failed';
        return json({ error: message, code: upstream.status === 429 ? 'GEMINI_RATE_LIMITED' : 'GEMINI_REQUEST_FAILED' }, upstream.status, origin);
      }
      const text = String(data?.candidates?.[0]?.content?.parts?.map(part => part?.text || '').join('') || '').trim();
      if (!text) return json({ error: 'Gemini returned no text', code: 'EMPTY_RESPONSE' }, 502, origin);
      const grounding = data?.candidates?.[0]?.groundingMetadata;
      const sources = Array.isArray(grounding?.groundingChunks)
        ? grounding.groundingChunks.map(chunk => chunk?.web).filter(source => source?.uri).slice(0, 6)
          .map(source => ({ title: String(source.title || source.uri), uri: String(source.uri) }))
        : [];
      return json({ text, model: GEMINI_MODEL, provider: 'gemini', gateway: 'direct-google-ai-studio', grounded: sources.length > 0, sources }, 200, origin);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Intelligence gateway failed', code: 'GATEWAY_FAILED' }, 502, origin);
    }
  },
};