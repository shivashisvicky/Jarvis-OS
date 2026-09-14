(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_MOTORCYCLE_PATCH_V1__)return;
window.__JARVIS_SPATIAL_MOTORCYCLE_PATCH_V1__=true;
const nativeFetch=window.fetch.bind(window);
const intelligenceSource=/\/api\/(?:openai-intelligence|intelligence)(?:\?|$)/i;
function requestQuery(input,init){let request={};try{request=JSON.parse(String(init?.body||'{}'))}catch{}const q=String(request?.query||'');const m=q.match(/User request:\s*([\s\S]*)$/i);return(m?m[1]:q).trim()}
function simpleMotorcycleQuery(q){return /^(?:(?:create|build|make|construct|design|model|generate|draw|assemble)\s+)?(?:a\s+)?(?:new\s+)?(?:motorcycle|motorbike|motor cycle|bike)\s*[.!?]*$/i.test(String(q).trim())}
function motorcyclePlan(){
 const z=.06,wheelR=.38;
 const box=(name,width,height,depth,x,y,angle=0,material='metal')=>({op:'create',type:'box',name,dimensions:{width,height,depth},position:{x,y,z},rotation:{x:0,y:0,z:angle},material});
 const wheel=(name,x)=>({op:'create',type:'torus',name,dimensions:{radius:wheelR,tube:.045},position:{x,y:.38,z:0},rotation:{x:0,y:0,z:0},material:'black'});
 const hub=(name,x)=>({op:'create',type:'cylinder',name,dimensions:{radius:.055,height:.08},position:{x,y:.38,z:.03},rotation:{x:90,y:0,z:0},material:'metal'});
 const tank={op:'create',type:'lathe',name:'fuel_tank',dimensions:{profile:[[0,-.22],[.065,-.205],[.105,-.15],[.13,-.07],[.14,.03],[.125,.11],[.08,.18],[.025,.22],[0,.20]]},position:{x:-.07,y:.82,z},rotation:{x:0,y:0,z:90},material:'metal'};
 return {operations:[
  wheel('front_wheel',-.76),wheel('rear_wheel',.76),
  hub('front_hub',-.76),hub('rear_hub',.76),
  box('rear_swingarm',.68,.045,.055,.43,.47,174),
  box('rear_frame_rail',.54,.045,.055,.32,.64,164),
  box('seat_tube',.44,.055,.055,.10,.65,62),
  box('main_down_tube',.58,.055,.055,-.14,.55,142),
  box('upper_frame_tube',.58,.055,.055,-.06,.76,-158),
  box('head_tube',.18,.065,.065,-.53,.74,-108),
  box('front_fork',.50,.045,.045,-.65,.55,66),
  box('front_fork_lower',.34,.035,.045,-.69,.43,68),
  box('handlebar_stem',.20,.04,.045,-.57,.91,108),
  {op:'create',type:'cylinder',name:'handlebar',dimensions:{radius:.022,height:.44},position:{x:-.64,y:.99,z},rotation:{x:90,y:0,z:0},material:'metal'},
  tank,
  box('seat',.42,.055,.17,.34,.78,-3,'black'),
  box('engine_top',.22,.10,.18,.08,.58,0,'metal'),
  box('engine_block',.24,.20,.19,.12,.47,0,'metal'),
  box('engine_lower',.18,.09,.17,.15,.37,0,'metal'),
  {op:'create',type:'cylinder',name:'exhaust',dimensions:{radius:.032,height:.62},position:{x:.43,y:.46,z:.04},rotation:{x:0,y:90,z:0},material:'metal'},
  box('exhaust_header',.30,.035,.035,.27,.54,20,'metal'),
  {op:'create',type:'cylinder',name:'headlight',dimensions:{radius:.09,height:.055},position:{x:-.71,y:.84,z:.04},rotation:{x:90,y:0,z:0},material:'metal'},
  {op:'create',type:'cylinder',name:'front_brake',dimensions:{radius:.24,height:.018},position:{x:-.76,y:.38,z:.06},rotation:{x:90,y:0,z:0},material:'metal'},
  {op:'create',type:'cylinder',name:'rear_brake',dimensions:{radius:.17,height:.018},position:{x:.76,y:.38,z:.06},rotation:{x:90,y:0,z:0},material:'metal'},
  box('left_footpeg',.13,.025,.035,-.01,.43,-5,'black'),
  box('right_footpeg',.13,.025,.035,.25,.43,5,'black')
 ],explanation:'Constructed a motorcycle with ring tires, hubs, tubular-style frame, front fork and cockpit, a smooth lathed fuel tank, stepped engine, seat, exhaust, headlight, brakes and foot pegs.'};
}
function motorcycleResponse(){const plan=motorcyclePlan();return new Response(JSON.stringify({plan,text:JSON.stringify(plan)}),{status:200,headers:{'Content-Type':'application/json'}})}
window.fetch=async function(input,init){let url='';try{url=typeof input==='string'?input:String(input?.url||'')}catch{}if(!intelligenceSource.test(url))return nativeFetch(input,init);if(simpleMotorcycleQuery(requestQuery(input,init)))return motorcycleResponse();return nativeFetch(input,init)};
})();
