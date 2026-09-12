(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_COMMAND_BRIDGE_V1__)return;
window.__JARVIS_SPATIAL_COMMAND_BRIDGE_V1__=true;
const spatial=/\b(?:build|create|design|model|make|construct|generate|assemble|move|rotate|scale|resize|delete|remove|clear|inspect|measure|dimension|material)\b/i;
const object=/\b(?:3d|three[- ]?d|engineering bay|cabinet|table|chair|box|cube|cylinder|sphere|cone|assembly|object|scene|spatial)\b/i;
const isSpatial=q=>spatial.test(q)&&object.test(q);
const waitForBay=async()=>{for(let i=0;i<60;i++){if(document.getElementById('jarvisEngineeringBay'))return true;await new Promise(r=>setTimeout(r,50))}return false};
const openAndRun=async q=>{try{window.jarvisOpenEngineeringBay?.()}catch{}if(!document.getElementById('jarvisEngineeringBay'))document.querySelector('[data-app="engineeringBay"]')?.click();if(await waitForBay()){await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));try{if(typeof window.jarvisSpatial?.run!=='function'){const r=document.querySelector('#jarvisReply');if(r){r.textContent='Engineering Bay opened, but the spatial engine is still loading.';r.classList.add('visible')}return}const result=await window.jarvisSpatial.run(q);if(result===false){const r=document.querySelector('#jarvisReply');if(r){r.textContent='JARVIS could not execute that Engineering command.';r.classList.add('visible')}}}catch(e){const r=document.querySelector('#jarvisReply');if(r){r.textContent=`Engineering execution failed: ${String(e?.message||'unknown error')}`;r.classList.add('visible')}console.warn('JARVIS spatial bridge failed',e)}}else{const r=document.querySelector('#jarvisReply');if(r){r.textContent='Engineering Bay could not be opened.';r.classList.add('visible')}}};
const handle=(q,e)=>{q=String(q||'').trim();if(!isSpatial(q))return false;e.preventDefault();e.stopImmediatePropagation();void openAndRun(q);return true};
document.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.shiftKey)return;const i=e.target?.closest?.('#commandInput');if(!(i instanceof HTMLInputElement))return;handle(i.value,e)},true);
document.addEventListener('click',e=>{const b=e.target?.closest?.('#commandForm button[type="submit"]');if(!(b instanceof HTMLButtonElement))return;const f=b.form||b.closest?.('#commandForm');const i=f?.querySelector?.('#commandInput');if(i instanceof HTMLInputElement)handle(i.value,e)},true);
document.addEventListener('submit',e=>{const f=e.target?.closest?.('#commandForm');if(!f)return;handle(f.querySelector('#commandInput')?.value,e)},true);
window.addEventListener('jarvis:voice-command',e=>{if(handle(e.detail?.text,e)){try{window.jarvisStopVoiceRecognitionOnly?.()}catch{}}},true);
})();
