(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_PLAN_SHAPE_V3__)return;
window.__JARVIS_SPATIAL_PLAN_SHAPE_V3__=true;
let installed=false;
const trace=(step,data={})=>{try{window.dispatchEvent(new CustomEvent('jarvis:command-chain-trace',{detail:{stage:'SPATIAL_PLAN_SHAPE',step,...data}}))}catch{}};
const isSpatial=args=>{try{const body=args[1]?.body;if(typeof body!=='string')return false;const d=JSON.parse(body);return /JARVIS Spatial Planner/i.test(String(d?.query||''))}catch{return false}};
const canonical=value=>{
 if(Array.isArray(value))return {operations:value,explanation:''};
 if(value&&typeof value==='object'&&!Array.isArray(value)&&value.op&&!Array.isArray(value.operations))return {operations:[value],explanation:String(value.explanation||'')};
 return value;
};
const install=()=>{
 if(installed||typeof window.fetch!=='function')return;
 const originalFetch=window.fetch;
 window.fetch=async(...args)=>{
  const response=await originalFetch(...args);
  if(!isSpatial(args))return response;
  try{
   const data=await response.clone().json();
   if(typeof data?.text==='string'){
    let parsed=null;
    try{parsed=JSON.parse(data.text)}catch{}
    const shaped=canonical(parsed);
    if(shaped&&shaped!==parsed){
     const text=JSON.stringify(shaped);
     trace('SINGLE_OPERATION_WRAPPED',{operationCount:shaped.operations.length});
     return new Response(JSON.stringify({...data,text}),{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json'}});
    }
   }
  }catch(e){trace('SHAPE_ERROR',{error:String(e?.message||e)})}
  return response;
 };
 installed=true;
 trace('SHAPE_GUARD_READY');
};
const arm=()=>{if(installed)return;install()};
window.addEventListener('jarvis:command-chain-trace',e=>{
 const d=e?.detail;
 if(d?.stage==='SPATIAL_LIFECYCLE'&&['SPATIAL_AI_RESPONSE_GUARD_READY','SPATIAL_ENGINE_READY'].includes(d?.step))arm();
});
new MutationObserver(()=>{if(document.getElementById('jarvisEngineeringBay')?.querySelector('[data-pane="spatial"]'))arm()}).observe(document.documentElement,{childList:true,subtree:true});
arm();
})();
