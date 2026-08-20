const browserOnly = (): void => {
  const escapeHtml = (value: unknown): string => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c] ?? c));
  const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => Promise.race([promise, new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error('timeout')), ms))]);
  const searchMaps = async (term: string): Promise<void> => {
    const results = document.querySelector<HTMLElement>('#mapResults');
    const frame = document.querySelector<HTMLElement>('#mapFrame');
    if (!results || !frame || !term) return;
    results.innerHTML = '<div class="empty">SEARCHING…</div>';
    try {
      const response = await withTimeout(fetch(`https://photon.komoot.io/api/?limit=6&q=${encodeURIComponent(term)}`, {cache:'no-store'}), 8000);
      if (!response.ok) throw new Error('map provider');
      const data = await response.json() as {features?: Array<{properties?: Record<string,string>;geometry?: {coordinates?: number[]}}>};
      const places = (data.features ?? []).map(feature => { const p=feature.properties??{}; const c=feature.geometry?.coordinates??[]; return {lat:Number(c[1]),lon:Number(c[0]),label:[p.name,p.street,p.city??p.locality,p.state,p.country].filter(Boolean).join(', ')}; }).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon));
      if (!places.length) { results.innerHTML='<div class="empty">No places found.</div>'; frame.innerHTML='<div class="empty">No map result for that place.</div>'; return; }
      const show=(p:typeof places[number])=>{const d=.035;frame.innerHTML=`<iframe title="Map" src="https://www.openstreetmap.org/export/embed.html?bbox=${p.lon-d},${p.lat-d},${p.lon+d},${p.lat+d}&layer=mapnik&marker=${p.lat},${p.lon}"></iframe>`;};
      results.innerHTML=places.map((p,i)=>`<button class="place-result" data-live-map-index="${i}"><strong>${escapeHtml(p.label)}</strong></button>`).join('');
      results.querySelectorAll<HTMLButtonElement>('[data-live-map-index]').forEach(b=>b.addEventListener('click',()=>show(places[Number(b.dataset.liveMapIndex)]))); show(places[0]);
    } catch { results.innerHTML='<div class="empty">Map search is temporarily unavailable. Try again.</div>'; frame.innerHTML='<div class="empty">Map provider unavailable.</div>'; }
  };
  const searchNews = async (category:string):Promise<void> => {
    const status=document.querySelector<HTMLElement>('#newsStatus'); const cards=document.querySelector<HTMLElement>('#newsCards'); if(!status||!cards)return;
    const q=category==='INDIA'?'India OR Indian':category==='AI'?'artificial intelligence OR AI':category==='TECH'?'technology OR software':'world OR geopolitics'; status.textContent='SCANNING'; cards.innerHTML='<div class="empty">JARVIS is fetching live headlines…</div>';
    try { const feed=`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`; const r=await withTimeout(fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`,{cache:'no-store'}),9000); if(!r.ok)throw new Error('news provider'); const d=await r.json() as {status?:string;feed?:{title?:string};items?:Array<{title?:string;link?:string;author?:string;pubDate?:string}>}; if(d.status!=='ok'||!d.items?.length)throw new Error('empty'); cards.innerHTML=d.items.slice(0,8).map(i=>`<article class="news-card"><a href="${escapeHtml(i.link??'#')}" target="_blank" rel="noreferrer"><strong>${escapeHtml(i.title??'Untitled')}</strong><small>${escapeHtml(i.author??d.feed?.title??'Google News')}${i.pubDate?' · '+escapeHtml(i.pubDate):''}</small></a></article>`).join(''); status.textContent=`${Math.min(8,d.items.length)} RESULTS`; } catch { status.textContent='DEGRADED'; cards.innerHTML='<div class="empty">Live news is temporarily unavailable. Try REFRESH.</div>'; }
  };
  const wire=():void=>{const mb=document.querySelector<HTMLButtonElement>('#mapSearch');const nr=document.querySelector<HTMLButtonElement>('#refreshNews');const ng=document.querySelector<HTMLSelectElement>('#newsGenre');if(mb&&!mb.dataset.liveRecovery){mb.dataset.liveRecovery='1';mb.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void searchMaps(document.querySelector<HTMLInputElement>('#mapQuery')?.value.trim()??'');},true);}if(nr&&ng&&!nr.dataset.liveRecovery){nr.dataset.liveRecovery='1';nr.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void searchNews(ng.value||'WORLD');},true);}if(ng&&!ng.dataset.liveRecovery){ng.dataset.liveRecovery='1';ng.addEventListener('change',e=>{e.stopImmediatePropagation();void searchNews(ng.value||'WORLD');},true);}const desk=document.querySelector<HTMLElement>('#newsDesk');if(desk&&!desk.dataset.liveRecoveryBoot){desk.dataset.liveRecoveryBoot='1';void searchNews(ng?.value||'WORLD');}};
  window.addEventListener('jarvis:maps',e=>{const destination=String((e as CustomEvent<{place?:string}>).detail?.place??'').trim();if(!destination)return;let attempts=0;const timer=window.setInterval(()=>{attempts++;const input=document.querySelector<HTMLInputElement>('#mapQuery');if(input){window.clearInterval(timer);input.value=destination;void searchMaps(destination);}else if(attempts>=50)window.clearInterval(timer);},60);});
  new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true}); wire();
};

if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') browserOnly();
