(()=>{
'use strict';
if(window.__JARVIS_MAP_MOBILE_LAYOUT_V1__)return;
window.__JARVIS_MAP_MOBILE_LAYOUT_V1__=true;
const STYLE='jarvisMapMobileLayoutV1';
function apply(){
  const grid=document.querySelector('.maps-grid');
  const panel=grid?.querySelector(':scope > .panel:first-child');
  const frame=document.querySelector('#mapFrame');
  const search=panel?.querySelector('.search-row');
  const results=document.querySelector('#mapResults');
  if(!grid||!panel||!frame||!search||!results)return;
  if(!document.getElementById(STYLE)){
    const s=document.createElement('style');s.id=STYLE;s.textContent=`
      @media (max-width:760px){
        .maps-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto auto!important;gap:10px!important;align-items:start!important}
        .maps-grid>.panel:first-child{display:contents!important}
        .maps-grid>.panel:first-child>.search-row{grid-column:1;grid-row:1;margin:0!important}
        #mapFrame{grid-column:1!important;grid-row:2!important;width:100%!important;height:230px!important;min-height:230px!important;max-height:230px!important;position:relative!important;top:auto!important;overflow:hidden!important}
        #mapFrame iframe{width:100%!important;height:230px!important;min-height:230px!important;display:block!important}
        #mapResults{grid-column:1!important;grid-row:3!important;min-width:0!important;margin:0!important}
      }
    `;document.head.appendChild(s);
  }
}
new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('resize',apply,{passive:true});
apply();
})();
