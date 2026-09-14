(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_COMMAND_CENTER_PATCH_V1__)return;
window.__JARVIS_SPATIAL_COMMAND_CENTER_PATCH_V1__=true;

// Make keyboard submission use the exact same button path as ASK JARVIS.
const submitFromEnter=e=>{
  const key=e.key||'';
  const code=e.keyCode||e.which||0;
  if((key!=='Enter'&&code!==13)||e.shiftKey)return;
  const input=e.target;
  if(!input?.matches?.('#jbaiCommand'))return;
  const button=document.querySelector('#jbaiRun');
  if(!button?.matches?.('button'))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  button.click();
};
document.addEventListener('keydown',submitFromEnter,true);
document.addEventListener('keypress',submitFromEnter,true);
})();
