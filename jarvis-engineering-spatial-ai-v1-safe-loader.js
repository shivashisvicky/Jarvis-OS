(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_V1_SAFE_LOADER__)return;
window.__JARVIS_SPATIAL_V1_SAFE_LOADER__=true;
const src='./jarvis-engineering-spatial-ai-v1.js?v=20260913-spatial-v1-safe-2';
fetch(src,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Spatial V1 HTTP '+r.status);return r.text()}).then(code=>{
  // V1 has a Safari-incompatible timer reference in its outer finally.
  // Strip the cleanup call from the fetched source before execution.
  code=code.replace(/clearTimeout\(timer\);/g,'');
  // Allow the sanitized copy to become the active V1 runtime even if an older
  // copy was injected earlier in this page lifecycle.
  try{delete window.__JARVIS_SPATIAL_AI_V1__}catch{}
  const blob=new Blob([code],{type:'text/javascript'});
  const s=document.createElement('script');s.src=URL.createObjectURL(blob);s.async=false;
  s.onload=()=>URL.revokeObjectURL(s.src);
  s.onerror=()=>URL.revokeObjectURL(s.src);
  document.head.appendChild(s);
}).catch(e=>{try{window.dispatchEvent(new CustomEvent('jarvis:command-chain-trace',{detail:{stage:'SPATIAL_LIFECYCLE',step:'SPATIAL_AI_SAFE_LOADER_ERROR',message:String(e?.message||e)}}))}catch{}});
})();
