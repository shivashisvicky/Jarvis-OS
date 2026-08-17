(()=>{
  const mount=()=>{const r=document.querySelector('#videoResults');if(!r||document.querySelector('#jvcStatus'))return;const h=document.querySelector('.media-side .panel-head');if(!h)return;const s=document.createElement('span');s.id='jvcStatus';s.className='live';s.textContent=document.querySelector('#mediaState')?.textContent||'READY';h.appendChild(s)};
  new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});mount();
})();
