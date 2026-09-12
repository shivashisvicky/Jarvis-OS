(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_PLAN_SHAPE_V5__)return;
window.__JARVIS_SPATIAL_PLAN_SHAPE_V5__=true;
let wrapped=null;
const trace=(step,data={})=>{try{window.dispatchEvent(new CustomEvent('jarvis:command-chain-trace',{detail:{stage:'SPATIAL_PLAN_SHAPE',step,...data}}))}catch{}};
const spatial=args=>{try{const b=args[1]?.body;if(typeof b!=='string')return false;const d=JSON.parse(b);return /JARVIS Spatial Planner/i.test(String(d?.query||''))}catch{return false}};
const parse=t=>{try{const x=JSON.parse(String(t||'').trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim());return x&&typeof x==='object'?x:null}catch{return null}};
const canonical=v=>{if(Array.isArray(v))return{operations:v,explanation:''};if(v&&typeof v==='object'&&!Array.isArray(v)&&v.op&&!Array.isArray(v.operations))return{operations:[v],explanation:String(v.explanation||'')};return v};
const needsCompletion=(query,op)=>{const s=String(query||'');if(op?.op!=='create')return false;if(!/\b(?:desk|table|workstation|assembly|cabinet|shelf|monitor|legs?|tray|components?|parts?)\b/i.test(s))return false;return /\b(?:and|with|four|three|two|multiple|each|legs?|shelf|monitor|tray|lower)\b/i.test(s)};
const install=()=>{
 if(typeof window.fetch!=='function'||window.fetch===wrapped)return;
 const base=window.fetch;
 const guarded=async(...args)=>{
  const response=await base(...args);
  if(!spatial(args))return response;
  try{
   const data=await response.clone().json();
   const parsed=parse(data?.text);
   const shaped=canonical(parsed);
   if(shaped&&shaped!==parsed){trace('SINGLE_OPERATION_WRAPPED',{operationCount:shaped.operations.length});return new Response(JSON.stringify({...data,text:JSON.stringify(shaped)}),{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json'}})}
   const ops=Array.isArray(shaped?.operations)?shaped.operations:null;
   const original=JSON.parse(args[1].body);
   if(!ops||ops.length!==1||!needsCompletion(original.query,ops[0]))return response;
   trace('PARTIAL_PLAN_DETECTED',{operation:ops[0].op||'',type:ops[0].type||'',operationCount:1});
   const completion=`You are the JARVIS Spatial Planner completing an incomplete plan. Return JSON only in exactly this shape: {"operations":[],"explanation":""}. The user's request was: ${String(original.query).replace(/\s+/g,' ').trim()}\nThe planner returned only this partial operation: ${JSON.stringify(ops[0])}\nComplete the ENTIRE requested scene. Preserve the partial operation when appropriate, but add EVERY missing requested component. Use one create operation per distinct physical object. If the request says four legs, create four leg objects. If it requests a lower shelf, create it. If it requests a monitor, create it. Do not return a single operation. For assemblies, the operations array must contain all requested components before any later mutations. Allowed operations: create {op:"create",type:"box"|"cylinder"|"sphere"|"cone",name,dimensions,position?,rotation?,material?}; select {op:"select",target:{name?:string,semantic?:string,type?:string}}; resizeSelected {op:"resizeSelected",delta:{x,y,z}}; moveSelected {op:"moveSelected",delta:{x,y,z}}; rotateSelected {op:"rotateSelected",degrees:{x,y,z}}; scaleSelected {op:"scaleSelected",factor:{x,y,z}}; materialSelected {op:"materialSelected",material}; deleteSelected; clear; inspect. Dimensions, positions and deltas MUST be SI metres.`;
   const retryBody={...original,query:completion,context:[]};
   const retry=await base(...[args[0],{...args[1],body:JSON.stringify(retryBody)}]);
   const retryData=await retry.clone().json().catch(()=>null);
   const completed=canonical(parse(retryData?.text));
   if(completed&&Array.isArray(completed.operations)&&completed.operations.length>1){trace('COMPLETION_ACCEPTED',{operationCount:completed.operations.length});return new Response(JSON.stringify({...retryData,text:JSON.stringify(completed)}),{status:retry.status,statusText:retry.statusText,headers:{'Content-Type':'application/json'}})}
   trace('COMPLETION_REJECTED',{reason:'Planner still returned an incomplete plan'});
  }catch(e){trace('COMPLETION_ERROR',{error:String(e?.message||e)})}
  return response;
 };
 window.fetch=guarded;wrapped=guarded;trace('SHAPE_GUARD_READY');
};
install();setInterval(install,100);
})();
