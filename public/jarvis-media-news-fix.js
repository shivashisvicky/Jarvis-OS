(() => {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const workspace = () => document.querySelector('.workspace');
  const videoId = (raw) => {
    const value = String(raw || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
    try {
      const u = new URL(value);
      const host = u.hostname.toLowerCase();
      if (host === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] || null;
      if (host.endsWith('youtube.com')) {
        if (u.searchParams.get('v')) return u.searchParams.get('v');
        const parts = u.pathname.split('/').filter(Boolean);
        const marker = parts.findIndex(x => ['shorts','embed','live'].includes(x));
        return marker >= 0 ? parts[marker + 1] || null : null;
      }
    } catch {}
    return null;
  };
  const play = (id, title = 'YouTube video') => {
    const target = document.querySelector('#jarvisPlayer') || document.querySelector('#player');
    if (!target) return;
    target.innerHTML = `<iframe title="${esc(title)}" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&playsinline=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  };
  function patchVideo() {
    const enhanced = document.querySelector('#jarvisVideoUrl');
    const enhancedButton = document.querySelector('#jarvisVideoLoad');
    if (enhanced && enhancedButton && !enhancedButton.dataset.jarvisFix) {
      enhancedButton.dataset.jarvisFix = '1';
      enhancedButton.onclick = () => {
        const id = videoId(enhanced.value);
        if (!id) {
          const p = document.querySelector('#jarvisPlayer');
          if (p) p.innerHTML = '<div class="jarvis-player-empty">JARVIS could not recognise that video URL. Paste a normal YouTube watch, youtu.be, Shorts, Live or embed URL.</div>';
          return;
        }
        play(id);
      };
    }
    const legacy = document.querySelector('#videoUrl');
    const legacyButton = document.querySelector('#playVideo');
    if (legacy && legacyButton && !legacyButton.dataset.jarvisFix) {
      legacyButton.dataset.jarvisFix = '1';
      legacyButton.onclick = () => {
        const id = videoId(legacy.value);
        if (id) play(id);
        else {
          const p = document.querySelector('#player');
          if (p) p.innerHTML = '<div class="empty">JARVIS could not recognise that YouTube URL.</div>';
        }
      };
    }
  }
  const RSS = 'https://api.rss2json.com/v1/api.json?rss_url=';
  const feeds = {
    india: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
    odisha: 'https://news.google.com/rss/search?q=Bhubaneswar%20Odisha&hl=en-IN&gl=IN&ceid=IN:en',
    world: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    technology: 'https://news.google.com/rss/search?q=technology%20AI&hl=en-US&gl=US&ceid=US:en'
  };
  async function feed(url) {
    const r = await fetch(RSS + encodeURIComponent(url), {cache:'no-store'});
    if (!r.ok) throw new Error('News service unavailable');
    const d = await r.json();
    if (d.status !== 'ok') throw new Error(d.message || 'News service unavailable');
    return d.items || [];
  }
  async function showNews(category='india') {
    const w = workspace(); if (!w) return;
    w.innerHTML = `<div class="apphead"><div><p class="eyebrow">INTELLIGENCE / LIVE NEWS</p><h2>JARVIS News</h2><p class="sub">Local, India, global and technology headlines, without leaving JARVIS.</p></div></div>
      <div class="jarvis-tabs"><button data-news-cat="india">INDIA</button><button data-news-cat="odisha">ODISHA / LOCAL</button><button data-news-cat="world">WORLD</button><button data-news-cat="technology">TECH & AI</button><button id="jarvisNewsRefresh">↻ REFRESH</button></div>
      <div class="jarvis-news-search"><input id="jarvisNewsQuery" placeholder="Search news…"><button id="jarvisNewsSearch">SEARCH</button></div>
      <div id="jarvisNewsStatus" class="jarvis-news-status">Loading headlines…</div><div id="jarvisNewsGrid" class="jarvis-news-grid"></div>`;
    document.querySelectorAll('[data-news-cat]').forEach(b => { b.classList.toggle('active', b.dataset.newsCat === category); b.onclick = () => showNews(b.dataset.newsCat); });
    document.querySelector('#jarvisNewsRefresh').onclick = () => showNews(category);
    document.querySelector('#jarvisNewsSearch').onclick = async () => {
      const q = document.querySelector('#jarvisNewsQuery').value.trim();
      if (!q) return showNews(category);
      render(await feed(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`));
    };
    try { render(await feed(feeds[category])); }
    catch (e) { document.querySelector('#jarvisNewsStatus').textContent = e.message || 'News feed unavailable right now.'; }
  }
  function render(items) {
    const grid = document.querySelector('#jarvisNewsGrid');
    const status = document.querySelector('#jarvisNewsStatus');
    if (!grid) return;
    grid.innerHTML = items.slice(0,18).map(x => `<article class="jarvis-news-card"><h3><a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a></h3><p>${esc(String(x.description || '').replace(/<[^>]+>/g,'').slice(0,180))}</p><div class="jarvis-news-meta">${esc(x.author || 'News')} · ${esc(x.pubDate || '')}</div></article>`).join('') || '<div class="jarvis-news-status">No stories found.</div>';
    if (status) status.textContent = `${items.length} stories available`;
  }
  function ensureNewsButton() {
    const aside = document.querySelector('aside');
    if (!aside || aside.querySelector('[data-app="news"]')) return;
    const b = document.createElement('button');
    b.className = 'nav'; b.dataset.app = 'news'; b.title = 'News'; b.innerHTML = '<b>▤</b><span>News</span>';
    b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); showNews(); }, true);
    aside.appendChild(b);
  }
  const observer = new MutationObserver(() => { ensureNewsButton(); patchVideo(); });
  observer.observe(document.documentElement, {childList:true, subtree:true});
  document.addEventListener('click', e => {
    const b = e.target.closest?.('[data-app="news"]');
    if (b) { e.preventDefault(); e.stopImmediatePropagation(); showNews(); }
  }, true);
  setTimeout(() => { ensureNewsButton(); patchVideo(); }, 100);
})();
