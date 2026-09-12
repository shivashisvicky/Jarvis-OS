(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_COMMAND_BRIDGE_V1__)return;
window.__JARVIS_SPATIAL_COMMAND_BRIDGE_V1__=true;
const spatial=/\b(?:build|create|design|model|make|construct|generate|assemble|move|rotate|scale|resize|delete|remove|clear|inspect|measure|dimension|material)\b/i;
const object=/\b(?:3d|three[- ]?d|engineering bay|cabinet|table|chair|box|cube|cylinder|sphere|cone|assembly|object|scene|spatial)\b/i;
const isSpatial=q=>spatial.test(q)&&object.test(q);
const waitFor=async(test,tries=80)=>{for(let i=0;i<tries;i++){if(test())return true;await new Promise(r=>setTimeout(r,50))}return false};
const reply=text=>{const r=document.querySelector('#jarvisReply');if(r){r.textContent=text;r.classList.add('visible')}try{window.jarvisSpeak?.(text)}catch{}};
const openAndRun=async q=>{try{window.jarvisOpenEngineeringBay?.()}catch{}if(!document.getElementById('jarvisEngineeringBay'))document.querySelector('[data-app="engineeringBay"]')?.click();if(!(await waitFor(()=>!!document.getElementById('jarvisEngineeringBay')))){reply('Engineering Bay could not be opened.');return}const bay=document.getElementById('jarvisEngineeringBay');const spatialTab=bay.querySelector('[data-jbay2="spatial"]');if(spatialTab instanceof HTMLButtonElement)spatialTab.click();if(!(await waitFor(()=>!!bay.querySelector('[data-pane="spatial"]')))){reply('Engineering Bay opened, but the spatial workspace is unavailable.');return}if(!(await waitFor(()=>!!bay.querySelector('#jbaiCommand')))){reply('Spatial workspace opened, but JARVIS is still loading its command engine.');return}try{if(typeof window.jarvisSpatial?.run!=='function'){reply('Spatial workspace opened, but the spatial engine is still loading.');return}bay.querySelector('#jbaiCommand').value=q;const result=await window.jarvisSpatial.run(q);if(result===false)reply('JARVIS could not execute that Engineering command.')}catch(e){reply(`Engineering execution failed: ${String(e?.message||'unknown error')}`);console.warn('JARVIS spatial bridge failed',e)}};
const handle=(q,e)=>{q=String(q||'').trim();if(!isSpatial(q))return false;e.preventDefault();e.stopImmediatePropagation();void openAndRun(q);return true};
document.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.shiftKey)return;const i=e.target?.closest?.('#commandInput');if(!(i instanceof HTMLInputElement))return;handle(i.value,e)},true);
document.addEventListener('click',e=>{const b=e.target?.closest?.('#commandForm button[type="submit"]');if(!(b instanceof HTMLButtonElement))return;const f=b.form||b.closest?.('#commandForm');const i=f?.querySelector?.('#commandInput');if(i instanceof HTMLInputElement)handle(i.value,e)},true);
document.addEventListener('submit',e=>{const f=e.target?.closest?.('#commandForm');if(!f)return;handle(f.querySelector('#commandInput')?.value,e)},true);
window.addEventListener('jarvis:voice-command',e=>{if(handle(e.detail?.text,e)){try{window.jarvisStopVoiceRecognitionOnly?.()}catch{}}},true);
})();