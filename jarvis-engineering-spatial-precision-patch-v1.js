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
 const promptPatch='Keep names semantic. Never output executable code. For precise resizing of the currently selected object use resizeSelected with delta dimensions in metres: {width,height,depth,radius}. For percentage resizing use resizeSelected with percent dimensions, where -0.20 means 20% smaller and +0.20 means 20% larger. Use only the dimension explicitly requested. Examples: 20mm shorter => height:-0.020; 20% shorter => percent:{height:-0.20}; 10mm thicker => width:+0.010 and depth:+0.010; 30mm wider => width:+0.030. Preserve all other dimensions and position unless required. If the user says selected or it, do not retarget another object.';
 code=code.replace(promptNeedle,promptPatch);
 const localNeedle='function localPlan(q){';
 const validNeedle='function validPlan(plan){';
 if(code.includes(localNeedle)&&code.includes(validNeedle)&&!code.includes('function __jarvisOriginalLocalPlan(q)')){
  code=code.replace(localNeedle,'function __jarvisOriginalLocalPlan(q){');
  const precisionFn=`function localPlan(q){
 const low=String(q||'').trim().toLowerCase();
 if(/\\b(selected|current)\\b/.test(low)&&/\\b(shorter|taller|thinner|thicker|wider|narrower|deeper|shallower)\\b/.test(low)){
  const pm=low.match(/(\\d+(?:\\.\\d+)?)\\s*%/);
  if(pm){
   const p=Number(pm[1])/100,d={};
   if(/\\b(shorter|taller)\\b/.test(low))d.height=/\\bshorter\\b/.test(low)?-p:p;
   else if(/\\b(thinner|thicker)\\b/.test(low)){const s=/\\bthinner\\b/.test(low)?-p:p;d.width=s;d.depth=s}
   else if(/\\b(wider|narrower)\\b/.test(low))d.width=/\\bnarrower\\b/.test(low)?-p:p;
   else if(/\\b(deeper|shallower)\\b/.test(low))d.depth=/\\bshallower\\b/.test(low)?-p:p;
   return{operations:[{op:'resizeSelected',percent:d}],explanation:'Applying the requested percentage dimension change to the selected object.'};
  }
  const am=low.match(/(\\d+(?:\\.\\d+)?)\\s*(mm|cm|m|ft|feet|in|inch|inches)\\b/);
  if(am){
   const factor={mm:.001,cm:.01,m:1,ft:.3048,feet:.3048,in:.0254,inch:.0254,inches:.0254}[am[2]]||1;
   const v=Number(am[1])*factor,d={};
   if(/\\b(shorter|taller)\\b/.test(low))d.height=/\\bshorter\\b/.test(low)?-v:v;
   else if(/\\b(thinner|thicker)\\b/.test(low)){const s=/\\bthinner\\b/.test(low)?-v:v;d.width=s;d.depth=s}
   else if(/\\b(wider|narrower)\\b/.test(low))d.width=/\\bnarrower\\b/.test(low)?-v:v;
   else if(/\\b(deeper|shallower)\\b/.test(low))d.depth=/\\bshallower\\b/.test(low)?-v:v;
   return{operations:[{op:'resizeSelected',delta:d}],explanation:'Applying the requested precise dimension change to the selected object.'};
  }
 }
 return __jarvisOriginalLocalPlan(q);
}
`;
  const at=code.indexOf(validNeedle);
  code=code.slice(0,at)+precisionFn+code.slice(at);
 }
 const applyNeedle="const targets=resolveTargets(o.target);if(!targets.length)continue;const c=groupCenter(targets);";
 const applyPatch="if(o.op==='resizeSelected'){const s=selected();if(!s)continue;const d=s.dimensions||{},delta=o.delta||{},percent=o.percent||{};for(const k of ['width','height','depth','radius']){if(percent[k]!==undefined&&d[k]!==undefined){const p=Number(percent[k]);if(Number.isFinite(p))d[k]=Math.max(0.001,Number(d[k])*(1+p))}if(delta[k]!==undefined&&Number.isFinite(Number(delta[k]))&&d[k]!==undefined)d[k]=Math.max(0.001,Number(d[k])+Number(delta[k]))}if((delta.height!==undefined||percent.height!==undefined)&&d.height!==undefined){const oldHeight=Number(d.height)/(percent.height!==undefined?(1+Number(percent.height)):1);const change=percent.height!==undefined?Number(oldHeight)*Number(percent.height):Number(delta.height||0);s.position={x:s.position?.x||0,y:(s.position?.y||0)+change/2,z:s.position?.z||0}}continue}const targets=resolveTargets(o.target);if(!targets.length)continue;const c=groupCenter(targets);";
 code=code.replace(applyNeedle,applyPatch);
 const selectionNeedle='let engine=null;';
 const selectionPatch=`function installViewportSelection(){
 const p=pane(),vp=p&&$('#jbaiViewport',p);const canvas=vp&&vp.querySelector('canvas');
 if(!canvas||canvas.dataset.jarvisSelection)return;
 canvas.dataset.jarvisSelection='1';
 canvas.addEventListener('click',e=>{
  if(!engine)return;
  const r=canvas.getBoundingClientRect();
  if(!r.width||!r.height)return;
  const ndc=new engine.THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
  const ray=new engine.THREE.Raycaster();ray.setFromCamera(ndc,engine.camera);
  const hits=ray.intersectObjects([...engine.meshes.values()],false);
  if(hits.length&&hits[0].object?.userData?.jarvisId)select(hits[0].object.userData.jarvisId);
 },false);
}
`;
 if(code.includes(selectionNeedle)&&!code.includes('function installViewportSelection()'))code=code.replace(selectionNeedle,selectionPatch+selectionNeedle);
 code=code.replace('engine.resize();renderTree()}catch(e){','engine.resize();renderTree();installViewportSelection()}catch(e){');
 return code;
}
window.fetch=async function(input,init){let url='';try{url=typeof input==='string'?input:String(input?.url||'')}catch{}if(!spatialSource.test(url))return nativeFetch(input,init);const res=await nativeFetch(input,init);if(!res.ok)return res;const code=await res.text();return new Response(patch(code),{status:res.status,statusText:res.statusText,headers:res.headers})};
})();
