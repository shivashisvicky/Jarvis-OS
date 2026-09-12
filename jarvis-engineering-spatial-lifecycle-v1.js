(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_LIFECYCLE_V1__)return;
window.__JARVIS_SPATIAL_LIFECYCLE_V1__=true;
const trace=(step,data={})=>{try{window.dispatchEvent(new CustomEvent('jarvis:command-chain-trace',{detail:{stage:'SPATIAL_LIFECYCLE',step,...data}}))}catch{}};
let loading=false,loaded=false,retried=false;
const init=()=>{
 const bay=document.getElementById('jarvisEngineeringBay');
 const pane=bay?.querySelector('[data-pane="spatial"]');
 if(!bay||!pane||loaded||loading)return;
 loading=true;trace('BAY_SPATIAL_READY');
 const s=document.createElement('script');
 s.src='./jarvis-engineering-spatial-ai-v1.js?v=20260912-engineering-spatial-ai-v4';
 s.async=false;
 s.onload=()=>{
  loading=false;
  if(typeof window.jarvisSpatial?.run==='function'){
   loaded=true;trace('SPATIAL_AI_SCRIPT_LOADED');trace('SPATIAL_ENGINE_READY');return;
  }
  if(!retried){
   retried=true;
   try{delete window.__JARVIS_SPATIAL_AI_V1__}catch{}
   trace('SPATIAL_AI_INIT_RETRY');
   setTimeout(init,0);
   return;
  }
  loaded=true;trace('SPATIAL_AI_INIT_FAILED');
 };
 s.onerror=()=>{loading=false;loaded=true;trace('SPATIAL_AI_SCRIPT_ERROR')};
 document.head.appendChild(s);
};
new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});
init();
})();
