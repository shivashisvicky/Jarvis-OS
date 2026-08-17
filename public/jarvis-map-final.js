(()=>{
  'use strict';
  if(window.__JARVIS_MAP_AUTHORITY_V3__) return;
  window.__JARVIS_MAP_AUTHORITY_V3__=1;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const aliases=[
    {re:/maa\s+enclave/i,name:'Maa Enclave',detail:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',lat:20.2923,lon:85.8638},
    {re:/jagannath\s+nagar/i,name:'Jagannath Nagar',detail:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638},
    {re:/ggp\s+colony/i,name:'GGP Colony',detail:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',lat:20.2934,lon:85.8659},
    {re:/jharapada|jharpada/i,name:'Jharapada',detail:'Bhubaneswar, Odisha',lat:20.2910,lon:85.8680},
    {re:/bhubaneswar/i,name:'Bhubaneswar',detail:'Odisha, India',lat:20.2961,lon:85.8245}
  ];
  const embed=(lat,lon)=>{const d=.025;return `https://www.openstreetmap.org/export/embed.html?bbox=${lon-d},${lat-d},${lon+d},${lat+d}&layer=mapnik&marker=${lat},${lon}`};
  const resolve=term=>aliases.find(x=>x.re.test(term));
  const run=()=>{
    const q=document.querySelector('#mapQuery'),results=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame');
    if(!q||!results||!frame)return;
    const term=q.value.trim();if(!term)return;
    const alias=resolve(term);
    if(alias){
      results.innerHTML=`<button class="place-result" type="button"><strong>${esc(alias.name)}</strong><small>${esc(alias.detail)}</small><small>JARVIS local geo alias · Bhubaneswar</small></button>`;
      frame.innerHTML=`<iframe title="${esc(alias.name)} map" loading="lazy" src="${embed(alias.lat,alias.lon)}"></iframe>`;
      return;
    }
    results.innerHTML='<div class="empty">SEARCHING BHUBANESWAR GEO INDEX…</div>';
    fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(term+', Bhubaneswar, Odisha, India')}`,{headers:{Accept:'application/json'}})
      .then(r=>r.ok?r.json():[]).then(places=>{
        results.innerHTML=(places||[]).map(p=>`<button class="place-result" data-lat="${esc(p.lat)}" data-lon="${esc(p.lon)}"><strong>${esc(String(p.display_name).split(',').slice(0,2).join(', '))}</strong><small>${esc(p.display_name)}</small></button>`).join('')||'<div class="empty">Place not found.</div>';
        results.querySelectorAll('[data-lat]').forEach(b=>b.addEventListener('click',()=>{frame.innerHTML=`<iframe title="JARVIS map" loading="lazy" src="${embed(Number(b.dataset.lat),Number(b.dataset.lon))}"></iframe>`}));
        const first=results.querySelector('[data-lat]');if(first)first.click();
      }).catch(()=>{results.innerHTML='<div class="empty">Map provider unavailable. JARVIS local Bhubaneswar aliases remain available.</div>'});
  };
  const bind=()=>{
    const button=document.querySelector('#mapSearch');if(!button||button.dataset.jarvisMapBound==='1')return;
    setTimeout(()=>{
      const current=document.querySelector('#mapSearch');if(!current||current.dataset.jarvisMapBound==='1')return;
      const fresh=current.cloneNode(true);fresh.dataset.jarvisMapBound='1';current.replaceWith(fresh);
      fresh.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();run()},true);
      const q=document.querySelector('#mapQuery');q?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();run()}},true);
    },0);
  };
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
  bind();
})();
