(() => {
  'use strict';
  const install = () => {
    const b=document.querySelector('#playVideo'); if(!b || b.dataset.jlfPlay==='1')return;
    const n=b.cloneNode(true); b.replaceWith(n); n.dataset.jlfPlay='1';
    n.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const raw=document.querySelector('#videoUrl')?.value?.trim()||'';const id=raw.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)?.[1] || (/^[A-Za-z0-9_-]{11}$/.test(raw)?raw:null);const p=document.querySelector('#jarvisPlayer');const s=document.querySelector('#jvcStatus')||document.querySelector('#mediaState');if(id&&p){p.innerHTML=`<iframe title="JARVIS video player" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;if(s)s.textContent='PLAYING · JARVIS EMBED';}},true);
  };
  new MutationObserver(install).observe(document.body,{childList:true,subtree:true}); install();
})();
