(()=>{
'use strict';
if(window.__JARVIS_MAP_CONTEXT_PROVIDER_V1__)return;
window.__JARVIS_MAP_CONTEXT_PROVIDER_V1__=true;

/*
 * Maps already owns the live POI result set. This module does not route
 * commands or create a second authority. It only makes the canonical
 * context engine read that live set when it is available.
 *
 * Important: this is installed after the Maps module, so it avoids the
 * load-order race that made the previous command-hotfix bridge inert.
 */
const install=()=>{
 const engine=window.jarvisContextEngine;
 const map=window.jarvisMapAuthority;
 if(!engine||!map||typeof engine.get!=='function'||typeof map.getContext!=='function')return false;
 if(engine.__JARVIS_MAP_CONTEXT_PROVIDER_V1__)return true;
 const originalGet=engine.get.bind(engine);
 engine.get=()=>{
  const base=originalGet()||{};
  try{
   const live=map.getContext()||{};
   const baseDomain=String(base.domain||'').toUpperCase();
   const liveDomain=String(live.domain||'').toUpperCase();
   const liveResults=Array.isArray(live.results)?live.results:[];
   /*
    * The context engine may already hold an explicit surface from the
    * user's latest command. Never let stale Maps state replace SEARCH,
    * BOOKS, MEDIA, or another concrete domain. Maps is only a fallback
    * source when the canonical context has no meaningful domain.
    */
   if(baseDomain&&baseDomain!=='UNKNOWN')return base;
   if(liveDomain==='MAPS'&&liveResults.length){
    return {...base,...live,domain:'MAPS',active:true,results:liveResults};
   }
  }catch{}
  return base;
 };
 engine.__JARVIS_MAP_CONTEXT_PROVIDER_V1__=true;
 return true;
};

if(!install()){
 const timer=window.setInterval(()=>{if(install())window.clearInterval(timer)},100);
 window.setTimeout(()=>window.clearInterval(timer),15000);
}
})();
