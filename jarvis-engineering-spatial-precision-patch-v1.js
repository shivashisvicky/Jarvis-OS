(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_PRECISION_PATCH_V1__)return;
window.__JARVIS_SPATIAL_PRECISION_PATCH_V1__=true;
const nativeFetch=window.fetch.bind(window);
const spatialSource=/jarvis-engineering-spatial-ai-v1\.js(?:\?|$)/i;
function patch(code){
 if(!code.includes('function applyPlan(plan){'))return code;
 code=code.replace("'scaleSelected','materialSelected','deleteSelected','clear','inspect'","'scaleSelected','resizeSelected','materialSelected','deleteSelected','clear','inspect'");
 const promptNeedle='Keep names semantic. Never output executable code.';
 const promptPatch='Keep names semantic. Never output executable code. For precise resizing of the currently selected object use resizeSelected with delta dimensions in metres: {width,height,depth,radius}. Use only the dimension explicitly requested. Examples: 20mm shorter => height:-0.020; 10mm thicker => width:+0.010 and depth:+0.010; 30mm wider => width:+0.030. Preserve all other dimensions and position unless required. If the user says selected or it, do not retarget another object.';
 code=code.replace(promptNeedle,promptPatch);
 const localNeedle='function localPlan(q){';
 const localPatch=`function localPlan(q){
 const low=q.trim().toLowerCase();
 const unit=(q.match(/\\b(mm|cm|m|ft|feet|in|inch|inches)\\b/i)||[])[1]?.toLowerCase()||'m';
 const amount=q.match(/(\\d+(?:\\.\\d+)?)\\s*(mm|cm|m|ft|feet|in|inch|inches)?/i);
 const toM=v=>Number(v)*(unitToM[(amount?.[2]||unit).toLowerCase()]||1);
 if(/\\b(selected|current)\\b/.test(low)&&/\\b(shorter|taller|thinner|thicker|wider|narrower|deeper|shallower)\\b/.test(low)){
  if(!amount)return null;
  const v=toM(amount[1]),d={};
  if(/shorter|taller/.test(low))d.height=/shorter/.test(low)?-v:v;
  else if(/thinner|thicker/.test(low)){const s=/thinner/.test(low)?-v:v;d.width=s;d.depth=s}
  else if(/wider|narrower/.test(low))d.width=/narrower/.test(low)?-v:v;
  else if(/deeper|shallower/.test(low))d.depth=/shallower/.test(low)?-v:v;
  return{operations:[{op:'resizeSelected',delta:d}],explanation:'Applying the requested precise dimension change to the selected object.'};
 }
`;
 if(code.includes(localNeedle)&&!code.includes("Applying the requested precise dimension change")){
  code=code.replace(localNeedle,localPatch);
 }
 const applyNeedle="const targets=resolveTargets(o.target);if(!targets.length)continue;const c=groupCenter(targets);";
 const applyPatch="if(o.op==='resizeSelected'){const s=selected();if(!s)continue;const d=s.dimensions||{},delta=o.delta||{};for(const k of ['width','height','depth','radius']){if(delta[k]!==undefined&&Number.isFinite(Number(delta[k]))&&d[k]!==undefined)d[k]=Math.max(k==='height'||k==='width'||k==='depth'?0.001:0.001,Number(d[k])+Number(delta[k]))}if(delta.height!==undefined&&d.height!==undefined)s.position={x:s.position?.x||0,y:(s.position?.y||0)+Number(delta.height)/2,z:s.position?.z||0};continue}const targets=resolveTargets(o.target);if(!targets.length)continue;const c=groupCenter(targets);";
 code=code.replace(applyNeedle,applyPatch);
 return code;
}
window.fetch=async function(input,init){let url='';try{url=typeof input==='string'?input:String(input?.url||'')}catch{}if(!spatialSource.test(url))return nativeFetch(input,init);const res=await nativeFetch(input,init);if(!res.ok)return res;const code=await res.text();return new Response(patch(code),{status:res.status,statusText:res.statusText,headers:res.headers})};
})();
