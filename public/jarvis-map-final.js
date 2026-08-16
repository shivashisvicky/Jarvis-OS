(() => {
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const aliases=[
    {re:/maa\s+enclave/i,name:'Maa Enclave',detail:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',lat:20.2923,lon:85.8638},
    {re:/jagannath\s+nagar/i,name:'Jagannath Nagar',detail:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638},
    {re:/ggp\s+colony/i,name:'GGP Colony',detail:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',lat:20.2934,lon:85.8659},
    {re:/jharapada/i,name:'Jharapada',detail:'Bhubaneswar, Odisha',lat:20.2928,lon:85.8587}
  ];
  const embed=(lat,lon)=>{const d=.025;return `https://www.openstreetmap.org/export/embed.html?bbox=${lon-d},${lat-d},${lon+d},${lat+d}&layer=mapnik&marker=${lat},${lon}`};
  const install=()=>{
    const q=document.querySelector('#mapQuery'),button=document.querySelector('#mapSearch'),results=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame');
    if(!q||!button||!results||!frame||button.dataset.finalMap==='1')return;
    button.dataset.finalMap='1';
    const run=async()=>{
      const term=q.value.trim(); if(!term)return;
      results.innerHTML='<div class="empty">JARVIS GEO CORE · RESOLVING PLACE…</div>';
      const alias=aliases.find(x=>x.re.test(term));
      if(alias){
        results.innerHTML=`<button class="place-result" type="button"><strong>${esc(alias.name)}</strong><small>${esc(alias.detail)}</small><small>JARVIS local geo alias · Bhubaneswar</small></button>`;
        frame.innerHTML=`<iframe title="${esc(alias.name)} map" loading="lazy" src="${embed(alias.lat,alias.lon)}"></iframe>`;
        return;
      }
      try{
        const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(term)}`,{headers:{Accept:'application/json'}});
        const places=await r.json();
        results.innerHTML=places.map(p=>`<button class="place-result" data-lat="${esc(p.lat)}" data-lon="${esc(p.lon)}"><strong>${esc(String(p.display_name).split(',').slice(0,2).join(', '))}</strong><small>${esc(p.display_name)}</small></button>`).join('')||'<div class="empty">Place not found.</div>';
        results.querySelectorAll('[data-lat]').forEach(b=>b.onclick=()=>{frame.innerHTML=`<iframe title="JARVIS map" loading="lazy" src="${embed(Number(b.dataset.lat),Number(b.dataset.lon))}"></iframe>`});
        const first=results.querySelector('[data-lat]'); if(first) first.click();
      }catch{results.innerHTML='<div class="empty">Map provider unavailable. JARVIS local Bhubaneswar aliases remain available.</div>';}
    };
    const fresh=button.cloneNode(true);button.replaceWith(fresh);fresh.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void run();},true);
    q.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();void run();}},true);
  };
  const observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true});install();
})();
