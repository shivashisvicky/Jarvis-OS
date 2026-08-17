(()=>{
  'use strict';
  if(window.__JARVIS_INTELLIGENCE_SAFETY_V1__) return;
  window.__JARVIS_INTELLIGENCE_SAFETY_V1__=1;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const reconcile=()=>{
    const r=$('#videoResults');
    if(!r)return;
    if(r.querySelector('.jv4-searching'))return;
    const cards=r.querySelectorAll('.jv4-video-card');
    if(cards.length)return;
    const q=$('#videoQuery')?.value?.trim()||'the requested topic';
    if(!r.querySelector('#jv4Retry')){
      r.innerHTML=`<div class="jv4-empty"><strong>LIVE VIDEO INDEX UNAVAILABLE</strong><p>No live video provider returned results for “${esc(q)}”. JARVIS kept the request inside the console.</p><button type="button" class="secondary" id="jv4Retry">RETRY LIVE SEARCH</button></div>`;
      $('#jv4Retry')?.addEventListener('click',()=>void window.jarvisVideoSearch?.(q));
    }
  };
  const observer=new MutationObserver(()=>{clearTimeout(observer.__t);observer.__t=setTimeout(reconcile,80)});
  observer.observe(document.body,{childList:true,subtree:true});
})();
