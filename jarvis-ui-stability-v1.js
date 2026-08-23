(()=>{
'use strict';
if(window.__JARVIS_UI_STABILITY_V1__)return;
window.__JARVIS_UI_STABILITY_V1__=true;

const tidyMaps=()=>{
  const results=document.querySelector('#mapResults');
  const frame=document.querySelector('#mapFrame');
  if(results&&frame&&frame.querySelector('.empty')?.textContent?.trim()==='Search for a place to begin.'){
    frame.innerHTML='';
    frame.style.display='none';
  }
};
const stabilize=()=>{
  tidyMaps();
  const ws=document.querySelector('#workspace');
  if(ws)ws.style.contain='layout style';
};
stabilize();
new MutationObserver(stabilize).observe(document.documentElement,{childList:true,subtree:true});
})();
