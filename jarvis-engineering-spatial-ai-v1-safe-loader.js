(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_V1_SAFE_LOADER__)return;
window.__JARVIS_SPATIAL_V1_SAFE_LOADER__=true;
const src='./jarvis-engineering-spatial-ai-v1.js?v=20260913-spatial-v1-safe-5';
fetch(src,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Spatial V1 HTTP '+r.status);return r.text()}).then(code=>{
  // V1 has a Safari-incompatible timer reference in its outer finally.
  code=code.replace(/clearTimeout\(timer\);/g,'');

  // Furniture plans historically came back with cylindrical desk legs.
  // Keep generic cylinders intact, but normalize semantic desk/table legs
  // into slim rectangular metal supports. This changes geometry only.
  const planNeedle='const plan=JSON.parse(text);';
  const planPatch=`let plan=JSON.parse(text);plan=(()=>{const ops=Array.isArray(plan?.operations)?plan.operations.map(o=>{if(o?.op==='create'&&o.type==='cylinder'&&/\\bleg(?:_|\\s|-)|(?:^|[_\\s-])leg(?:$|[_\\s-])/i.test(String(o.name||''))){const d=o.dimensions||{},r=Number(d.radius)||0.025,h=Number(d.height)||0.7;return {...o,type:'box',dimensions:{width:r*2,depth:r*2,height:h},material:o.material||'metal'};}return o;}):plan?.operations;const explanation=String(plan?.explanation||'').replace(/cylindrical\\s+(?=(?:metal\\s+)?legs?\\b)/ig,'rectangular ');return {...plan,operations:ops,explanation};})();`;
  code=code.replace(planNeedle,planPatch);

  // Apply the same normalization to cached plans before they are reused.
  const cacheNeedle='if(c[key]&&validPlan(c[key]))return c[key]';
  const cachePatch='if(c[key]&&validPlan(c[key])){const p=c[key];p.operations=p.operations.map(o=>o?.op===\'create\'&&o.type===\'cylinder\'&&/\\bleg(?:_|\\s|-)|(?:^|[_\\s-])leg(?:$|[_\\s-])/i.test(String(o.name||\'\'))?{...o,type:\'box\',dimensions:{width:(Number(o.dimensions?.radius)||.025)*2,depth:(Number(o.dimensions?.radius)||.025)*2,height:Number(o.dimensions?.height)||.7},material:o.material||\'metal\'}:o);p.explanation=String(p.explanation||\'\').replace(/cylindrical\\s+(?=(?:metal\\s+)?legs?\\b)/ig,\'rectangular \');return p}' ;
  code=code.replace(cacheNeedle,cachePatch);

  // Normalize the human-facing response at the presentation boundary too.
  const sayNeedle='function say(text){';
  const sayPatch='function say(text){text=String(text??\'\').replace(/cylindrical\\s+(?=(?:metal\\s+)?legs?\\b)/ig,\'rectangular \');';
  code=code.replace(sayNeedle,sayPatch);

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
