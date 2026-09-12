(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_V1_SAFE_LOADER__)return;
window.__JARVIS_SPATIAL_V1_SAFE_LOADER__=true;
const src='./jarvis-engineering-spatial-ai-v1.js?v=20260913-spatial-v1-safe';
fetch(src,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Spatial V1 HTTP '+r.status);return r.text()}).then(code=>{
  const broken='}finally{clearTimeout(timer);aiBusy=false}}';
  if(!code.includes(broken))throw Error('Spatial V1 patch target not found');
  code=code.replace(broken,'}finally{aiBusy=false}}');
  const blob=new Blob([code],{type:'text/javascript'});
  const s=document.createElement('script');s.src=URL.createObjectURL(blob);s.async=false;
  s.onload=()=>URL.revokeObjectURL(s.src);
  s.onerror=()=>URL.revokeObjectURL(s.src);
  document.head.appendChild(s);
}).catch(e=>{try{window.dispatchEvent(new CustomEvent('jarvis:command-chain-trace',{detail:{stage:'SPATIAL_LIFECYCLE',step:'SPATIAL_AI_SAFE_LOADER_ERROR',message:String(e?.message||e)}}))}catch{}});
})();
