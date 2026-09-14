(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_COMMAND_CENTER_PATCH_V1__)return;
window.__JARVIS_SPATIAL_COMMAND_CENTER_PATCH_V1__=true;

// Match the proven JARVIS command/map pattern: one delegated keydown,
// then use the exact same button path as ASK JARVIS.
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.shiftKey)return;
  const input=e.target;
  if(!(input instanceof HTMLInputElement)||input.id!=='jbaiCommand')return;
  const button=document.querySelector('#jbaiRun');
  if(!(button instanceof HTMLButtonElement))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  button.click();
},true);
})();
