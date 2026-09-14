(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_MOTORCYCLE_PATCH_V1__)return;
window.__JARVIS_SPATIAL_MOTORCYCLE_PATCH_V1__=true;
const nativeFetch=window.fetch.bind(window);
const intelligenceSource=/\/api\/(?:openai-intelligence|intelligence)(?:\?|$)/i;
function requestQuery(input,init){let request={};try{request=JSON.parse(String(init?.body||'{}'))}catch{}const q=String(request?.query||'');const m=q.match(/User request:\s*([\s\S]*)$/i);return(m?m[1]:q).trim()}
function simpleMotorcycleQuery(q){return /^(?:(?:create|build|make|construct|design|model|generate|draw|assemble)\s+)?(?:a\s+)?(?:new\s+)?(?:motorcycle|motorbike|motor cycle|bike)\s*[.!?]*$/i.test(String(q).trim())}
function motorcyclePlan(){
 const z=.06,wheelR=.34;
 const box=(name,width,height,depth,x,y,angle=0,material='metal')=>({op:'create',type:'box',name,dimensions:{width,height,depth},position:{x,y,z},rotation:{x:0,y:0,z:angle},material});
 const wheel=(name,x)=>({op:'create',type:'torus',name,dimensions:{radius:wheelR,tube:.045},position:{x,y:.34,z:0},rotation:{x:0,y:0,z:0},material:'black'});
 const hub=(name,x)=>({op:'create',type:'cylinder',name,dimensions:{radius:.055,height:.08},position:{x,y:.34,z:.03},rotation:{x:90,y:0,z:0},material:'metal'});
 return {operations:[
  wheel('front_wheel',-.66),wheel('rear_wheel',.66),
  hub('front_hub',-.66),hub('rear_hub',.66),
  box('rear_swingarm',.62,.045,.055,.38,.43,172),
  box('rear_frame_rail',.52,.045,.055,.30,.62,160),
  box('seat_tube',.42,.055,.055,.10,.65,66),
  box('main_down_tube',.55,.055,.055,-.16,.54,148),
  box('upper_frame_tube',.52,.055,.055,-.08,.76,-165),
  box('head_tube',.16,.065,.065,-.47,.72,-110),
  box('front_fork',.44,.045,.045,-.57,.53,70),
  box('front_fork_lower',.30,.035,.045,-.53,.42,72),
  box('handlebar_stem',.18,.04,.045,-.51,.91,112),
  {op:'create',type:'cylinder',name:'handlebar',dimensions:{radius:.022,height:.42},position:{x:-.57,y:.98,z},rotation:{x:90,y:0,z:0},material:'metal'},
  box('fuel_tank_base',.40,.15,.22,-.08,.83,-8),
  box('fuel_tank_front',.20,.13,.22,-.29,.79,-22),
  box('seat',.38,.055,.17,.29,.80,-3,'black'),
  box('engine_top',.22,.12,.18,.08,.58,0),
  box('engine_block',.24,.22,.19,.12,.48,0),
  box('engine_lower',.18,.10,.17,.15,.36,0),
  {op:'create',type:'cylinder',name:'exhaust',dimensions:{radius:.032,height:.58},position:{x:.39,y:.47,z:.04},rotation:{x:0,y:90,z:0},material:'metal'},
  box('exhaust_header',.28,.035,.035,.28,.53,18),
  {op:'create',type:'cylinder',name:'headlight',dimensions:{radius:.09,height:.055},position:{x:-.64,y:.82,z:.04},rotation:{x:90,y:0,z:0},material:'metal'},
  {op:'create',type:'cylinder',name:'front_brake',dimensions:{radius:.22,height:.018},position:{x:-.66,y:.34,z:.06},rotation:{x:90,y:0,z:0},material:'metal'},
  {op:'create',type:'cylinder',name:'rear_brake',dimensions:{radius:.16,height:.018},position:{x:.66,y:.34,z:.06},rotation:{x:90,y:0,z:0},material:'metal'},
  box('left_footpeg',.12,.025,.035,.00,.43,-5,'black'),
  box('right_footpeg',.12,.025,.035,.25,.43,5,'black')
 ],explanation:'Constructed a motorcycle from primitive geometry with a defined wheelbase, tubular-style frame, front fork and cockpit, shaped tank, stepped engine, seat, exhaust, headlight, brakes and foot pegs.'};
}
function motorcycleResponse(){const plan=motorcyclePlan();return new Response(JSON.stringify({plan,text:JSON.stringify(plan)}),{status:200,headers:{'Content-Type':'application/json'}})}
window.fetch=async function(input,init){let url='';try{url=typeof input==='string'?input:String(input?.url||'')}catch{}if(!intelligenceSource.test(url))return nativeFetch(input,init);if(simpleMotorcycleQuery(requestQuery(input,init)))return motorcycleResponse();return nativeFetch(input,init)};
})();
