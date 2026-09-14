(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_SIMPLE_ASSEMBLY_PATCH_V1__)return;
window.__JARVIS_SPATIAL_SIMPLE_ASSEMBLY_PATCH_V1__=true;
const nativeFetch=window.fetch.bind(window);
const intelligenceSource=/\/api\/(?:openai-intelligence|intelligence)(?:\?|$)/i;
const simpleDesk=/^(?:(?:create|build|make|construct|design|model|generate|draw|assemble)\s+)?(?:a\s+)?(?:new\s+)?desk\s*[.!?]*$/i;
function deskPlan(){
 const box=(name,width,height,depth,x,y,z,material)=>({op:'create',type:'box',name,dimensions:{width,height,depth},position:{x,y,z},material});
 const topHeight=.05,topY=.75,legHeight=.70;
 return{
  operations:[
   box('desk_tabletop',1.20,topHeight,.60,0,topY,0,'wood'),
   box('desk_leg_front_left',.05,legHeight,.05,-.525,.375,-.25,'metal'),
   box('desk_leg_front_right',.05,legHeight,.05,.525,.375,-.25,'metal'),
   box('desk_leg_rear_left',.05,legHeight,.05,-.525,.375,.25,'metal'),
   box('desk_leg_rear_right',.05,legHeight,.05,.525,.375,.25,'metal')
  ],
  explanation:'Created a simple office desk with a wooden tabletop and four metal legs.'
 };
}
window.fetch=async function(input,init){
 let url='';try{url=typeof input==='string'?input:String(input?.url||'')}catch{}
 if(!intelligenceSource.test(url))return nativeFetch(input,init);
 let body={};try{body=JSON.parse(String(init?.body||'{}'))}catch{}
 const raw=String(body?.query||'');
 const m=raw.match(/User request:\s*([\s\S]*)$/i);
 const q=(m?m[1]:raw).trim();
 if(!simpleDesk.test(q))return nativeFetch(input,init);
 const plan=deskPlan();
 return new Response(JSON.stringify({plan,text:JSON.stringify(plan),model:'local-spatial-simple-assembly',provider:'local'}),{status:200,headers:{'Content-Type':'application/json'}});
};
})();
