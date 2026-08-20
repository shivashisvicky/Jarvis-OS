const ALLOWED_ORIGINS = new Set([
  'https://shivashisvicky.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

function corsHeaders(origin) {
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
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (url.pathname !== '/api/openai-intelligence') {
      return json({ ok: true, service: 'JARVIS Intelligence Gateway' }, 200, origin);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') return json({ error: 'POST required' }, 405, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403, origin);
    if (!env.OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY is not configured', code: 'INTELLIGENCE_UNAVAILABLE' }, 503, origin);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, origin);
    }

    const query = String(body?.query || '').trim();
    if (!query) return json({ error: 'query is required' }, 400, origin);
    if (query.length > 4000) return json({ error: 'query is too long' }, 413, origin);

    const system = [
      'You are JARVIS, the intelligence layer of a personal operating system.',
      'Be concise, useful and truthful. Do not invent sources or facts.',
      'When current information is needed, use web search.',
      'Prefer a direct answer, then a short explanation or next action.',
      'Do not claim to have performed an action unless the application explicitly did it.',
      'For media requests, identify useful candidates or explain what to search; never fabricate video IDs.',
      'When web search is used, preserve useful source links in the response when available.'
    ].join(' ');

    try {
      const upstream = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-5.6-luna',
          input: [
            { role: 'system', content: system },
            { role: 'user', content: query },
          ],
          tools: [{ type: 'web_search' }],
          max_output_tokens: 900,
          store: false,
        }),
      });

      const data = await upstream.json();
      if (!upstream.ok) {
        return json({ error: data?.error?.message || 'OpenAI request failed' }, upstream.status, origin);
      }

      const text = String(data?.output_text || '').trim();
      if (!text) return json({ error: 'OpenAI returned no text' }, 502, origin);

      return json({ text, model: env.OPENAI_MODEL || 'gpt-5.6-luna' }, 200, origin);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Intelligence gateway failed' }, 502, origin);
    }
  },
};
