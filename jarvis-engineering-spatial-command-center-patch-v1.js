(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_COMMAND_CENTER_PATCH_V1__)return;
window.__JARVIS_SPATIAL_COMMAND_CENTER_PATCH_V1__=true;
const submit=input=>{const button=document.querySelector('#jbaiRun');if(!input||!button?.matches?.('button'))return false;button.click();return true};
const isEnterEvent=e=>{const key=String(e?.key||'');const code=e?.keyCode||e?.which||0;const inputType=String(e?.inputType||'');return(!e?.shiftKey&&(key==='Enter'||key==='Return'||key==='Go'||key==='Search'||key==='Done'||e?.code==='Enter'||code===13||inputType==='insertLineBreak'||inputType==='insertParagraph'))};
const getInput=e=>e?.target?.closest?.('#jbaiCommand')||document.querySelector('#jbaiCommand');
const handle=e=>{if(!isEnterEvent(e))return;const input=getInput(e);if(!input)return;e.preventDefault();e.stopImmediatePropagation();submit(input)};
window.addEventListener('keydown',handle,true);
window.addEventListener('keypress',handle,true);
window.addEventListener('keyup',handle,true);
window.addEventListener('beforeinput',handle,true);
window.addEventListener('input',e=>{const input=getInput(e);if(!input)return;const value=String(input.value||'');if(/[\r\n]$/.test(value)){input.value=value.replace(/[\r\n]+$/,'');submit(input)}},true);
const bind=()=>{const input=document.querySelector('#jbaiCommand');if(!input||input.__JARVIS_ENTER_PATCH__)return;input.__JARVIS_ENTER_PATCH__=true;['keydown','keypress','keyup','beforeinput'].forEach(type=>input.addEventListener(type,handle,true))};
new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
bind();
})();
