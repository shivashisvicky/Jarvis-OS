(()=>{
'use strict';
if(window.__JARVIS_MAP_ENTER_FIX_V1__)return;window.__JARVIS_MAP_ENTER_FIX_V1__=true;
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const input=e.target;if(!(input instanceof HTMLInputElement)||input.id!=='mapQuery')return;const button=document.querySelector('#mapSearch');if(!(button instanceof HTMLButtonElement))return;e.preventDefault();e.stopImmediatePropagation();button.click()},true);
})();
