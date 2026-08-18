(() => {
  'use strict';
  if (window.__JARVIS_VIDEO_LIVE_V8__) return;
  window.__JARVIS_VIDEO_LIVE_V8__ = true;

  let requestId = 0;
  let mounted = false;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const idFromUrl = value => {
    const raw = String(value || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
    try {
      const url = new URL(raw);
      if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null;
      if (/youtube\.com$/.test(url.hostname)) return url.searchParams.get('v') || null;
    } catch {}
    return null;
  };

  async function getText(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'text/plain,text/markdown,*/*' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } finally { clearTimeout(timer); }
  }

  function parse(text, query) {
    const found = new Map();
    const markdown = /\[([^\]]{2,240})\]\(https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})[^)]*\)/gi;
    for (const match of text.matchAll(markdown)) {
      const id = match[2];
      if (!found.has(id)) found.set(id, match[1].replace(/\\([_*()[\]])/g, '$1').trim());
    }
    const plain = /https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})[^\s)"<>]*/gi;
    for (const match of text.matchAll(plain)) {
      const id = match[1];
      if (!found.has(id)) found.set(id, `${query} · YouTube result`);
    }
    return [...found].slice(0, 12).map(([id, title]) => ({
      id,
      title: title || `${query} · YouTube result`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${id}`
    }));
  }

  async function search(query) {
    const q = encodeURIComponent(query);
    const targets = [
      `https://s.jina.ai/site%3Ayoutube.com%2Fwatch%20${q}`,
      `https://r.jina.ai/https://www.youtube.com/results?search_query=${q}`,
      `https://s.jina.ai/youtube%20${q}`
    ];
    for (const url of targets) {
      try {
        const results = parse(await getText(url), query);
        if (results.length) return results;
      } catch {}
    }
    return [];
  }

  function ensureStyle() {
    if (document.getElementById('jarvisVideoLiveV8Style')) return;
    const style = document.createElement('style');
    style.id = 'jarvisVideoLiveV8Style';
    style.textContent = `
      #videoResults.jvl8{display:grid;gap:10px;margin-top:12px}
      .jvl8-card{display:grid;grid-template-columns:150px 1fr 34px;gap:12px;align-items:center;width:100%;padding:0;overflow:hidden;text-align:left;border:1px solid #173545;border-radius:14px;background:rgba(3,11,17,.94);color:#d9f7ff;cursor:pointer}
      .jvl8-card:hover{border-color:#49cfff;background:rgba(6,20,28,.98)}
      .jvl8-thumb{width:150px;aspect-ratio:16/9;object-fit:cover;background:#020509}
      .jvl8-info{min-width:0;padding:10px 0}.jvl8-info strong{display:block;font-size:.88rem;line-height:1.25}.jvl8-info small{display:block;color:#7896a3;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jvl8-play{color:#5edcff;margin-right:10px}
      @media(max-width:700px){.jvl8-card{grid-template-columns:108px 1fr 30px}.jvl8-thumb{width:108px}}
    `;
    document.head.appendChild(style);
  }

  function player(id, title) {
    const target = document.querySelector('#jarvisPlayer');
    if (!target) return;
    target.innerHTML = `<iframe title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="width:100%;height:min(62vh,560px);border:0;background:#000" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1"></iframe>`;
    const state = document.querySelector('#mediaState');
    if (state) state.textContent = 'PLAYING · YOUTUBE';
  }

  async function run(query) {
    const input = document.querySelector('#videoQuery');
    const results = document.querySelector('#videoResults');
    if (!input || !results) return;
    const value = String(query || input.value || '').trim();
    if (!value) return;
    const token = ++requestId;
    results.classList.add('jvl8');
    results.innerHTML = '<div class="jmc7-status">SEARCHING LIVE WEB INDEX…</div>';
    const state = document.querySelector('#mediaState');
    if (state) state.textContent = 'SEARCHING · LIVE WEB INDEX';
    const items = await search(value);
    if (token !== requestId) return;
    if (!items.length) {
      results.innerHTML = `<div class="jmc7-card jmc7-error"><strong>VIDEO SEARCH TEMPORARILY UNAVAILABLE</strong><small>No live YouTube results were returned for “${esc(value)}”.</small></div>`;
      if (state) state.textContent = 'DEGRADED · NO LIVE RESULTS';
      return;
    }
    results.innerHTML = items.map(item => `<button type="button" class="jvl8-card" data-v8-id="${esc(item.id)}"><img class="jvl8-thumb" loading="lazy" src="${esc(item.thumbnail)}" alt=""><span class="jvl8-info"><strong>${esc(item.title)}</strong><small>YouTube · live web result</small></span><b class="jvl8-play">▶</b></button>`).join('');
    items.forEach(item => results.querySelector(`[data-v8-id="${CSS.escape(item.id)}"]`)?.addEventListener('click', e => { e.preventDefault(); player(item.id, item.title); }));
    if (state) state.textContent = `RESULTS · ${items.length} · LIVE`;
  }

  function mount() {
    const input = document.querySelector('#videoQuery');
    const results = document.querySelector('#videoResults');
    if (!input || !results) return false;
    ensureStyle();
    if (!mounted || input.dataset.v8Mounted !== '1') {
      input.dataset.v8Mounted = '1';
      results.classList.add('jvl8');
      results.innerHTML = '<div class="jmc7-status">LIVE VIDEO INDEX · READY</div>';
      mounted = true;
    }
    return true;
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('#videoSearch, [data-video-provider]') : null;
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const input = document.querySelector('#videoQuery');
    if (!input) return;
    const query = target.matches('[data-video-provider="trending"]') ? 'trending videos India' : input.value.trim();
    if (query) { input.value = query; void run(query); }
  }, true);

  document.addEventListener('submit', event => {
    const form = event.target instanceof Element ? event.target.closest('form') : null;
    if (!form || !document.querySelector('#videoQuery') || !form.contains(document.querySelector('#videoQuery'))) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void run(document.querySelector('#videoQuery')?.value || '');
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || !(event.target instanceof Element) || !event.target.matches('#videoQuery')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void run(event.target.value);
  }, true);

  const observer = new MutationObserver(() => { mount(); });
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once:true }); else mount();
  window.jarvisVideoSearch = query => run(query);
})();
