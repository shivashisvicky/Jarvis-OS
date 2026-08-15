/* J.A.R.V.I.S. Orchestration Layer
 * Product rule: paint immediately, hydrate from cache, refresh quietly.
 * This layer deliberately stays provider-agnostic and works around the legacy
 * single-page renderer without coupling the intelligence experience to it.
 */
(() => {
  'use strict';
  const VERSION = '2.0.0';
  const CACHE_PREFIX = 'jarvis:v2:';
  const TTL = { signal: 90_000, news: 300_000, media: 600_000 };

  const now = () => Date.now();
  const read = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return fallback;
      const item = JSON.parse(raw);
      return item && item.value !== undefined ? item : fallback;
    } catch { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ value, at: now(), v: VERSION })); } catch {}
  };

  window.JARVIS = window.JARVIS || {};
  window.JARVIS.version = VERSION;
  window.JARVIS.cache = {
    get(key, ttl = 0) {
      const item = read(key);
      if (!item) return null;
      return { value: item.value, age: now() - item.at, fresh: !ttl || now() - item.at < ttl };
    },
    set: write,
    invalidate(key) { try { localStorage.removeItem(CACHE_PREFIX + key); } catch {} }
  };

  const style = document.createElement('style');
  style.id = 'jarvis-orchestrator-css';
  style.textContent = `
    .jarvis-mission-console{max-width:1240px;margin:0 auto 12px;position:relative;border:1px solid rgba(135,221,245,.20);border-radius:14px;background:linear-gradient(120deg,rgba(7,20,27,.94),rgba(4,10,14,.97));box-shadow:0 20px 65px rgba(0,0,0,.24);overflow:hidden}
    .jarvis-mission-console:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 85% 25%,rgba(101,220,255,.12),transparent 30%),linear-gradient(90deg,transparent,rgba(101,220,255,.035),transparent);pointer-events:none}
    .jmc-top{display:flex;justify-content:space-between;align-items:center;padding:10px 13px;border-bottom:1px solid rgba(135,221,245,.10);font-size:7px;letter-spacing:.16em;color:#5e7b84}
    .jmc-top strong{color:#baf3ff;font-size:8px;letter-spacing:.18em}.jmc-live{display:flex;gap:7px;align-items:center}.jmc-live i{width:6px;height:6px;border-radius:50%;background:#66f0a7;box-shadow:0 0 12px #66f0a7}
    .jmc-body{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;padding:16px}.jmc-prompt{font-size:9px;color:#4f6d76;letter-spacing:.12em;margin-bottom:6px}.jmc-question{font-size:20px;letter-spacing:-.035em;color:#e8fbff;margin:0 0 5px}.jmc-sub{font-size:8px;color:#66838c;margin:0}.jmc-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.jmc-action{border:1px solid rgba(135,221,245,.14);background:rgba(101,220,255,.035);color:#83a8b2;border-radius:8px;padding:8px 10px;font-size:7px;letter-spacing:.08em;cursor:pointer}.jmc-action:hover{border-color:rgba(101,220,255,.42);color:#baf3ff;background:rgba(101,220,255,.08)}
    .jmc-cache{padding:7px 13px;border-top:1px solid rgba(135,221,245,.08);font-size:6px;letter-spacing:.12em;color:#486670;display:flex;justify-content:space-between}.jmc-cache b{color:#66f0a7;font-weight:600}
    .jarvis-instant-news{border:1px solid rgba(135,221,245,.10);border-radius:9px;margin:9px 12px;padding:10px;background:rgba(101,220,255,.025);display:none}.jarvis-instant-news.ready{display:block}.jin-head{display:flex;justify-content:space-between;font-size:7px;letter-spacing:.12em;color:#55727b;margin-bottom:7px}.jin-items{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.jin-item{border:1px solid rgba(135,221,245,.08);padding:8px;border-radius:7px;background:rgba(0,0,0,.12);color:#a9d5de;font-size:8px;line-height:1.35}.jin-item small{display:block;color:#506d76;font-size:6px;margin-top:4px}
    @media(max-width:700px){.jmc-body{grid-template-columns:1fr}.jmc-actions{justify-content:flex-start}.jin-items{grid-template-columns:1fr}.jmc-question{font-size:16px}}
  `;
  document.head.appendChild(style);

  const dispatch = (command) => {
    window.dispatchEvent(new CustomEvent('jarvis:orchestrated-command', { detail: { command } }));
    const input = document.querySelector('#commandInput');
    const form = document.querySelector('#commandForm');
    if (input && form) { input.value = command; form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
    else {
      window.dispatchEvent(new CustomEvent('jarvis:voice-command', { detail: { text: command }, cancelable: true }));
    }
  };

  const mount = () => {
    if (document.querySelector('.jarvis-mission-console')) return;
    const home = document.querySelector('.command-center');
    if (!home) return;
    const first = home.querySelector('.hero-grid');
    if (!first) return;

    const cachedSignal = read('signal', null);
    const consoleEl = document.createElement('section');
    consoleEl.className = 'jarvis-mission-console';
    consoleEl.innerHTML = `
      <div class="jmc-top"><div class="jmc-live"><i></i><strong>JARVIS INTELLIGENCE CORE</strong><span>ORCHESTRATOR ${VERSION}</span></div><span id="jmcTime">LOCAL-FIRST / READY</span></div>
      <div class="jmc-body"><div><div class="jmc-prompt">MISSION CONTROL</div><h2 class="jmc-question">What should JARVIS work on?</h2><p class="jmc-sub">Search, investigate, watch, calculate or open a workspace. JARVIS chooses the right subsystem.</p></div><div class="jmc-actions"><button class="jmc-action" data-jcmd="Give me today's most important technology news">TODAY'S SIGNAL</button><button class="jmc-action" data-jcmd="Find videos about artificial intelligence">FIND VIDEO</button><button class="jmc-action" data-jcmd="Search the web for latest AI research">RESEARCH</button><button class="jmc-action" data-jcmd="Open API Lab">ENGINEERING</button></div></div>
      <div class="jmc-cache"><span>PERCEPTION LAYER</span><b>${cachedSignal ? 'WARM CACHE' : 'COLD START → HYDRATING'}</b></div>
      <div class="jarvis-instant-news" id="jarvisInstantNews"><div class="jin-head"><span>LAST KNOWN SIGNAL</span><span id="jinAge"></span></div><div class="jin-items" id="jinItems"></div></div>`;
    home.insertBefore(consoleEl, first);
    consoleEl.querySelectorAll('[data-jcmd]').forEach(btn => btn.addEventListener('click', () => dispatch(btn.dataset.jcmd || '')));
    if (cachedSignal && Array.isArray(cachedSignal.value)) renderSignal(cachedSignal.value, cachedSignal.at);
    hydrateSignal(consoleEl);
  };

  const renderSignal = (items, at = now()) => {
    const host = document.querySelector('#jarvisInstantNews');
    const list = document.querySelector('#jinItems');
    const age = document.querySelector('#jinAge');
    if (!host || !list || !Array.isArray(items) || !items.length) return;
    list.innerHTML = items.slice(0, 3).map(x => `<div class="jin-item">${String(x.title || 'Signal').replace(/[&<>]/g, '')}<small>${String(x.source || x.domain || 'SOURCE').replace(/[&<>]/g, '')}</small></div>`).join('');
    age.textContent = `${Math.max(1, Math.round((now() - at) / 60000))} MIN AGO`;
    host.classList.add('ready');
  };

  const hydrateSignal = async () => {
    // Do not block first paint. GDELT is only a background signal source here.
    const cached = read('signal', null);
    if (cached) renderSignal(cached.value, cached.at);
    try {
      const q = encodeURIComponent('AI OR technology');
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&maxrecords=6&format=json&sort=datedesc`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeout);
      if (!response.ok) throw new Error('signal unavailable');
      const data = await response.json();
      const items = (data.articles || []).map(x => ({ title: x.title, source: x.domain || x.sourcecountry })).filter(x => x.title);
      if (items.length) { write('signal', items); renderSignal(items); }
    } catch {}
  };

  const observe = new MutationObserver(() => {
    if (document.querySelector('.command-center')) mount();
  });
  observe.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== 'loading') setTimeout(mount, 0); else document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 0));
})();
