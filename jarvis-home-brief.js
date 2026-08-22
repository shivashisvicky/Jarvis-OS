(() => {
  'use strict';
  if (window.__JARVIS_HOME_BRIEF__) return;
  window.__JARVIS_HOME_BRIEF__ = true;

  const GATEWAY = 'https://jarvis-intelligence.shivashisvicky112.workers.dev/api/search';
  const RSS_PROXY = 'https://api.rss2json.com/v1/api.json';
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  let running = false;

  function styles() {
    if (document.querySelector('#jhu-brief-style')) return;
    const s = document.createElement('style'); s.id = 'jhu-brief-style';
    s.textContent = `.jhu-brief{margin:0 0 14px;padding:15px;border:1px solid rgba(77,210,255,.28);border-radius:15px;background:rgba(3,16,23,.94);box-shadow:0 0 28px rgba(0,180,255,.07)}.jhu-brief-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.jhu-brief-head strong{font-size:10px;letter-spacing:.18em;color:#63dcff}.jhu-brief-head span{font-size:9px;color:#557783}.jhu-brief-list{display:grid;gap:7px}.jhu-brief-item{display:grid;grid-template-columns:24px 1fr;gap:8px;padding:8px 0;border-top:1px solid rgba(72,142,166,.14)}.jhu-brief-item:first-child{border-top:0}.jhu-brief-num{color:#54d9ff;font-size:10px;font-weight:800}.jhu-brief-item a{color:#d9f7ff;text-decoration:none;font-size:12px;font-weight:700;line-height:1.35}.jhu-brief-item small{display:block;color:#607f8a;font-size:9px;margin-top:3px}.jhu-brief-foot{display:flex;justify-content:flex-end;margin-top:10px}.jhu-brief-foot button{border:1px solid rgba(74,179,211,.3);border-radius:999px;background:rgba(5,21,29,.9);color:#9bc5d1;padding:7px 10px;font:700 9px/1 inherit;letter-spacing:.08em}.jhu-brief-loading{color:#7898a5;font-size:11px;padding:8px 0}.jhu-brief-error{color:#b8cbd1;font-size:11px;padding:8px 0}`;
    document.head.appendChild(s);
  }

  async function withTimeout(promise, ms) {
    let timer; const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), ms); });
    try { return await Promise.race([promise, timeout]); } finally { clearTimeout(timer); }
  }

  async function fetchGateway() {
    const u = new URL(GATEWAY); u.searchParams.set('q', '(world news OR India news OR artificial intelligence news) when:1d -sports -celebrity');
    const r = await fetch(u.toString(), {cache:'no-store', headers:{Accept:'application/json'}});
    if (!r.ok) throw new Error(`gateway ${r.status}`);
    const d = await r.json();
    return Array.isArray(d?.results) ? d.results : [];
  }

  async function fetchRss() {
    const feed = `https://news.google.com/rss/search?q=${encodeURIComponent('world news OR India news OR artificial intelligence news when:1d -sports -celebrity')}&hl=en-IN&gl=IN&ceid=IN:en`;
    const u = new URL(RSS_PROXY); u.searchParams.set('rss_url', feed);
    const r = await fetch(u.toString(), {cache:'no-store', headers:{Accept:'application/json'}});
    if (!r.ok) throw new Error(`rss ${r.status}`);
    const d = await r.json();
    return Array.isArray(d?.items) ? d.items : [];
  }

  function normalize(items) {
    const seen = new Set();
    return items.map(x => ({title:clean(x.title), link:clean(x.link), source:clean(x.source || x.author || 'LIVE NEWS')})).filter(x => x.title && /^https?:\/\//i.test(x.link) && !seen.has(x.title.toLowerCase()) && seen.add(x.title.toLowerCase())).slice(0,5);
  }

  function render(items) {
    styles();
    const old = document.querySelector('#jhuDailyBrief'); old?.remove();
    const quick = document.querySelector('#jhuQuick'); if (!quick) return;
    const box = document.createElement('section'); box.id='jhuDailyBrief'; box.className='jhu-brief';
    box.innerHTML = `<div class="jhu-brief-head"><strong>TODAY'S INTELLIGENCE BRIEF</strong><span>${esc(new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}</span></div><div class="jhu-brief-list">${items.map((x,i)=>`<div class="jhu-brief-item"><span class="jhu-brief-num">${String(i+1).padStart(2,'0')}</span><span><a href="${esc(x.link)}" target="_blank" rel="noreferrer">${esc(x.title)}</a><small>${esc(x.source)}</small></span></div>`).join('')}</div><div class="jhu-brief-foot"><button type="button" id="jhuOpenNews">OPEN FULL NEWS DESK →</button></div>`;
    quick.insertAdjacentElement('afterend', box);
    box.querySelector('#jhuOpenNews')?.addEventListener('click', () => document.querySelector('#newsDesk')?.scrollIntoView({behavior:'smooth',block:'start'}));
  }

  async function openBrief() {
    if (running) return; running = true; styles();
    const quick = document.querySelector('#jhuQuick'); if (!quick) { running=false; return; }
    document.querySelector('#jhuDailyBrief')?.remove();
    const box = document.createElement('section'); box.id='jhuDailyBrief'; box.className='jhu-brief';
    box.innerHTML = '<div class="jhu-brief-head"><strong>TODAY\'S INTELLIGENCE BRIEF</strong><span>FETCHING…</span></div><div class="jhu-brief-loading">Pulling the latest world, India and AI headlines…</div>';
    quick.insertAdjacentElement('afterend', box);
    try {
      const results = await withTimeout(Promise.any([fetchGateway(), fetchRss()]), 7000);
      const items = normalize(results);
      if (!items.length) throw new Error('no results');
      render(items);
    } catch {
      box.innerHTML = '<div class="jhu-brief-head"><strong>TODAY\'S INTELLIGENCE BRIEF</strong><span>UNAVAILABLE</span></div><div class="jhu-brief-error">Live briefing is temporarily unavailable. Your full News desk is still available below.</div><div class="jhu-brief-foot"><button type="button" id="jhuOpenNews">OPEN FULL NEWS DESK →</button></div>';
      box.querySelector('#jhuOpenNews')?.addEventListener('click', () => document.querySelector('#newsDesk')?.scrollIntoView({behavior:'smooth',block:'start'}));
    } finally { running=false; }
  }

  // Public bridge for the mobile Home action handler. This avoids depending
  // on capture/bubble listener ordering when iOS delivers a touch as click.
  window.JARVIS_OPEN_DAILY_BRIEF = openBrief;
  window.addEventListener('jarvis:open-daily-brief', () => openBrief());

  function bind() {
    const quick = document.querySelector('#jhuQuick'); if (!quick || quick.dataset.briefBound) return;
    quick.dataset.briefBound='1';
    const button = [...quick.querySelectorAll('button')].find(b => b.textContent?.includes("TODAY'S BRIEF"));
    if (!button) return;
    button.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); openBrief(); }, true);
  }
  bind();
  new MutationObserver(bind).observe(document.documentElement, {childList:true,subtree:true});
})();
