const ALLOWED_ORIGINS = new Set([
  'https://shivashisvicky.github.io',
  'https://jarvis-media.shivashisvicky112.workers.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_REFERRER = 'https://shivashisvicky.github.io/';

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://shivashisvicky.github.io';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(origin) } });
}
function clean(item) {
  const id = String(item?.id || '').trim();
  if (!YT_ID.test(id)) return null;
  return {
    id,
    title: String(item?.title || 'YouTube video').trim(),
    channel: String(item?.channel || 'YouTube').trim(),
    thumbnail: String(item?.thumbnail || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`).trim(),
  };
}

async function searchYouTube(query, key) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', '12');
  url.searchParams.set('q', query);
  url.searchParams.set('key', key);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      Accept: 'application/json',
      Referer: YOUTUBE_REFERRER,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data?.error?.message || `YouTube API HTTP ${response.status}`), { status: response.status, code: data?.error?.errors?.[0]?.reason || 'YOUTUBE_API_FAILED' });
  const seen = new Set();
  const results = [];
  for (const item of data?.items || []) {
    const result = clean({
      id: item?.id?.videoId,
      title: item?.snippet?.title,
      channel: item?.snippet?.channelTitle,
      thumbnail: item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url,
    });
    if (result && !seen.has(result.id)) { seen.add(result.id); results.push(result); }
  }
  return results;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'GET') return json({ error: 'GET required' }, 405, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403, origin);
    if (url.pathname === '/') return json({ ok: true, service: 'JARVIS Media Gateway', provider: 'youtube-data-api', configured: Boolean(env.YOUTUBE_API_KEY) }, 200, origin);
    if (url.pathname !== '/api/search') return json({ error: 'Not found' }, 404, origin);
    const query = String(url.searchParams.get('q') || '').trim();
    if (!query) return json({ error: 'q is required', results: [] }, 400, origin);
    if (query.length > 200) return json({ error: 'q is too long', results: [] }, 413, origin);
    if (!env.YOUTUBE_API_KEY) return json({ error: 'YouTube API key is not configured', code: 'MEDIA_API_KEY_MISSING', results: [] }, 503, origin);
    try {
      const results = await searchYouTube(query, env.YOUTUBE_API_KEY);
      return json({ results, provider: 'youtube-data-api', query }, 200, origin);
    } catch (error) {
      return json({ error: error?.message || 'YouTube search failed', code: error?.code || 'YOUTUBE_SEARCH_FAILED', results: [], query }, error?.status === 429 ? 429 : 502, origin);
    }
  },
};
