(()=>{
'use strict';
if(window.__JARVIS_COMMAND_INPUT_CLEAR_V1__)return;
window.__JARVIS_COMMAND_INPUT_CLEAR_V1__=true;
const clear=()=>{
  const input=document.querySelector('#commandInput');
  if(!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement))return;
  if(!input.value)return;
  input.value='';
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
};
document.addEventListener('submit',event=>{
  const form=event.target;
  if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;
  window.setTimeout(clear,0);
},true);
window.addEventListener('jarvis:voice-command',()=>window.setTimeout(clear,0),true);
})();
