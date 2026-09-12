(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_PLAN_SHAPE_V1__)return;
window.__JARVIS_SPATIAL_PLAN_SHAPE_V1__=true;
const originalFetch=window.fetch;
const isSpatial=args=>{try{const body=args[1]?.body;if(typeof body!=='string')return false;const d=JSON.parse(body);return /JARVIS Spatial Planner/i.test(String(d?.query||''))}catch{return false}};
const canonical=value=>{
  if(Array.isArray(value))return {operations:value,explanation:''};
  if(value&&typeof value==='object'&&!Array.isArray(value)&&value.op&&!Array.isArray(value.operations))return {operations:[value],explanation:String(value.explanation||'')};
  return value;
};
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
        try{window.dispatchEvent(new CustomEvent('jarvis:command-chain-trace',{detail:{stage:'SPATIAL_PLAN_SHAPE',step:'SINGLE_OPERATION_WRAPPED',operationCount:shaped.operations.length}}))}catch{}
        return new Response(JSON.stringify({...data,text}),{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json'}});
      }
    }
  }catch(e){try{window.dispatchEvent(new CustomEvent('jarvis:command-chain-trace',{detail:{stage:'SPATIAL_PLAN_SHAPE',step:'SHAPE_ERROR',error:String(e?.message||e)}}))}catch{}}
  return response;
};
})();
