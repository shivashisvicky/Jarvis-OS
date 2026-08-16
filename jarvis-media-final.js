(() => {
  'use strict';

  // JARVIS-owned media layer. Search and playback remain inside the shell.
  // Public indexes are discovery backends only; YouTube is never opened as a tab.
  const INVIDIOUS = [
    'https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com',
    'https://invidious.tiekoetter.com','https://invidious.f5.si','https://inv.zoomerville.com'
  ];
  const PIPED = [
    'https://pipedapi.kavin.rocks','https://pipedapi.tokhmi.xyz','https://pipedapi.moomoo.me',
    'https://pipedapi.syncpundit.io','https://api-piped.mha.fi','https://piped-api.garudalinux.org',
    'https://pipedapi.rivo.lol','https://pipedapi.leptons.xyz'
  ];
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

  async function fetchJson(url, ms = 6000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal, cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(timer); }
  }

  const normalize = (items, source) => (items || []).map(v => ({
    id: String(v.videoId || v.id || videoId(v.url || '') || ''), title: v.title || 'Untitled video',
    author: v.author || v.uploader || v.channelName || 'Unknown channel', date: v.publishedText || v.uploadedDate || '',
    views: v.viewCount || v.views || 0,
    thumbnail: (v.videoThumbnails || []).find(x => x.quality === 'medium')?.url || v.thumbnail || (v.videoThumbnails || [])[0]?.url || '', source
  })).filter(v => v.id);

  async function queryIndex(base, q, type) {
    try {
      if (type === 'piped') return normalize((await fetchJson(`${base}/search?q=${encodeURIComponent(q)}&filter=videos`))?.items, base);
      return normalize(await fetchJson(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&sort_by=relevance`), base);
    } catch (_) { return []; }
  }
  async function searchAll(q) {
    return (await Promise.all([
      ...INVIDIOUS.map(base => queryIndex(base, q, 'invidious')),
      ...PIPED.map(base => queryIndex(base, q, 'piped'))
    ])).flat();
  }
  async function trendingAll() {
    return (await Promise.all(INVIDIOUS.map(async base => {
      try { return normalize(await fetchJson(`${base}/api/v1/trending?region=IN`), base); } catch (_) { return []; }
    }))).flat();
  }
  function dom() { return {input:document.querySelector('#videoQuery'),results:document.querySelector('#videoResults'),player:document.querySelector('#jarvisPlayer'),state:document.querySelector('#mediaState')}; }
  function state(t) { const x=dom().state; if(x)x.textContent=t; }
  function showResults(items) {
    const {results}=dom(); if(!results)return;
    const unique=[...new Map(items.map(v=>[v.id,v])).values()].slice(0,12);
    results.innerHTML=unique.length?unique.map(v=>`<button type="button" class="video-result jvc-card" data-jvc-id="${attr(v.id)}">${v.thumbnail?`<img loading="lazy" src="${attr(v.thumbnail)}" alt="">`:'<div class="video-thumb">▶</div>'}<span class="video-meta"><strong>${esc(v.title)}</strong><small>${esc(v.author)}${v.date?` · ${esc(v.date)}`:''}</small><small>${v.views?`${Number(v.views).toLocaleString()} views`:''}</small></span><b>▶</b></button>`).join(''):'<div class="empty">No videos matched that keyword.</div>';
  }
  async function search(q,trending=false) {
    const {results}=dom(); if(!results)return;
    if(!q&&!trending){results.innerHTML='<div class="empty">Enter a keyword to search videos.</div>';state('READY');return;}
    state('SEARCHING'); results.innerHTML='<div class="empty">JARVIS is searching video indexes…</div>';
    const items=trending?await trendingAll():await searchAll(q);
    if(!items.length){results.innerHTML='<div class="empty">No public video index responded with results. JARVIS will not redirect you.</div>';state('NO REDIRECT');return;}
    showResults(items); state(`${Math.min(12,new Set(items.map(v=>v.id)).size)} RESULTS`);
  }
  function playerHtml(html,text){const {player}=dom();if(player)player.innerHTML=html;state(text);}
  async function play(id) {
    if(!id)return;
    playerHtml('<div class="player-empty"><span>◌</span><strong>RESOLVING VIDEO</strong><small>JARVIS is preparing an in-house playback surface.</small></div>','RESOLVING');
    const providers=[
      ...INVIDIOUS.map(base=>async()=>{const d=await fetchJson(`${base}/api/v1/videos/${encodeURIComponent(id)}`);const s=[...(d.formatStreams||[]),...(d.adaptiveFormats||[])].filter(x=>x.url&&(!x.type||/^video\/(mp4|webm)/i.test(x.type))).sort((a,b)=>(b.height||0)-(a.height||0))[0];return s?{stream:s,data:d}:null;}),
      ...PIPED.map(base=>async()=>{const d=await fetchJson(`${base}/streams/${encodeURIComponent(id)}`);const s=(d.videoStreams||[]).filter(x=>x.url).sort((a,b)=>(b.height||0)-(a.height||0))[0];return s?{stream:s,data:d}:null;})
    ];
    for(const provider of providers){try{const r=await provider();if(!r?.stream?.url)continue;const s=r.stream;playerHtml(`<video controls autoplay playsinline preload="metadata" poster="${attr(r.data?.videoThumbnails?.[0]?.url||r.data?.thumbnailUrl||'')}"><source src="${attr(s.url)}" type="${attr(s.type||s.mimeType||'video/mp4')}"></video>`,`PLAYING · ${s.quality||`${s.height||''}P`.trim()||'AUTO'}`);const v=dom().player?.querySelector('video');if(v){v.addEventListener('error',()=>embed(id),{once:true});try{await v.play();}catch(_){}}return;}catch(_){} }
    embed(id);
  }
  function embed(id){playerHtml(`<iframe title="JARVIS video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1&autoplay=1"></iframe>`,'PLAYING · JARVIS PLAYER');}

  let installed=false;
  function boot(){
    if(installed)return; installed=true;
    document.addEventListener('click',e=>{
      const target=e.target; if(!(target instanceof Element))return;
      const searchButton=target.closest('#videoSearch');
      if(searchButton){e.preventDefault();e.stopImmediatePropagation();search(dom().input?.value?.trim()||'');return;}
      const provider=target.closest('[data-video-provider]');
      if(provider){e.preventDefault();e.stopImmediatePropagation();const kind=provider.getAttribute('data-video-provider');const q=dom().input?.value?.trim()||'trending videos India';if(kind==='trending')search('',true);else search(q);return;}
      const card=target.closest('.jvc-card');
      if(card){e.preventDefault();e.stopImmediatePropagation();play(card.getAttribute('data-jvc-id')||'');return;}
      const playButton=target.closest('#playVideo');
      if(playButton){e.preventDefault();e.stopImmediatePropagation();const raw=document.querySelector('#videoUrl')?.value?.trim()||'';const id=videoId(raw);if(id)play(id);else if(/^https?:\/\//i.test(raw))playerHtml(`<video controls autoplay playsinline src="${attr(raw)}"></video>`,'PLAYING · DIRECT MEDIA');}
    },true);
    document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target instanceof Element&&e.target.matches('#videoQuery')){e.preventDefault();e.stopImmediatePropagation();search(e.target.value.trim());}},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
