(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_CURVED_OBJECTS_PATCH_V1__)return;
window.__JARVIS_SPATIAL_CURVED_OBJECTS_PATCH_V1__=true;
const nativeFetch=window.fetch.bind(window);
const intelligenceSource=/\/api\/(?:openai-intelligence|intelligence)(?:\?|$)/i;
const simple=/^(?:(?:create|build|make|construct|design|model|generate|draw|assemble)\s+)?(?:a\s+)?(?:new\s+)?(?:(?:simple|round)\s+)?(?:bowl|wine\s+glass|glass|lampshade|lamp\s+shade|plate|cup)\s*[.!?]*$/i;
function planFor(q){
 const s=String(q).trim().toLowerCase();
 if(/bowl/.test(s))return{operations:[{op:'create',type:'lathe',name:'bowl_body',dimensions:{profile:[[.03,0],[.12,.01],[.19,.03],[.25,.07],[.29,.13],[.31,.20],[.30,.27],[.27,.32],[.24,.35],[.22,.36]]},position:{x:0,y:0,z:0},material:'ceramic'}],explanation:'Created a curved bowl using a lathed radial profile with a broad rounded body and open rim.'};
 if(/wine\s+glass|\bglass\b/.test(s))return{operations:[{op:'create',type:'lathe',name:'wine_glass',dimensions:{profile:[[.025,0],[.07,.01],[.10,.025],[.11,.04],[.055,.045],[.035,.06],[.025,.20],[.035,.22],[.07,.23],[.13,.25],[.17,.29],[.19,.36],[.18,.41],[.16,.44]]},position:{x:0,y:0,z:0},material:'glass'}],explanation:'Created a wine glass using a lathed profile with a foot, stem, bowl and open rim.'};
 if(/lampshade|lamp\s+shade/.test(s))return{operations:[{op:'create',type:'lathe',name:'lampshade',dimensions:{profile:[[.07,0],[.10,.02],[.16,.08],[.24,.18],[.30,.30],[.34,.38],[.35,.40],[.07,.40],[.07,.42]]},position:{x:0,y:0,z:0},material:'ceramic'}],explanation:'Created a flared lampshade using a lathed radial profile with a narrow top and wide lower rim.'};
 if(/plate/.test(s))return{operations:[{op:'create',type:'lathe',name:'plate',dimensions:{profile:[[.02,0],[.12,.005],[.24,.01],[.34,.025],[.40,.055],[.42,.08],[.41,.10],[.39,.115]]},position:{x:0,y:0,z:0},material:'ceramic'}],explanation:'Created a shallow curved plate using a lathed radial profile with a raised rim.'};
 return{operations:[{op:'create',type:'lathe',name:'cup',dimensions:{profile:[[.06,0],[.08,.015],[.10,.04],[.10,.16],[.105,.23],[.11,.27],[.13,.28],[.15,.29]]},position:{x:0,y:0,z:0},material:'ceramic'}],explanation:'Created a small curved cup using a lathed radial profile with a rounded body and open rim.'};
}
window.fetch=async function(input,init){let url='';try{url=typeof input==='string'?input:String(input?.url||'')}catch{}if(!intelligenceSource.test(url))return nativeFetch(input,init);let body={};try{body=JSON.parse(String(init?.body||'{}'))}catch{}const raw=String(body?.query||'');const m=raw.match(/User request:\s*([\s\S]*)$/i);const q=(m?m[1]:raw).trim();if(!simple.test(q))return nativeFetch(input,init);const plan=planFor(q);return new Response(JSON.stringify({plan,text:JSON.stringify(plan)}),{status:200,headers:{'Content-Type':'application/json'}})};
})();
