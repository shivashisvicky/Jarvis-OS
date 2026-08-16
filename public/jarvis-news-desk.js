(() => {
  'use strict';

  const FEEDS = {
    india: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
    odisha: 'https://news.google.com/rss/search?q=Bhubaneswar%20Odisha&hl=en-IN&gl=IN&ceid=IN:en',
    world: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    tech: 'https://news.google.com/rss/search?q=technology%20AI&hl=en-US&gl=US&ceid=US:en',
    ai: 'https://news.google.com/rss/search?q=artificial%20intelligence&hl=en-US&gl=US&ceid=US:en'
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rss = url => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
  let active = 'india';

  function addStyle() {
    if (document.getElementById('jarvisNewsDeskStyle')) return;
    const s = document.createElement('style'); s.id = 'jarvisNewsDeskStyle';
    s.textContent = `.jns{max-width:1240px;margin:0 auto}.jns-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-end;margin-bottom:16px}.jns-head h1{margin:0}.jns-sub{color:#78939c}.jns-tabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}.jns-tabs button,.jns-search button{border:1px solid #21414c;background:#08151c;color:#a9d9e5;border-radius:9px;padding:10px 13px;cursor:pointer}.jns-tabs button.active{border-color:#55d6ff;background:#55d6ff;color:#031018}.jns-search{display:flex;gap:8px;margin-bottom:14px}.jns-search input{flex:1}.jns-status{font-size:11px;color:#75919a;margin:10px 0}.jns-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.jns-card{display:block;color:inherit;text-decoration:none;border:1px solid #183542;border-radius:13px;overflow:hidden;background:#061017}.jns-card:hover{border-color:#55d6ff}.jns-card img{width:100%;height:150px;object-fit:cover;background:#02070a}.jns-copy{padding:12px}.jns-copy h3{margin:0 0 7px;font-size:15px;line-height:1.35}.jns-copy p{margin:0;color:#718b94;font-size:12px;line-height:1.45}.jns-meta{margin-top:9px;color:#4f707b;font-size:10px}@media(max-width:800px){.jns-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.jns-head{align-items:flex-start}.jns-grid{grid-template-columns:1fr}.jns-search{flex-direction:column}}`;
    document.head.appendChild(s);
  }

  function render(category = active, query = '') {
    const w = document.querySelector('.workspace'); if (!w) return false;
    active = category;
    w.innerHTML = `<div class="jns"><div class="jns-head"><div><p class="eyebrow">INTELLIGENCE / NEWS</p><h1>News Desk</h1><p class="sub jns-sub">Live headlines with India, Odisha, world, technology and AI views.</p></div><button id="jnsRefresh" class="ghost">REFRESH</button></div><div class="jns-tabs">${Object.entries({india:'INDIA',odisha:'ODISHA',world:'WORLD',tech:'TECH',ai:'AI'}).map(([k,v]) => `<button data-jns-cat="${k}" class="${k===active?'active':''}">${v}</button>`).join('')}</div><div class="jns-search"><input id="jnsQuery" value="${esc(query)}" placeholder="Search headlines…"><button id="jnsSearch">SEARCH NEWS</button></div><div id="jnsStatus" class="jns-status">Loading current headlines…</div><div id="jnsGrid" class="jns-grid"></div></div>`;
    w.querySelectorAll('[data-jns-cat]').forEach(b => b.onclick = () => render(b.dataset.jnsCat));
    w.querySelector('#jnsRefresh').onclick = () => render(active, w.querySelector('#jnsQuery').value.trim());
    w.querySelector('#jnsSearch').onclick = () => render(active, w.querySelector('#jnsQuery').value.trim());
    w.querySelector('#jnsQuery').addEventListener('keydown', e => { if (e.key === 'Enter') render(active, e.target.value.trim()); });
    load(category, query); return true;
  }

  async function load(category, query) {
    const status = document.querySelector('#jnsStatus'), grid = document.querySelector('#jnsGrid'); if (!status || !grid) return;
    const feed = query ? `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en` : FEEDS[category];
    try {
      const r = await fetch(rss(feed), {cache:'no-store'}); if (!r.ok) throw new Error();
      const data = await r.json(); const items = (data.items || []).slice(0,18);
      status.textContent = `${items.length} current stories`;
      grid.innerHTML = items.map(x => `<a class="jns-card" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="${esc(x.thumbnail || '')}" alt=""><div class="jns-copy"><h3>${esc(x.title)}</h3><p>${esc(String(x.description || '').replace(/<[^>]+>/g,'').slice(0,180))}</p><div class="jns-meta">${esc(x.author || 'NEWS')} · ${esc(x.pubDate || '')}</div></div></a>`).join('') || '<div class="jns-status">No stories matched this view.</div>';
    } catch {
      status.textContent = 'Live feed could not be reached.';
      grid.innerHTML = `<div class="jns-status">The headlines service is temporarily unavailable. <button id="jnsExternal" class="ghost">OPEN GOOGLE NEWS</button></div>`;
      document.querySelector('#jnsExternal')?.addEventListener('click', () => window.open(feed, '_blank', 'noopener,noreferrer'));
    }
  }

  function addNav() {
    const rail = document.querySelector('.rail'); if (!rail || rail.querySelector('[data-app="jarvis-news"]')) return;
    const group = [...rail.querySelectorAll('.nav-group')].find(x => x.textContent.includes('INTELLIGENCE')) || rail;
    const b = document.createElement('button'); b.className = 'nav'; b.dataset.app = 'jarvis-news'; b.title = 'News'; b.innerHTML = '<b>▤</b><span>News</span>';
    b.onclick = e => { e.preventDefault(); e.stopPropagation(); document.querySelectorAll('.nav.selected').forEach(x => x.classList.remove('selected')); b.classList.add('selected'); render('india'); };
    group.appendChild(b);
  }

  function boot() { addStyle(); addNav(); }
  const observer = new MutationObserver(() => addNav());
  observer.observe(document.documentElement, {childList:true, subtree:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
