const ALLOWED_ORIGINS = new Set([
  'https://shivashisvicky.github.io',
  'https://jarvis-intelligence.shivashisvicky112.workers.dev',
  'https://jarvis-search.shivashisvicky112.workers.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://shivashisvicky.github.io',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(origin) } });
}
function clean(value) { return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
async function gdelt(query) {
  const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.searchParams.set('query', query);
  url.searchParams.set('mode', 'artlist');
  url.searchParams.set('format', 'json');
  url.searchParams.set('maxrecords', '8');
  url.searchParams.set('timespan', '7d');
  url.searchParams.set('sort', 'datedesc');
  const r = await fetch(url, { headers: { Accept: 'application/json' }, cf: { cacheTtl: 30, cacheEverything: false } });
  if (!r.ok) throw new Error(`GDELT HTTP ${r.status}`);
  const data = await r.json();
  return (data.articles || []).slice(0, 8).map(a => ({ title: clean(a.title) || 'Untitled', link: a.url || '#', source: a.domain || a.sourcecountry || 'WEB', snippet: clean(a.seendate || '') }));
}
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (url.pathname === '/' && request.method === 'GET') return json({ ok: true, service: 'JARVIS Search Gateway' }, 200, origin);
    if (url.pathname !== '/api/search' || request.method !== 'GET') return json({ error: 'Not found' }, 404, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403, origin);
    const q = String(url.searchParams.get('q') || '').trim();
    if (!q) return json({ error: 'q is required' }, 400, origin);
    if (q.length > 300) return json({ error: 'q is too long' }, 413, origin);
    try {
      const results = await gdelt(q);
      return json({ results, provider: 'GDELT', query: q }, 200, origin);
    } catch (error) {
      return json({ error: String(error?.message || error), code: 'SEARCH_UNAVAILABLE', results: [] }, 502, origin);
    }
  },
};
