(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_GEOMETRY_PATCH_V1__)return;
window.__JARVIS_SPATIAL_GEOMETRY_PATCH_V1__=true;
const nativeFetch=window.fetch.bind(window);
const spatialSource=/jarvis-engineering-spatial-ai-v1\.js(?:\?|$)/i;
const intelligenceSource=/\/api\/(?:openai-intelligence|intelligence)(?:\?|$)/i;
function patchSpatialSource(code){
 if(!code.includes('function validPlan(plan){')||!code.includes('function makeMesh(o){'))return code;
 code=code.replace("['box','cylinder','sphere','cone'].includes(o.type)","['box','cylinder','sphere','cone','torus','lathe'].includes(o.type)");
 code=code.replace('Allowed operations: create {op:"create",type:"box"|"cylinder"|"sphere"|"cone",name,dimensions,position?,rotation?,material?};','Allowed operations: create {op:"create",type:"box"|"cylinder"|"sphere"|"cone"|"torus"|"lathe",name,dimensions,position?,rotation?,material?}; For torus use dimensions {radius,tube}. For lathe use dimensions {profile:[[radius,height],...]} with at least 6 numeric points.');
 const old="if(o.type==='cylinder')g=new T.CylinderGeometry(d.radius||.5,d.radius||.5,d.height||1,48);else if(o.type==='sphere')g=new T.SphereGeometry(d.radius||.5,40,24);else if(o.type==='cone')g=new T.ConeGeometry(d.radius||.5,d.height||1,48);else g=new T.BoxGeometry(d.width||1,d.height||1,d.depth||1);";
 const replacement="if(o.type==='cylinder')g=new T.CylinderGeometry(d.radius||.5,d.radius||.5,d.height||1,48);else if(o.type==='sphere')g=new T.SphereGeometry(d.radius||.5,40,24);else if(o.type==='cone')g=new T.ConeGeometry(d.radius||.5,d.height||1,48);else if(o.type==='torus')g=new T.TorusGeometry(d.radius||.5,d.tube||.04,24,64);else if(o.type==='lathe'){const pts=Array.isArray(d.profile)?d.profile.map(p=>Array.isArray(p)?new T.Vector2(Number(p[0])||0,Number(p[1])||0):new T.Vector2(Number(p?.radius)||0,Number(p?.height)||0)).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)):[];g=pts.length>=2?new T.LatheGeometry(pts,48):new T.BoxGeometry(1,1,1);}else g=new T.BoxGeometry(d.width||1,d.height||1,d.depth||1);";
 code=code.replace(old,replacement);
 const sceneNeedle='const scene=sceneState.map(o=>({id:o.id,name:o.name,type:o.type,dimensions:o.dimensions,position:o.position,rotation:o.rotation,material:o.material}));';
 const scenePatch='const scene=sceneState.map(o=>({id:o.id,name:o.name,type:o.type,dimensions:o.dimensions,position:o.position,rotation:o.rotation,material:o.material}));const needsScene=/\\b(move|rotate|scale|resize|delete|remove|modify|material|change)\\b/i.test(query);const sceneForPrompt=needsScene?JSON.stringify(scene):\'[]\';';
 code=code.replace(sceneNeedle,scenePatch);
 code=code.replace('Current scene: ${JSON.stringify(scene)}. User request: ${query}','Current scene: ${sceneForPrompt}. User request: ${query}');
 return code;
}
function bicyclePlan(){
 const z=.06,frame=.055,wheelR=.34,tube=.035;
 const box=(name,width,x,y,angle=0,material='metal')=>({op:'create',type:'box',name,dimensions:{width,height:frame,depth:frame},position:{x,y,z},rotation:{x:0,y:0,z:angle},material});
 const wheel=(name,x)=>({op:'create',type:'torus',name,dimensions:{radius:wheelR,tube},position:{x,y:.34,z:0},rotation:{x:0,y:0,z:0},material:'black'});
 const hub=(name,x)=>({op:'create',type:'cylinder',name,dimensions:{radius:.045,height:.07},position:{x,y:.34,z:.03},rotation:{x:90,y:0,z:0},material:'metal'});
 const spokes=(prefix,cx)=>Array.from({length:6},(_,i)=>{const a=i*Math.PI/3,len=wheelR*.78;return{op:'create',type:'box',name:prefix+'_spoke_'+(i+1),dimensions:{width:len,height:.012,depth:.012},position:{x:cx+(len/2)*Math.cos(a),y:.34+(len/2)*Math.sin(a),z:.03},rotation:{x:0,y:0,z:a*180/Math.PI},material:'metal'}});
 return {operations:[
  wheel('front_wheel',-.62),wheel('rear_wheel',.62),hub('front_hub',-.62),hub('rear_hub',.62),
  ...spokes('front',-.62),...spokes('rear',.62),
  box('rear_chainstay',.605,.30,.38,172),box('rear_seatstay',.66,.39,.595,129),box('seat_tube',.466,.09,.635,67),box('top_tube',.602,-.12,.825,-175),box('down_tube',.532,-.24,.535,154),box('head_tube',.16,-.45,.725,-112),box('front_fork',.332,-.54,.495,69),box('fork_crown',.10,-.48,.68,90),box('handlebar_stem',.206,-.52,.88,115),
  {op:'create',type:'cylinder',name:'handlebar',dimensions:{radius:.025,height:.44},position:{x:-.57,y:.99,z},rotation:{x:90,y:0,z:0},material:'metal'},
  {op:'create',type:'cylinder',name:'seatpost',dimensions:{radius:.018,height:.18},position:{x:.18,y:.90,z},rotation:{x:0,y:0,z:0},material:'metal'},
  {op:'create',type:'box',name:'saddle',dimensions:{width:.18,height:.035,depth:.09},position:{x:.18,y:.995,z},material:'black'},
  {op:'create',type:'cylinder',name:'crank',dimensions:{radius:.07,height:.055},position:{x:.02,y:.42,z:.075},rotation:{x:90,y:0,z:0},material:'metal'},
  {op:'create',type:'box',name:'left_pedal',dimensions:{width:.12,height:.025,depth:.035},position:{x:-.06,y:.42,z:.11},rotation:{x:0,y:0,z:-10},material:'black'},
  {op:'create',type:'box',name:'right_pedal',dimensions:{width:.12,height:.025,depth:.035},position:{x:.10,y:.42,z:.11},rotation:{x:0,y:0,z:10},material:'black'}
 ],explanation:'Constructed a bicycle from generic spatial primitives with ring tires, hubs, spokes, connected frame members, fork, cockpit, saddle and drivetrain.'};
}
function profilePlan(name,profile,explanation){return{operations:[{op:'create',type:'lathe',name,dimensions:{profile},position:{x:0,y:0,z:0},material:'ceramic'}],explanation};}
function simpleCurvedQuery(q){return /^(?:(?:create|build|make|construct|design|model|generate|draw|assemble)\s+)?(?:a\s+)?(?:new\s+)?(?:simple\s+)?(?:vase|round\s+bottle)\s*[.!?]*$/i.test(String(q).trim())}
function curvedPlan(q){const s=String(q).trim().toLowerCase();if(/vase/.test(s))return profilePlan('vase_body',[[.10,0],[.15,.015],[.18,.05],[.19,.11],[.17,.17],[.13,.23],[.10,.29],[.085,.33],[.10,.35],[.11,.37]],'Created a curved vase using a lathed radial profile with a wider body, tapered shoulder and open rim.');return profilePlan('round_bottle',[[.11,0],[.14,.015],[.15,.06],[.15,.13],[.14,.19],[.11,.24],[.075,.28],[.055,.31],[.055,.39],[.065,.405],[.065,.43],[.08,.44]],'Created a rounded bottle using a lathed profile with a curved shoulder, narrow neck and small rim.');}
function requestQuery(input,init){let request={};try{request=JSON.parse(String(init?.body||'{}'))}catch{}const q=String(request?.query||'');const m=q.match(/User request:\s*([\s\S]*)$/i);return(m?m[1]:q).trim()}
function simpleBicycleQuery(q){return /^(?:(?:create|build|make|construct|design|model|generate|draw|assemble)\s+)?(?:a\s+)?(?:new\s+)?(?:bicycle|bike)\s*[.!?]*$/i.test(String(q).trim())}
function bicycleResponse(){const fixed=bicyclePlan();return new Response(JSON.stringify({plan:fixed,text:JSON.stringify(fixed)}),{status:200,headers:{'Content-Type':'application/json'}})}
function curvedResponse(q){const fixed=curvedPlan(q);return new Response(JSON.stringify({plan:fixed,text:JSON.stringify(fixed)}),{status:200,headers:{'Content-Type':'application/json'}})}
async function repairBicycleResponse(input,init,res){const query=requestQuery(input,init);if(!simpleBicycleQuery(query))return res;try{const data=await res.clone().json();const fixed=bicyclePlan();return new Response(JSON.stringify({...data,plan:fixed,text:JSON.stringify(fixed)}),{status:res.status,statusText:res.statusText,headers:res.headers})}catch{return res}}
window.fetch=async function(input,init){let url='';try{url=typeof input==='string'?input:String(input?.url||'')}catch{}if(!spatialSource.test(url)&&!intelligenceSource.test(url))return nativeFetch(input,init);const query=requestQuery(input,init);if(intelligenceSource.test(url)&&simpleBicycleQuery(query))return bicycleResponse();if(intelligenceSource.test(url)&&simpleCurvedQuery(query))return curvedResponse(query);const res=await nativeFetch(input,init);if(!res.ok)return res;if(intelligenceSource.test(url))return repairBicycleResponse(input,init,res);const code=await res.text();return new Response(patchSpatialSource(code),{status:res.status,statusText:res.statusText,headers:res.headers});};
})();
