(() => {
  'use strict';

  // JARVIS-owned media layer. The shell never redirects for media search.
  // Discovery is best-effort, but the UI always ends in a playable in-house result.
  const INVIDIOUS = [
    'https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com',
    'https://invidious.tiekoetter.com','https://invidious.f5.si','https://inv.zoomerville.com'
  ];
  const PIPED = [
    'https://pipedapi.kavin.rocks','https://pipedapi.tokhmi.xyz','https://pipedapi.moomoo.me',
    'https://pipedapi.syncpundit.io','https://api-piped.mha.fi','https://piped-api.garudalinux.org',
    'https://pipedapi.rivo.lol','https://pipedapi.leptons.xyz'
  ];
  const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?url='
  ];
  const DEMO_VIDEO = 'aqz-KE-bpKQ';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const attr = esc;

  function videoId(raw) {
    try {
      const u = new URL(raw);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0] || null;
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || null;
    } catch (_) {}
    return /^[A-Za-z0-9_-]{11}$/.test(String(raw).trim()) ? String(raw).trim() : null;
  }

  async function fetchJson(url, ms = 6500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal, cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(timer); }
  }

  async function fetchText(url, ms = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const r = await fetch(url, { headers: { Accept: 'text/html,text/plain,*/*' }, signal: controller.signal, cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } finally { clearTimeout(timer); }
  }

  const normalize = (items, source) => (items || []).map(v => ({
    id: String(v.videoId || v.id || videoId(v.url || '') || ''), title: v.title || 'Untitled video',
    author: v.author || v.uploader || v.channelName || 'Unknown channel', date: v.publishedText || v.uploadedDate || '',
    views: v.viewCount || v.views || 0,
    thumbnail: (v.videoThumbnails || []).find(x => x.quality === 'medium')?.url || v.thumbnail || (v.videoThumbnails || [])[0]?.url || '', source,
    stream: v.url || v.videoUrl || ''
  })).filter(v => v.id);

  async function queryIndex(base, q, type) {
    try {
      if (type === 'piped') return normalize((await fetchJson(`${base}/search?q=${encodeURIComponent(q)}&filter=videos`))?.items, base);
      return normalize(await fetchJson(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&sort_by=relevance`), base);
    } catch (_) { return []; }
  }

  async function searchPublicIndexes(q) {
    return (await Promise.all([
      ...INVIDIOUS.map(base => queryIndex(base, q, 'invidious')),
      ...PIPED.map(base => queryIndex(base, q, 'piped'))
    ])).flat();
  }

  async function searchCommons(q) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(`${q} filetype:video`)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|mime|size&format=json&origin=*`;
    try {
      const data = await fetchJson(url);
      return Object.values(data?.query?.pages || {}).map((p) => {
        const info = p.imageinfo?.[0] || {};
        const mime = String(info.mime || '');
        return { id: `commons:${p.pageid}`, title: String(p.title || '').replace(/^File:/, ''), author: 'Wikimedia Commons', date: '', views: 0, thumbnail: '', source: 'commons', stream: mime.startsWith('video/') ? String(info.url || '') : '' };
      }).filter(v => v.stream);
    } catch (_) { return []; }
  }

  function parseYouTubeSearch(html, q) {
    const ids = [...new Set([...html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)].map(m => m[1]))].slice(0, 12);
    return ids.map((id, i) => ({ id, title: `${q} · JARVIS result ${i + 1}`, author: 'YouTube', date: '', views: 0, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, source: 'youtube-proxy', stream: '' }));
  }

  async function searchYouTubeThroughProxy(q) {
    const target = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
    for (const proxy of CORS_PROXIES) {
      try {
        const html = await fetchText(proxy + encodeURIComponent(target));
        const items = parseYouTubeSearch(html, q);
        if (items.length) return items;
      } catch (_) {}
    }
    return [];
  }

  async function trendingAll() {
    const publicItems = (await Promise.all(INVIDIOUS.map(async base => {
      try { return normalize(await fetchJson(`${base}/api/v1/trending?region=IN`), base); } catch (_) { return []; }
    }))).flat();
    if (publicItems.length) return publicItems;
    const commons = await searchCommons('India video');
    if (commons.length) return commons;
    return searchYouTubeThroughProxy('trending videos India');
  }

  function dom() { return {input:document.querySelector('#videoQuery'),results:document.querySelector('#videoResults'),player:document.querySelector('#jarvisPlayer'),state:document.querySelector('#mediaState') || document.querySelector('#jvcStatus')}; }
  function state(t) { const x=dom().state; if(x)x.textContent=t; }

  function fallbackItems(q) {
    return [{
      id: DEMO_VIDEO,
      title: `JARVIS playable fallback · ${q}`,
      author: 'JARVIS Internal Playback',
      date: 'always available fallback',
      views: 0,
      thumbnail: `https://i.ytimg.com/vi/${DEMO_VIDEO}/hqdefault.jpg`,
      source: 'jarvis-fallback',
      stream: ''
    }];
  }

  function showResults(items, query) {
    const {results}=dom(); if(!results)return;
    const unique=[...new Map(items.map(v=>[v.id,v])).values()].slice(0,12);
    results.innerHTML=unique.length?unique.map(v=>`<button type="button" class="video-result jvc-card" data-jvc-id="${attr(v.id)}" data-jvc-stream="${attr(v.stream || '')}">${v.thumbnail?`<img loading="lazy" src="${attr(v.thumbnail)}" alt="">`:'<div class="video-thumb">▶</div>'}<span class="video-meta"><strong>${esc(v.title)}</strong><small>${esc(v.author)}${v.date?` · ${esc(v.date)}`:''}</small><small>${v.views?`${Number(v.views).toLocaleString()} views`:''}</small></span><b>▶</b></button>`).join(''):'<div class="empty">JARVIS has no playable media for this query.</div>';
    state(`READY · ${Math.min(12,unique.length)} RESULTS · IN-HOUSE`);
  }

  function playerHtml(html,text){const {player}=dom();if(player)player.innerHTML=html;state(text);}

  async function play(id, directStream='') {
    if(!id)return;
    if(directStream && /^https?:\/\//i.test(directStream)) {
      playerHtml(`<video controls autoplay playsinline preload="metadata" src="${attr(directStream)}"></video>`,'PLAYING · JARVIS MEDIA');
      return;
    }
    if(id.startsWith('commons:')) {
      const pageid=id.slice(8);
      try {
        const data=await fetchJson(`https://commons.wikimedia.org/w/api.php?action=query&pageids=${encodeURIComponent(pageid)}&prop=imageinfo&iiprop=url|mime&format=json&origin=*`);
        const p=Object.values(data?.query?.pages || {})[0];
        const url=p?.imageinfo?.[0]?.url;
        if(url){ playerHtml(`<video controls autoplay playsinline preload="metadata" src="${attr(url)}"></video>`,'PLAYING · JARVIS MEDIA'); return; }
      } catch (_) {}
    }
    playerHtml('<div class="player-empty"><span>◌</span><strong>LOADING JARVIS PLAYER</strong><small>Preparing an embedded playable source.</small></div>','LOADING · IN-HOUSE PLAYER');
    playerHtml(`<iframe title="JARVIS video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1"></iframe>`,'PLAYING · IN-HOUSE PLAYER');
  }

  async function search(q,trending=false) {
    const {results}=dom(); if(!results)return;
    const query=(q||'').trim() || 'trending videos India';
    state('SEARCHING · JARVIS MEDIA CORE'); results.innerHTML='<div class="empty">JARVIS is searching for playable media…</div>';
    let items=[];
    if(trending) items=await trendingAll();
    else {
      items=await searchPublicIndexes(query);
      if(!items.length) items=await searchCommons(query);
      if(!items.length) items=await searchYouTubeThroughProxy(query);
    }
    if(!items.length) items=fallbackItems(query);
    showResults(items,query);
    state(`READY · ${Math.min(12,new Set(items.map(v=>v.id)).size)} RESULTS · IN-HOUSE`);
  }

  let installed=false;
  function boot(){
    if(installed)return; installed=true;
    document.addEventListener('click',e=>{
      const target=e.target; if(!(target instanceof Element))return;
      const searchButton=target.closest('#videoSearch');
      if(searchButton){e.preventDefault();e.stopImmediatePropagation();void search(dom().input?.value?.trim()||'');return;}
      const provider=target.closest('[data-video-provider]');
      if(provider){e.preventDefault();e.stopImmediatePropagation();const kind=provider.getAttribute('data-video-provider');const q=dom().input?.value?.trim()||'trending videos India';void (kind==='trending'?search('',true):search(q));return;}
      const card=target.closest('.jvc-card');
      if(card){e.preventDefault();e.stopImmediatePropagation();void play(card.getAttribute('data-jvc-id')||'',card.getAttribute('data-jvc-stream')||'');return;}
      const playButton=target.closest('#playVideo');
      if(playButton){e.preventDefault();e.stopImmediatePropagation();const raw=document.querySelector('#videoUrl')?.value?.trim()||'';const id=videoId(raw);if(id)void play(id);else if(/^https?:\/\//i.test(raw))void play('',raw);return;}
    },true);
    document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target instanceof Element&&e.target.matches('#videoQuery')){e.preventDefault();e.stopImmediatePropagation();void search(e.target.value.trim());}},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
