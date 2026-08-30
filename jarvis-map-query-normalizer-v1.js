(()=>{'use strict';
if(window.__JARVIS_MAP_QUERY_NORMALIZER_V1__)return;
window.__JARVIS_MAP_QUERY_NORMALIZER_V1__=true;
window.addEventListener('jarvis:map-context',e=>{try{const q=String(e.detail?.query||'').trim();const input=document.querySelector('#mapQuery');if(input instanceof HTMLInputElement&&q)input.value=q}catch{}});
})();
