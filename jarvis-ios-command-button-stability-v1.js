(()=>{
'use strict';
if(window.__JARVIS_IOS_COMMAND_BUTTON_STABILITY_V1__)return;
window.__JARVIS_IOS_COMMAND_BUTTON_STABILITY_V1__=true;
const style=()=>{
 if(document.getElementById('jarvis-ios-command-button-stability'))return;
 const s=document.createElement('style');s.id='jarvis-ios-command-button-stability';
 s.textContent=`#voiceBtn{position:relative!important;z-index:2147482000!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;cursor:pointer!important}#voiceBtn *{pointer-events:none!important}`;
 document.head.appendChild(s);
};
const repair=()=>{
 style();
 const b=document.querySelector('#voiceBtn');
 if(!(b instanceof HTMLElement))return;
 b.style.setProperty('z-index','2147482000','important');
 b.style.setProperty('pointer-events','auto','important');
 b.style.setProperty('touch-action','manipulation','important');
 b.style.setProperty('-webkit-tap-highlight-color','transparent','important');
};
style();repair();
new MutationObserver(repair).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','disabled']});
window.setInterval(repair,1500);
})();
