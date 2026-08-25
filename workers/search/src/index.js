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

function json(data, status, origin, cache = 'no-store') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache, ...cors(origin) },
  });
}

function clean(value) {
  return String(value || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtml(value) {
  return String(value || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2F;/gi, '/').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function isVideoUrl(link) {
  try { return /(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)vimeo\.com$|(^|\.)dailymotion\.com$/i.test(new URL(link).hostname); } catch { return false; }
}

function videoIntent(query) { return /\b(video|videos|youtube|watch|trailer|song|music video)\b/i.test(query); }

function searchTerms(query) {
  return String(query || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function resultScore(query, item) {
  const normalizedQuery = String(query || '').toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
  const title = String(item?.title || '').toLowerCase();
  const snippet = String(item?.snippet || '').toLowerCase();
  const hay = `${title} ${snippet}`;
  const terms = searchTerms(normalizedQuery).filter(term => term.length > 1);
  let score = 0;
  if (normalizedQuery && title.includes(normalizedQuery)) score += 100;
  if (normalizedQuery && snippet.includes(normalizedQuery)) score += 45;
  if (terms.length) {
    const titleHits = terms.filter(term => title.includes(term)).length;
    const bodyHits = terms.filter(term => snippet.includes(term)).length;
    score += titleHits * 12 + bodyHits * 3;
    if (titleHits === terms.length) score += 30;
    if (bodyHits === terms.length) score += 10;
  }
  if (hay.includes('wikipedia') && normalizedQuery && !title.includes(normalizedQuery)) score -= 8;
  return score;
}

function normalizeResults(items, query) {
  const allowVideo = videoIntent(query), seen = new Set();
  return items.map(item => ({ title: clean(decodeHtml(item.title)), link: String(item.link || '').trim(), source: clean(decodeHtml(item.source || 'WEB')), snippet: clean(decodeHtml(item.snippet || '')) }))
    .filter(item => item.title && /^https?:\/\//i.test(item.link))
    .filter(item => allowVideo || !isVideoUrl(item.link))
    .filter(item => !seen.has(item.link) && (seen.add(item.link), true))
    .sort((a, b) => resultScore(query, b) - resultScore(query, a))
    .slice(0, 8);
}

async function fetchText(url, headers = {}, ms = 6500) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), ms);
  try { const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 JARVIS Search/1.0', ...headers }, redirect: 'follow', signal: controller.signal, cf: { cacheTtl: 30, cacheEverything: false } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return await response.text(); }
  finally { clearTimeout(timer); }
}

async function fetchJson(url, headers = {}, ms = 4500) {
  try { const text = await fetchText(url, { Accept: 'application/json', ...headers }, ms); return JSON.parse(text); } catch { return null; }
}

const POI = {
  restaurant: { search: 'restaurant', key: 'amenity', values: ['restaurant', 'fast_food', 'food_court'] },
  cafe: { search: 'cafe', key: 'amenity', values: ['cafe'] },
  hospital: { search: 'hospital', key: 'amenity', values: ['hospital'] },
  pharmacy: { search: 'pharmacy', key: 'amenity', values: ['pharmacy'] },
  hotel: { search: 'hotel', key: 'tourism', values: ['hotel'] },
  school: { search: 'school', key: 'amenity', values: ['school'] },
  bank: { search: 'bank', key: 'amenity', values: ['bank'] },
  atm: { search: 'atm', key: 'amenity', values: ['atm'] },
  fuel: { search: 'fuel', key: 'amenity', values: ['fuel'] },
  gym: { search: 'gym', key: 'leisure', values: ['fitness_centre'] },
  supermarket: { search: 'supermarket', key: 'shop', values: ['supermarket'] },
  temple: { search: 'temple', key: 'amenity', values: ['place_of_worship'] },
};

function km(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function dedupe(items, limit, lat, lon) {
  const seen = new Set(), out = [];
  for (const item of items) {
    const nameKey = clean(item.name).toLowerCase();
    if (!nameKey || seen.has(nameKey)) continue;
    seen.add(nameKey);
    const distance = km(lat, lon, item.lat, item.lon);
    out.push({ ...item, distance });
    if (out.length >= limit) break;
  }
  return out.sort((a, b) => a.distance - b.distance).slice(0, limit);
}

async function photonPlaces(kind, lat, lon, radius, limit) {
  const u = new URL('https://photon.komoot.io/api/');
  u.searchParams.set('q', `${kind.search}`); u.searchParams.set('lat', lat); u.searchParams.set('lon', lon); u.searchParams.set('limit', '60');
  const data = await fetchJson(u.toString(), {}, 4500); const results = [];
  for (const feature of Array.isArray(data?.features) ? data.features : []) {
    const p = feature.properties || {}, key = String(p.osm_key || p.key || '').toLowerCase(), value = String(p.osm_value || p.value || '').toLowerCase();
    if (key !== kind.key || !kind.values.includes(value)) continue;
    const coordinates = feature.geometry?.coordinates || [], itemLat = Number(coordinates[1]), itemLon = Number(coordinates[0]);
    if (!Number.isFinite(itemLat) || !Number.isFinite(itemLon)) continue;
    const distance = km(lat, lon, itemLat, itemLon); if (distance > radius / 1000) continue;
    results.push({ name: String(p.name || '').trim(), display: [p.street, p.district, p.city].filter(Boolean).join(' · '), lat: itemLat, lon: itemLon });
  }
  return dedupe(results, limit, lat, lon);
}

async function overpassPlaces(kind, lat, lon, radius, limit) {
  const filters = kind.values.map(v => `nwr["${kind.key}"="${v}"][name](around:${radius},${lat},${lon});`).join('');
  const u = new URL('https://overpass-api.de/api/interpreter'); u.searchParams.set('data', `[out:json][timeout:5];(${filters});out center tags;`);
  const data = await fetchJson(u.toString(), {}, 5500); const results = [];
  for (const element of Array.isArray(data?.elements) ? data.elements : []) {
    const tags = element.tags || {}, itemLat = Number(element.lat ?? element.center?.lat), itemLon = Number(element.lon ?? element.center?.lon);
    if (!Number.isFinite(itemLat) || !Number.isFinite(itemLon)) continue;
    const value = String(tags[kind.key] || '').toLowerCase(); if (!kind.values.includes(value)) continue;
    results.push({ name: String(tags.name || '').trim(), display: [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'], tags['addr:city']].filter(Boolean).join(' · '), lat: itemLat, lon: itemLon });
  }
  return dedupe(results, limit, lat, lon);
}

async function nominatimPlaces(kind, lat, lon, radius, limit) {
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.searchParams.set('format', 'jsonv2'); u.searchParams.set('q', `${kind.search} near ${lat},${lon}`); u.searchParams.set('limit', '50'); u.searchParams.set('countrycodes', 'in'); u.searchParams.set('addressdetails', '1');
  const data = await fetchJson(u.toString(), { 'Accept-Language': 'en' }, 4500); const results = [];
  for (const item of Array.isArray(data) ? data : []) {
    const cls = String(item.class || '').toLowerCase(), type = String(item.type || '').toLowerCase(); if (cls !== kind.key || !kind.values.includes(type)) continue;
    const itemLat = Number(item.lat), itemLon = Number(item.lon); if (!Number.isFinite(itemLat) || !Number.isFinite(itemLon)) continue;
    if (km(lat, lon, itemLat, itemLon) > radius / 1000) continue;
    results.push({ name: String(item.name || item.display_name || '').split(',')[0].trim(), display: String(item.display_name || ''), lat: itemLat, lon: itemLon });
  }
  return dedupe(results, limit, lat, lon);
}

async function places(kindName, lat, lon, radius, limit) {
  const kind = POI[kindName]; if (!kind) return [];
  const providers = [photonPlaces(kind, lat, lon, radius, limit), overpassPlaces(kind, lat, lon, radius, limit), nominatimPlaces(kind, lat, lon, radius, limit)];
  const pending = providers.map(p => p.then(results => results.length ? results : Promise.reject(new Error('empty'))));
  try { return await Promise.any(pending); } catch { return []; }
}

async function bingSearch(query) {
  const queries = [query];
  const cleaned = String(query || '').trim();
  if (/\s/.test(cleaned) && !/^".*"$/.test(cleaned)) queries.unshift(`"${cleaned.replace(/"/g, '')}"`);
  const responses = await Promise.allSettled(queries.map(searchQuery => fetchText(`https://www.bing.com/search?format=rss&q=${encodeURIComponent(searchQuery)}`, { Accept: 'application/rss+xml, application/xml, text/xml' })));
  const items = [];
  for (const response of responses) {
    if (response.status !== 'fulfilled') continue;
    const xml = response.value;
    for (const item of (xml.match(/<item>[\s\S]*?<\/item>/gi) || [])) items.push({ title: item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '', link: item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '', source: 'Bing', snippet: item.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '' });
  }
  return normalizeResults(items, cleaned);
}

async function braveSearch(query) {
  const html = await fetchText(`https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web`, { Accept: 'text/html,application/xhtml+xml' });
  const items = []; for (const anchor of (html.match(/<a[^>]+class=["'][^"']*result-header[^"']*["'][^>]*>[\s\S]*?<\/a>/gi) || [])) items.push({ title: anchor.match(/<span[^>]*>([\s\S]*?)<\/span>/i)?.[1] || anchor, link: anchor.match(/href=["']([^"']+)["']/i)?.[1] || '', source: 'Brave', snippet: '' });
  return normalizeResults(items, query);
}

async function searchWeb(provider, query) {
  if (provider === 'brave') {
    try {
      const brave = await braveSearch(query);
      if (brave.length) return { results: brave, provider: 'brave', requestedProvider: 'brave', fallback: false };
    } catch {}
  }
  const bing = await bingSearch(query);
  if (bing.length) return { results: bing, provider: 'bing', requestedProvider: provider, fallback: provider !== 'bing' };
  throw new Error('No web search provider returned usable results');
}

export default {
  async fetch(request) {
    const url = new URL(request.url), origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (url.pathname === '/' && request.method === 'GET') return json({ ok: true, service: 'JARVIS Search Gateway', providers: ['brave', 'bing'], places: true }, 200, origin);
    if (url.pathname === '/api/places' && request.method === 'GET') {
      if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed', results: [] }, 403, origin);
      const kind = String(url.searchParams.get('kind') || '').trim().toLowerCase();
      const lat = Number(url.searchParams.get('lat')), lon = Number(url.searchParams.get('lon'));
      const radius = Math.min(Math.max(Number(url.searchParams.get('radius') || 5000), 500), 10000), limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 6), 1), 30);
      if (!POI[kind] || !Number.isFinite(lat) || !Number.isFinite(lon)) return json({ error: 'kind, lat and lon are required', results: [] }, 400, origin);
      try { const results = await places(kind, lat, lon, radius, limit); return json({ ok: true, kind, results }, 200, origin, 'public, max-age=20, stale-while-revalidate=30'); } catch (error) { return json({ error: String(error?.message || error), results: [] }, 502, origin); }
    }
    if (url.pathname !== '/api/search' || request.method !== 'GET') return json({ error: 'Not found' }, 404, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403, origin);
    const q = String(url.searchParams.get('q') || '').trim(), provider = url.searchParams.get('provider') === 'brave' ? 'brave' : 'bing';
    if (!q) return json({ error: 'q is required', results: [] }, 400, origin); if (q.length > 300) return json({ error: 'q is too long', results: [] }, 413, origin);
    try { const result = await searchWeb(provider, q); return json({ ...result, query: q }, 200, origin); } catch (error) { return json({ error: String(error?.message || error), code: 'SEARCH_UNAVAILABLE', results: [], provider, requestedProvider: provider, fallback: false }, 502, origin); }
  },
};
