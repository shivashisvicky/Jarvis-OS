(()=>{
  'use strict';
  if(window.__JARVIS_MAP_AUTHORITY_V4__) return;
  window.__JARVIS_MAP_AUTHORITY_V4__=1;
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
  const reconcile=()=>{
    const q=document.querySelector('#mapQuery'),results=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame');if(!q||!results||!frame)return;
    const alias=resolve(q.value.trim());if(!alias)return;
    const ok=results.textContent?.includes(alias.name)&&!!frame.querySelector('iframe');
    if(ok)return;
    results.innerHTML=`<button class="place-result" type="button"><strong>${esc(alias.name)}</strong><small>${esc(alias.detail)}</small><small>JARVIS local geo alias · Bhubaneswar</small></button>`;
    frame.innerHTML=`<iframe title="${esc(alias.name)} map" loading="lazy" src="${embed(alias.lat,alias.lon)}"></iframe>`;
  };
  const run=()=>{
    const q=document.querySelector('#mapQuery')?.value?.trim()||'';
    if(resolve(q)) reconcile();
    else if(window.jarvisMapSearch) void window.jarvisMapSearch(q);
  };
  const bind=()=>{
    const button=document.querySelector('#mapSearch');if(!button||button.dataset.jarvisMapBound==='1')return;
    setTimeout(()=>{
      const current=document.querySelector('#mapSearch');if(!current||current.dataset.jarvisMapBound==='1')return;
      const fresh=current.cloneNode(true);fresh.dataset.jarvisMapBound='1';current.replaceWith(fresh);
      fresh.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();run()},true);
      document.querySelector('#mapQuery')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();run()}},true);
    },0);
  };
  const observer=new MutationObserver(()=>{bind();clearTimeout(observer.__t);observer.__t=setTimeout(reconcile,15)});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  bind();
})();
