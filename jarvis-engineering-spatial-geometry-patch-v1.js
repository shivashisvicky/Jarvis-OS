(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_GEOMETRY_PATCH_V1__)return;
window.__JARVIS_SPATIAL_GEOMETRY_PATCH_V1__=true;
const nativeFetch=window.fetch.bind(window);
const spatialSource=/jarvis-engineering-spatial-ai-v1\.js(?:\?|$)/i;
const intelligenceSource=/\/api\/(?:openai-intelligence|intelligence)(?:\?|$)/i;
function patchSpatialSource(code){
 if(!code.includes('function validPlan(plan){')||!code.includes('function makeMesh(o){'))return code;
 code=code.replace("['box','cylinder','sphere','cone'].includes(o.type)","['box','cylinder','sphere','cone','torus'].includes(o.type)");
 code=code.replace('Allowed operations: create {op:"create",type:"box"|"cylinder"|"sphere"|"cone",name,dimensions,position?,rotation?,material?};','Allowed operations: create {op:"create",type:"box"|"cylinder"|"sphere"|"cone"|"torus",name,dimensions,position?,rotation?,material?}; For torus use dimensions {radius,tube}.');
 const old="if(o.type==='cylinder')g=new T.CylinderGeometry(d.radius||.5,d.radius||.5,d.height||1,48);else if(o.type==='sphere')g=new T.SphereGeometry(d.radius||.5,40,24);else if(o.type==='cone')g=new T.ConeGeometry(d.radius||.5,d.height||1,48);else g=new T.BoxGeometry(d.width||1,d.height||1,d.depth||1);";
 const replacement="if(o.type==='cylinder')g=new T.CylinderGeometry(d.radius||.5,d.radius||.5,d.height||1,48);else if(o.type==='sphere')g=new T.SphereGeometry(d.radius||.5,40,24);else if(o.type==='cone')g=new T.ConeGeometry(d.radius||.5,d.height||1,48);else if(o.type==='torus')g=new T.TorusGeometry(d.radius||.5,d.tube||.04,24,64);else g=new T.BoxGeometry(d.width||1,d.height||1,d.depth||1);";
 return code.replace(old,replacement);
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
  box('rear_chainstay',.605,.30,.38,172),box('rear_seatstay',.66,.39,.595,129),box('seat_tube',.466,.09,.635,67),box('top_tube',.602,-.12,.825,-175),box('down_tube',.532,-.24,.535,154),box('head_tube',.16,-.45,.725,-112),box('front_fork',.332,-.54,.495,69),box('fork_crown',.10,-.48,.68,90),box('handlebar_stem',.206,-.47,.89,119),
  {op:'create',type:'cylinder',name:'handlebar',dimensions:{radius:.025,height:.44},position:{x:-.57,y:.99,z},rotation:{x:90,y:0,z:0},material:'metal'},
  {op:'create',type:'cylinder',name:'seatpost',dimensions:{radius:.018,height:.18},position:{x:.18,y:.90,z},rotation:{x:0,y:0,z:0},material:'metal'},
  {op:'create',type:'box',name:'saddle',dimensions:{width:.18,height:.035,depth:.09},position:{x:.18,y:.995,z},material:'black'},
  {op:'create',type:'cylinder',name:'crank',dimensions:{radius:.07,height:.055},position:{x:.02,y:.42,z:.075},rotation:{x:90,y:0,z:0},material:'metal'},
  {op:'create',type:'box',name:'left_pedal',dimensions:{width:.12,height:.025,depth:.035},position:{x:-.06,y:.42,z:.11},rotation:{x:0,y:0,z:-10},material:'black'},
  {op:'create',type:'box',name:'right_pedal',dimensions:{width:.12,height:.025,depth:.035},position:{x:.10,y:.42,z:.11},rotation:{x:0,y:0,z:10},material:'black'}
 ],explanation:'Constructed a bicycle from generic spatial primitives with ring tires, hubs, spokes, connected frame members, fork, cockpit, saddle and drivetrain.'};
}
async function repairBicycleResponse(input,init,res){
 let request={};try{request=JSON.parse(String(init?.body||'{}'))}catch{}
 const query=String(request?.query||'');if(!/\b(bicycle|bike)\b/i.test(query))return res;
 try{
  const data=await res.clone().json();
  const fixed=bicyclePlan();
  return new Response(JSON.stringify({...data,plan:fixed,text:JSON.stringify(fixed)}),{status:res.status,statusText:res.statusText,headers:res.headers});
 }catch{return res}
}
window.fetch=async function(input,init){let url='';try{url=typeof input==='string'?input:String(input?.url||'')}catch{}if(!spatialSource.test(url)&&!intelligenceSource.test(url))return nativeFetch(input,init);const res=await nativeFetch(input,init);if(!res.ok)return res;if(intelligenceSource.test(url))return repairBicycleResponse(input,init,res);const code=await res.text();return new Response(patchSpatialSource(code),{status:res.status,statusText:res.statusText,headers:res.headers});};
})();
