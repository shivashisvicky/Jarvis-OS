(()=>{
'use strict';
if(window.__JARVIS_UI_STABILITY_V1__)return;
window.__JARVIS_UI_STABILITY_V1__=true;

const tidyMaps=()=>{
  const results=document.querySelector('#mapResults');
  const frame=document.querySelector('#mapFrame');
  if(results&&frame&&frame.querySelector('.empty')?.textContent?.trim()==='Search for a place to begin.'){
    frame.innerHTML='';
    frame.style.display='none';
  }
};

const stabilize=()=>{
  tidyMaps();
  const ws=document.querySelector('#workspace');
  if(!ws)return;

  /* The workspace is the only mobile scroller. Do not let injected Home
     overlays create a second horizontal scroll chain or rubber-band. */
  ws.style.contain='none';
  ws.style.overflowX='hidden';
  ws.style.overscrollBehaviorX='none';
  if(window.matchMedia?.('(max-width:760px)').matches){
    ws.style.touchAction='pan-y';
    ws.style.webkitOverflowScrolling='touch';
  }

  const os=document.querySelector('.os');
  if(os)os.style.overflow='hidden';

  if(window.matchMedia?.('(max-width:760px)').matches){
    const styleId='jarvis-home-mobile-stability-v2';
    if(!document.getElementById(styleId)){
      const style=document.createElement('style');
      style.id=styleId;
      style.textContent=`
        @media (max-width:760px){
          html,body,#app{width:100%;max-width:100%;overflow-x:hidden}
          body{overscroll-behavior-x:none}
          .workspace{position:relative;isolation:isolate;overflow-x:hidden!important;overscroll-behavior-x:none!important;touch-action:pan-y!important}
          .workspace>*{max-width:100%;min-width:0}
          .command-surface,.jhc-actions,.jhc-brief,#newsDesk,.module-grid,.panel{position:relative;z-index:1}
          .jhc-brief{overflow:hidden}
          .jhc-actions{pointer-events:auto}
          .rail{z-index:120!important}
          .jarvis-mobile-drawer{z-index:130!important}
          #jarvisSpeechStop{z-index:115!important;bottom:calc(82px + env(safe-area-inset-bottom))!important;right:12px!important}
        }
      `;
      document.head.appendChild(style);
    }
  }

  /* If an old client left the slow 0.92x preference behind, migrate it once.
     Keep any intentional user setting at 0.93x or above untouched. */
  try{
    const rate=Number(localStorage.getItem('jarvisSpeechRate'));
    if(!Number.isFinite(rate)||rate===0.92){
      localStorage.setItem('jarvisSpeechRate','1.15');
      localStorage.setItem('jarvisSpeechRateVersion','2');
    }
    if(!localStorage.getItem('jarvisSpeechAccent'))localStorage.setItem('jarvisSpeechAccent','en-GB');
  }catch{}
};

stabilize();
new MutationObserver(stabilize).observe(document.documentElement,{childList:true,subtree:true});
})();
