(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_COMMAND_CENTER_PATCH_V1__)return;
window.__JARVIS_SPATIAL_COMMAND_CENTER_PATCH_V1__=true;

// Keep the Spatial Command Center's Enter key exactly equivalent to ASK JARVIS.
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.shiftKey)return;
  const input=e.target?.closest?.('#jbaiCommand');
  if(!(input instanceof HTMLInputElement))return;
  const button=document.querySelector('#jbaiRun');
  if(!(button instanceof HTMLButtonElement))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  button.click();
},true);

// Bicycle requests use a deterministic local assembly so the geometry remains recognizable
// and does not depend on Gemini choosing wheel dimensions/orientation correctly.
const previousFetch=window.fetch.bind(window);
const spatialSource=/jarvis-engineering-spatial-ai-v1\\.js(?:\\?|$)/i;
window.fetch=async function(input,init){
  let url='';try{url=typeof input==='string'?input:String(input?.url||'')}catch{}
  const res=await previousFetch(input,init);
  if(!res.ok||!spatialSource.test(url))return res;
  const code=await res.text();
  const needle='const conv=x=>x.n*(unitToM[x.u]||1),low=q.toLowerCase();let type=';
  if(!code.includes(needle))return new Response(code,{status:res.status,statusText:res.statusText,headers:res.headers});
  const bicycle=`const conv=x=>x.n*(unitToM[x.u]||1),low=q.toLowerCase();if(/\\b(bicycle|bike)\\b/i.test(low)){const metal='metal',black='black';return{operations:[
{op:'create',type:'cylinder',name:'rear_wheel',dimensions:{radius:.36,height:.06},position:{x:-.75,y:.36,z:0},rotation:{x:90,y:0,z:0},material:black},
{op:'create',type:'cylinder',name:'front_wheel',dimensions:{radius:.36,height:.06},position:{x:.75,y:.36,z:0},rotation:{x:90,y:0,z:0},material:black},
{op:'create',type:'box',name:'rear_chainstay',dimensions:{width:.573,height:.05,depth:.05},position:{x:-.475,y:.44,z:0},rotation:{x:0,y:0,z:16.2},material:metal},
{op:'create',type:'box',name:'seat_tube',dimensions:{width:.06,height:.409,depth:.06},position:{x:-.275,y:.71,z:0},rotation:{x:0,y:0,z:111.5},material:metal},
{op:'create',type:'box',name:'top_tube',dimensions:{width:.839,height:.05,depth:.05},position:{x:.065,y:.84,z:0},rotation:{x:0,y:0,z:-8.2},material:metal},
{op:'create',type:'box',name:'down_tube',dimensions:{width:.728,height:.05,depth:.05},position:{x:.14,y:.65,z:0},rotation:{x:0,y:0,z:20.9},material:metal},
{op:'create',type:'box',name:'front_fork',dimensions:{width:.499,height:.045,depth:.045},position:{x:.615,y:.57,z:0},rotation:{x:0,y:0,z:-57.3},material:metal},
{op:'create',type:'box',name:'handlebar',dimensions:{width:.28,height:.04,depth:.04},position:{x:.55,y:.98,z:0},rotation:{x:0,y:0,z:0},material:metal},
{op:'create',type:'box',name:'seat',dimensions:{width:.22,height:.05,depth:.12},position:{x:-.35,y:.96,z:0},rotation:{x:0,y:0,z:0},material:black},
{op:'create',type:'cylinder',name:'crank',dimensions:{radius:.055,height:.10},position:{x:-.2,y:.52,z:0},rotation:{x:90,y:0,z:0},material:metal},
{op:'create',type:'box',name:'left_pedal',dimensions:{width:.18,height:.035,depth:.06},position:{x:-.27,y:.48,z:.08},rotation:{x:0,y:0,z:0},material:black},
{op:'create',type:'box',name:'right_pedal',dimensions:{width:.18,height:.035,depth:.06},position:{x:-.13,y:.56,z:-.08},rotation:{x:0,y:0,z:0},material:black}
],explanation:'Created a recognizable bicycle assembly with two thin vertical wheels, frame, fork, handlebar, seat and crank.'};}let type=`;
  const patched=code.replace(needle,bicycle);
  return new Response(patched,{status:res.status,statusText:res.statusText,headers:res.headers});
};
})();
