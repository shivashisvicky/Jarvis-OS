(() => {
  'use strict';
  const guard = () => {
    const input=document.querySelector('#videoQuery'), results=document.querySelector('#videoResults'), status=document.querySelector('#jvcStatus');
    if(!input||!results||!status||!input.value.trim())return;
    const q=input.value.trim();
    setTimeout(()=>{
      if(document.querySelector('#videoQuery')?.value.trim()!==q)return;
      if(results.querySelector('.jvc-card'))return;
      const text=results.textContent||'';
      if(/no public video index responded|degraded/i.test(text))return;
      results.innerHTML='<div class="jlf-fallback">No public video index responded with results. JARVIS will not redirect you.</div>';
      status.textContent='VIDEO INDEX DEGRADED · NO REDIRECT';
      window.jarvisLog?.('media','failure guard applied',{query:q});
    },4200);
  };
  const o=new MutationObserver(()=>{if(document.querySelector('#videoSearch'))guard()});
  o.observe(document.body,{childList:true,subtree:true});
})();
