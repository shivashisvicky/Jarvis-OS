(()=>{
  'use strict';
  if(window.__JARVIS_MAP_RENDER_SAFETY_V2__) return;
  window.__JARVIS_MAP_RENDER_SAFETY_V2__=1;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fallback=async()=>{
    const frame=$('#mapFrame'),result=$('#mapResults'),q=$('#mapQuery')?.value?.trim();
    if(!frame||!result||!q||!result.querySelector('.jv4-place')||frame.querySelector('iframe,.jv4-map-fallback'))return;
    try{
      const r=await fetch(`https://photon.komoot.io/api/?limit=1&q=${encodeURIComponent(q)}`,{cache:'no-store'});
      const d=await r.json();const c=d?.features?.[0]?.geometry?.coordinates;if(!Array.isArray(c))return;
      const lon=Number(c[0]),lat=Number(c[1]),dx=.025,dy=.018;
      const detail=result.querySelector('.jv4-place small')?.textContent||'';
      frame.innerHTML=`<iframe class="jv4-map-fallback" title="JARVIS map fallback" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-dx},${lat-dy},${lon+dx},${lat+dy}&layer=mapnik&marker=${lat},${lon}"></iframe>`;
      result.insertAdjacentHTML('beforeend',`<div class="jv4-provider">GEO SEARCH · PHOTON / ARCGIS / NOMINATIM · MAP RENDER FALLBACK · ${esc(detail)}</div>`);
    }catch{}
  };
  const observer=new MutationObserver(()=>{clearTimeout(observer.__t);observer.__t=setTimeout(()=>void fallback(),5500)});
  observer.observe(document.body,{childList:true,subtree:true});
})();
