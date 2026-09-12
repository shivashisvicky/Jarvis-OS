(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_AI_V2__)return;
window.__JARVIS_SPATIAL_AI_V2__=true;
if(typeof window.jarvisSpatial?.run==='function')return;
const s=document.createElement('script');
s.src='./jarvis-engineering-spatial-ai-v1.js?v=20260913-spatial-v1-compat';
s.async=false;
s.onload=()=>window.dispatchEvent(new Event('jarvis:spatial-v1-loaded'));
s.onerror=()=>console.warn('JARVIS Spatial V1 compatibility runtime failed to load');
document.head.appendChild(s);
})();
