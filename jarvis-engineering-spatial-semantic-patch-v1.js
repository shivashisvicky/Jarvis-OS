(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_SEMANTIC_PATCH_V1__)return;
window.__JARVIS_SPATIAL_SEMANTIC_PATCH_V1__=true;
const nativeFetch=window.fetch.bind(window);
const spatialSource=/jarvis-engineering-spatial-ai-v1\.js(?:\?|$)/i;
const safeLoader=/jarvis-engineering-spatial-ai-v1-safe-loader\.js(?:\?|$)/i;
function patchSafeLoader(code){
 const needle="if(o.type==='cylinder'&&d.width!==undefined&&d.depth!==undefined){o.type='box'}";
 const replacement="if(o.type==='cylinder'&&d.width!==undefined&&d.depth!==undefined){const dia=Math.max(Number(d.width)||0,Number(d.depth)||0);const h=Number(d.height)||Math.max(.01,Math.min(Number(d.width)||.05,Number(d.depth)||.05)*.2);o.dimensions={radius:dia/2,height:h}}";
 return code.replace(needle,replacement);
}
function patch(code){
 if(!code.includes('function applyPlan(plan){'))return code;
 const promptNeedle='Keep names semantic. Never output executable code.';
 const promptPatch='Keep names semantic. Never output executable code. For any modification of an existing scene, add a target field naming the intended object or semantic group from the current scene, for example target:"monitor", target:"legs", or target:"desk". Use the actual semantic object names when possible. Plural targets such as legs or shelves may intentionally match multiple objects. Never rely on selection when the user explicitly names a target.';
 code=code.replace(promptNeedle,promptPatch);
 const start=code.indexOf('function selected(){');
 const end=code.indexOf('async function run(',start);
 if(start<0||end<0)return code;
 const block=`function selected(){return sceneState.find(o=>o.id===engine?.selected)||sceneState.at(-1)}
function normTarget(v){return String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function targetMatches(o,target){const t=normTarget(target),n=normTarget(o?.name),ty=normTarget(o?.type);if(!t)return false;if(n===t||n.includes(t)||t.includes(n)||ty===t)return true;if(t==='monitor'||t==='screen'||t==='display')return /monitor|screen|display/.test(n);if(t==='leg'||t==='legs')return /(^| )leg(?: |$)|leg[_ -]?\\d/.test(n);if(t==='shelf'||t==='shelves')return /shelf/.test(n);if(t==='desk')return /desk|tabletop|desktop|desk leg|desk shelf/.test(n)&&!/monitor/.test(n);if(t==='table')return /table|tabletop|table leg|table shelf/.test(n)&&!/monitor/.test(n);if(t==='wardrobe'||t==='cabinet')return /wardrobe|cabinet|panel|shelf/.test(n);if(t==='bicycle'||t==='bike')return /bicycle|bike|wheel|frame|fork|handlebar|seat|saddle|crank|pedal/.test(n);return false}
function resolveTargets(target){if(Array.isArray(target)){const out=[];target.forEach(t=>resolveTargets(t).forEach(o=>{if(!out.some(x=>x.id===o.id))out.push(o)}));return out}const t=String(target??'').trim();if(!t){const s=selected();return s?[s]:[]}return sceneState.filter(o=>targetMatches(o,t))}
function groupCenter(items){if(!items.length)return{x:0,y:0,z:0};const p=items.map(o=>o.position||{x:0,y:0,z:0});return{x:p.reduce((a,v)=>a+(v.x||0),0)/p.length,y:p.reduce((a,v)=>a+(v.y||0),0)/p.length,z:p.reduce((a,v)=>a+(v.z||0),0)/p.length}}
function rotatePointAround(p,c,degrees){const a=(Number(degrees)||0)*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a),x=(p.x||0)-c.x,z=(p.z||0)-c.z;return{x:c.x+x*cos-z*sin,y:p.y||0,z:c.z+x*sin+z*cos}}
function applyPlan(plan){for(const o of plan.operations){if(o.op==='clear'){sceneState=[];if(engine)engine.selected=null;continue}if(o.op==='create'){const id='obj-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);sceneState.push({id,name:String(o.name||o.type||'Object'),type:o.type,dimensions:o.dimensions||{},position:o.position||{x:0,y:0,z:0},rotation:o.rotation||{x:0,y:0,z:0},scale:o.scale||{x:1,y:1,z:1},material:String(o.material||'default')});if(engine)engine.selected=id;continue}
const targets=resolveTargets(o.target);if(!targets.length)continue;const c=groupCenter(targets);
if(o.op==='moveSelected'){for(const s of targets)s.position={x:(s.position?.x||0)+(o.delta?.x||0),y:(s.position?.y||0)+(o.delta?.y||0),z:(s.position?.z||0)+(o.delta?.z||0)}}
else if(o.op==='rotateSelected'){const dx=o.degrees?.x||0,dy=o.degrees?.y||0,dz=o.degrees?.z||0;for(const s of targets){s.rotation={x:(s.rotation?.x||0)+dx,y:(s.rotation?.y||0)+dy,z:(s.rotation?.z||0)+dz};if(targets.length>1&&dz)s.position=rotatePointAround(s.position,c,dz)}}
else if(o.op==='scaleSelected'){const f={x:Number(o.factor?.x??1),y:Number(o.factor?.y??1),z:Number(o.factor?.z??1)};for(const s of targets){s.scale={x:(s.scale?.x||1)*f.x,y:(s.scale?.y||1)*f.y,z:(s.scale?.z||1)*f.z};const d=s.dimensions||{};if(d.width!==undefined)d.width*=f.x;if(d.height!==undefined)d.height*=f.y;if(d.depth!==undefined)d.depth*=f.z;if(d.radius!==undefined)d.radius*=Math.max(f.x,f.z);s.position={x:c.x+((s.position?.x||0)-c.x)*f.x,y:c.y+((s.position?.y||0)-c.y)*f.y,z:c.z+((s.position?.z||0)-c.z)*f.z}}}
else if(o.op==='materialSelected'){for(const s of targets)s.material=String(o.material||'default')}
else if(o.op==='deleteSelected'){const ids=new Set(targets.map(s=>s.id));sceneState=sceneState.filter(x=>!ids.has(x.id));if(engine)engine.selected=sceneState.at(-1)?.id||null}}
save(sceneState);return sceneState}
`;
 return code.slice(0,start)+block+code.slice(end);
}
window.fetch=async function(input,init){let url='';try{url=typeof input==='string'?input:String(input?.url||'')}catch{}const isSafe=safeLoader.test(url),isSpatial=spatialSource.test(url)&&!isSafe;if(!isSafe&&!isSpatial)return nativeFetch(input,init);const res=await nativeFetch(input,init);if(!res.ok)return res;const code=await res.text();const patched=isSafe?patchSafeLoader(code):patch(code);return new Response(patched,{status:res.status,statusText:res.statusText,headers:res.headers});};
})();
