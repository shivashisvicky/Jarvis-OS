(()=>{
  'use strict';
  if(window.__JARVIS_MAP_RENDER_SAFETY_V1__) return;
  window.__JARVIS_MAP_RENDER_SAFETY_V1__=1;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fallback=()=>{
    const frame=$('#mapFrame'),result=$('#mapResults');
    if(!frame||!result||!result.querySelector('.jv4-place')||frame.querySelector('iframe,.jv4-map-fallback'))return;
    const place=result.querySelector('.jv4-place');
    const detail=place?.querySelector('small')?.textContent||'';
    frame.innerHTML=`<iframe class="jv4-map-fallback" title="JARVIS map fallback" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=-0.15,51.49,-0.10,51.52&layer=mapnik"></iframe>`;
    result.insertAdjacentHTML('beforeend',`<div class="jv4-provider">GEO SEARCH · PHOTON / ARCGIS / NOMINATIM · MAP RENDER FALLBACK · ${esc(detail)}</div>`);
  };
  const observer=new MutationObserver(()=>{clearTimeout(observer.__t);observer.__t=setTimeout(fallback,5500)});
  observer.observe(document.body,{childList:true,subtree:true});
})();
