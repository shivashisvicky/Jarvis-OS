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
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(origin) },
  });
}

function clean(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function isVideoUrl(link) {
  try {
    const host = new URL(link).hostname;
    return /(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)vimeo\.com$|(^|\.)dailymotion\.com$/i.test(host);
  } catch {
    return false;
  }
}

function videoIntent(query) {
  return /\b(video|videos|youtube|watch|trailer|song|music video)\b/i.test(query);
}

function normalizeResults(items, query) {
  const allowVideo = videoIntent(query);
  const seen = new Set();
  return items
    .map(item => ({
      title: clean(decodeHtml(item.title)),
      link: String(item.link || '').trim(),
      source: clean(decodeHtml(item.source || 'WEB')),
      snippet: clean(decodeHtml(item.snippet || '')),
    }))
    .filter(item => item.title && /^https?:\/\//i.test(item.link))
    .filter(item => allowVideo || !isVideoUrl(item.link))
    .filter(item => {
      if (seen.has(item.link)) return false;
      seen.add(item.link);
      return true;
    })
    .slice(0, 8);
}

async function fetchText(url, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 JARVIS Search/1.0', ...headers },
      redirect: 'follow',
      signal: controller.signal,
      cf: { cacheTtl: 30, cacheEverything: false },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function bingSearch(query) {
  const url = `https://www.bing.com/search?format=rss&q=${encodeURIComponent(query)}`;
  const xml = await fetchText(url, { Accept: 'application/rss+xml, application/xml, text/xml' });
  const items = [];
  const matches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  for (const item of matches) {
    const title = item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
    const link = item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '';
    const description = item.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '';
    items.push({ title, link, source: 'Bing', snippet: description });
  }
  return normalizeResults(items, query);
}

async function braveSearch(query) {
  const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web`;
  const html = await fetchText(url, { Accept: 'text/html,application/xhtml+xml' });
  const items = [];
  const anchors = html.match(/<a[^>]+class=["'][^"']*result-header[^"']*["'][^>]*>[\s\S]*?<\/a>/gi) || [];
  for (const anchor of anchors) {
    const href = anchor.match(/href=["']([^"']+)["']/i)?.[1] || '';
    const title = anchor.match(/<span[^>]*>([\s\S]*?)<\/span>/i)?.[1] || anchor;
    items.push({ title, link: href, source: 'Brave', snippet: '' });
  }
  if (items.length) return normalizeResults(items, query);
  return [];
}

async function searchWeb(provider, query) {
  if (provider === 'brave') {
    try {
      const brave = await braveSearch(query);
      if (brave.length) return { results: brave, provider: 'Brave' };
    } catch {}
  }
  const bing = await bingSearch(query);
  if (bing.length) return { results: bing, provider: 'Bing' };
  throw new Error('No web search provider returned usable results');
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (url.pathname === '/' && request.method === 'GET') {
      return json({ ok: true, service: 'JARVIS Search Gateway', providers: ['brave', 'bing'] }, 200, origin);
    }
    if (url.pathname !== '/api/search' || request.method !== 'GET') return json({ error: 'Not found' }, 404, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403, origin);

    const q = String(url.searchParams.get('q') || '').trim();
    const provider = url.searchParams.get('provider') === 'brave' ? 'brave' : 'bing';
    if (!q) return json({ error: 'q is required', results: [] }, 400, origin);
    if (q.length > 300) return json({ error: 'q is too long', results: [] }, 413, origin);

    try {
      const result = await searchWeb(provider, q);
      return json({ ...result, query: q }, 200, origin);
    } catch (error) {
      return json({ error: String(error?.message || error), code: 'SEARCH_UNAVAILABLE', results: [], provider }, 502, origin);
    }
  },
};
