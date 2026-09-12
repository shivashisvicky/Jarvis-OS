(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_PLAN_SHAPE_V4__)return;
window.__JARVIS_SPATIAL_PLAN_SHAPE_V4__=true;
let wrapped=null;
const trace=(step,data={})=>{try{window.dispatchEvent(new CustomEvent('jarvis:command-chain-trace',{detail:{stage:'SPATIAL_PLAN_SHAPE',step,...data}}))}catch{}};
const isSpatial=args=>{try{const body=args[1]?.body;if(typeof body!=='string')return false;const d=JSON.parse(body);return /JARVIS Spatial Planner/i.test(String(d?.query||''))}catch{return false}};
const canonical=value=>{
 if(Array.isArray(value))return {operations:value,explanation:''};
 if(value&&typeof value==='object'&&!Array.isArray(value)&&value.op&&!Array.isArray(value.operations))return {operations:[value],explanation:String(value.explanation||'')};
 return value;
};
const install=()=>{
 if(typeof window.fetch!=='function'||window.fetch===wrapped)return;
 const base=window.fetch;
 const guarded=async(...args)=>{
  const response=await base(...args);
  if(!isSpatial(args))return response;
  try{
   const data=await response.clone().json();
   if(typeof data?.text==='string'){
    let parsed=null;
    try{parsed=JSON.parse(data.text)}catch{}
    const shaped=canonical(parsed);
    if(shaped&&shaped!==parsed){
     trace('SINGLE_OPERATION_WRAPPED',{operationCount:shaped.operations.length});
     return new Response(JSON.stringify({...data,text:JSON.stringify(shaped)}),{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json'}});
    }
   }
  }catch(e){trace('SHAPE_ERROR',{error:String(e?.message||e)})}
  return response;
 };
 window.fetch=guarded;
 wrapped=guarded;
 trace('SHAPE_GUARD_READY');
};
install();
setInterval(install,100);
})();
