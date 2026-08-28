(()=>{
'use strict';
if(window.__JARVIS_EBOOK_SEARCH_GUARD_V1__)return;
window.__JARVIS_EBOOK_SEARCH_GUARD_V1__=true;
let locked=false;
let query='';
let unlockTimer=0;
const clean=s=>String(s??'').trim().toLowerCase();
const hasResults=()=>!!document.querySelector('#jbe6Results .jbe6-book');
const unlock=()=>{locked=false;query='';if(unlockTimer)clearTimeout(unlockTimer);unlockTimer=0};
const arm=q=>{locked=true;query=clean(q);if(unlockTimer)clearTimeout(unlockTimer);unlockTimer=setTimeout(unlock,15000)};
const observer=new MutationObserver(()=>{if(locked&&hasResults())unlock()});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});
window.addEventListener('click',e=>{
 const btn=e.target?.closest?.('#jbe6Search');
 if(!btn)return;
 const input=document.querySelector('#jbe6Query');
 const q=clean(input?.value||'');
 if(locked){
   if(q===query){e.preventDefault();e.stopImmediatePropagation();return}
   unlock();
 }
 arm(q);
},true);
})();
