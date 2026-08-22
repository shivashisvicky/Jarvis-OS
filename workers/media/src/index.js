const ALLOWED_ORIGINS = new Set([
  'https://shivashisvicky.github.io',
  'https://jarvis-media.shivashisvicky112.workers.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_REFERRER = 'https://shivashisvicky.github.io/';
const PIPED_SEEDS = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.leptons.xyz',
  'https://pipedapi.nosebs.ru',
  'https://pipedapi-libre.kavin.rocks',
  'https://piped-api.privacy.com.de',
  'https://pipedapi.adminforge.de',
  'https://api.piped.yt',
  'https://pipedapi.drgns.space',
];

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
function mergeResults(target, seen, items, limit = 12) {
  for (const item of items || []) {
    const result = clean(item);
    if (!result || seen.has(result.id)) continue;
    seen.add(result.id);
    target.push(result);
    if (target.length >= limit) break;
  }
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
    headers: { Accept: 'application/json', Referer: YOUTUBE_REFERRER },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data?.error?.message || `YouTube API HTTP ${response.status}`), { status: response.status, code: data?.error?.errors?.[0]?.reason || 'YOUTUBE_API_FAILED' });
  const results = [];
  mergeResults(results, new Set(), (data?.items || []).map(item => ({
    id: item?.id?.videoId,
    title: item?.snippet?.title,
    channel: item?.snippet?.channelTitle,
    thumbnail: item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url,
  })));
  return results;
}

function decodeJsonString(value) {
  try { return JSON.parse(`"${value}"`); } catch { return value.replace(/\\"/g, '"').replace(/\\u0026/g, '&'); }
}

async function searchYouTubeWeb(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en&gl=US`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: YOUTUBE_REFERRER,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
    },
  });
  if (!response.ok) throw new Error(`YouTube web search HTTP ${response.status}`);
  const html = await response.text();
  const results = [];
  const seen = new Set();
  const renderer = /"videoRenderer":\{[\s\S]*?"videoId":"([A-Za-z0-9_-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/g;
  let match;
  while ((match = renderer.exec(html)) && results.length < 12) {
    mergeResults(results, seen, [{ id: match[1], title: decodeJsonString(match[2]), channel: 'YouTube' }], 12);
  }
  return results;
}

async function searchPiped(base, query) {
  const response = await fetch(`${base}/search?q=${encodeURIComponent(query)}&filter=videos`, {
    signal: AbortSignal.timeout(5000),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Piped HTTP ${response.status}`);
  const data = await response.json();
  return Array.isArray(data) ? data.map(item => ({
    id: item?.videoId || item?.url,
    title: item?.title,
    channel: item?.uploaderName || item?.uploader,
    thumbnail: item?.thumbnail,
  })) : [];
}

async function searchFallback(query) {
  try {
    const results = await searchYouTubeWeb(query);
    if (results.length >= 4) return results;
  } catch {}

  const settled = await Promise.allSettled(PIPED_SEEDS.map(base => searchPiped(base, query)));
  const results = [];
  const seen = new Set();
  for (const item of settled) {
    if (item.status !== 'fulfilled') continue;
    mergeResults(results, seen, item.value, 12);
    if (results.length >= 4) break;
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
    if (url.pathname === '/') return json({ ok: true, service: 'JARVIS Media Gateway', provider: 'youtube-data-api-with-live-fallback', configured: Boolean(env.YOUTUBE_API_KEY) }, 200, origin);
    if (url.pathname !== '/api/search') return json({ error: 'Not found' }, 404, origin);
    const query = String(url.searchParams.get('q') || '').trim();
    if (!query) return json({ error: 'q is required', results: [] }, 400, origin);
    if (query.length > 200) return json({ error: 'q is too long', results: [] }, 413, origin);

    if (env.YOUTUBE_API_KEY) {
      try {
        const results = await searchYouTube(query, env.YOUTUBE_API_KEY);
        return json({ results, provider: 'youtube-data-api', query }, 200, origin);
      } catch (error) {
        const quota = error?.status === 429 || /quota|dailyLimitExceeded|rateLimitExceeded/i.test(`${error?.message || ''} ${error?.code || ''}`);
        if (!quota) return json({ error: error?.message || 'YouTube search failed', code: error?.code || 'YOUTUBE_SEARCH_FAILED', results: [], query }, 502, origin);
      }
    }

    try {
      const results = await searchFallback(query);
      if (results.length) return json({ results, provider: 'youtube-live-fallback', query }, 200, origin);
      return json({ error: 'No live video providers returned results', code: 'MEDIA_NO_RESULTS', results: [], query }, 503, origin);
    } catch (error) {
      return json({ error: error?.message || 'Live video search failed', code: 'MEDIA_FALLBACK_FAILED', results: [], query }, 502, origin);
    }
  },
};