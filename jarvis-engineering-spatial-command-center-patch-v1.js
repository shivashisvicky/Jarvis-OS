(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_COMMAND_CENTER_PATCH_V1__)return;
window.__JARVIS_SPATIAL_COMMAND_CENTER_PATCH_V1__=true;
function submit(input){const button=document.querySelector('#jbaiRun');if(!input||!button||!button.matches('button'))return false;button.click();return true}
function isEnterEvent(e){const key=e.key||'';const code=e.keyCode||e.which||0;return(key==='Enter'||key==='Return'||code===13)&&!e.shiftKey}
function handle(e){if(!isEnterEvent(e))return;const input=e.target?.closest?.('#jbaiCommand');if(!input)return;e.preventDefault();e.stopImmediatePropagation();submit(input)}
document.addEventListener('keydown',handle,true);
document.addEventListener('keypress',handle,true);
document.addEventListener('keyup',handle,true);
document.addEventListener('beforeinput',e=>{if(e.inputType!=='insertLineBreak'&&e.inputType!=='insertParagraph')return;const input=e.target?.closest?.('#jbaiCommand');if(!input)return;e.preventDefault();e.stopImmediatePropagation();submit(input)},true);
const bind=()=>{const input=document.querySelector('#jbaiCommand');if(!input||input.__JARVIS_ENTER_PATCH__)return;if(input.__JARVIS_ENTER_PATCH__=true){const go=e=>{if(!isEnterEvent(e))return;e.preventDefault();e.stopImmediatePropagation();submit(input)};input.addEventListener('keydown',go,true);input.addEventListener('keypress',go,true);input.addEventListener('keyup',go,true);input.addEventListener('beforeinput',e=>{if(e.inputType!=='insertLineBreak'&&e.inputType!=='insertParagraph')return;e.preventDefault();e.stopImmediatePropagation();submit(input)},true)}};
new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
bind();
})();
