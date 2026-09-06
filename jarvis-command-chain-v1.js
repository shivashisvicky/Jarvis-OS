(()=>{
'use strict';
if(window.__JARVIS_COMMAND_CHAIN_V1__)return;
window.__JARVIS_COMMAND_CHAIN_V1__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const normalize=s=>clean(s).replace(/^(?:and|then)\s+/i,'').trim();
const route=q=>{try{return window.jarvisCommandAuthority?.route?.(q)||null}catch{return null}};
const splitChain=text=>{
 const s=clean(text);
 if(!s)return [];
 const parts=s.split(/,\s*(?=(?:(?:and|then)\s+)?(?:open|read|show|select|choose|play|watch|take|navigate|go|find|search|look\s+up|lookup|google|tell|give|what|what's|what\s+is)\b)/i).map(normalize).filter(Boolean);
 if(parts.length<2)return [];
 return parts;
};
const safeType=t=>['MAP_POI','MAP_NAV','YOUTUBE','MEDIA','BOOKS','SEARCH','CONTEXT_FOLLOWUP'].includes(String(t||'').toUpperCase());
const parse=text=>{const parts=splitChain(text);if(parts.length<2||parts.length>4)return null;const routes=parts.map(route);if(routes.some(r=>!r||!safeType(r.type)))return null;return {parts,routes}};
const wait=ms=>new Promise(r=>window.setTimeout(r,ms));
const waitForContext=(expected,timeout=10000)=>new Promise(resolve=>{
 const started=Date.now();
 const ok=()=>{const c=window.jarvisContextEngine?.get?.();if(!c?.active)return false;const d=String(c.domain||'').toUpperCase();const e=String(expected||'').toUpperCase();if(e==='MAP_POI'||e==='MAP_NAV')return d==='MAPS'&&(e==='MAP_NAV'||Array.isArray(c.results)&&c.results.length>0);if(e==='YOUTUBE'||e==='MEDIA')return ['MEDIA','VIDEOS','VIDEO','YOUTUBE'].includes(d)&&(Array.isArray(c.results)?c.results.length>0:true);if(e==='BOOKS')return d==='BOOKS'&&(Array.isArray(c.results)?c.results.length>0:true);return true};
 const poll=()=>{if(ok()||Date.now()-started>=timeout){resolve();return}window.setTimeout(poll,100)};poll();
});
const dispatchClause=clause=>{const input=document.querySelector('#commandInput');const form=document.querySelector('#commandForm');if(!(input instanceof HTMLInputElement)||!(form instanceof HTMLFormElement))return false;input.value=clause;form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return true};
const runChain=async(parsed)=>{
 if(window.__JARVIS_COMMAND_CHAIN_RUNNING__)return;
 window.__JARVIS_COMMAND_CHAIN_RUNNING__=true;
 try{
  for(let i=0;i<parsed.parts.length;i++){
   const clause=parsed.parts[i];
   if(!dispatchClause(clause))return;
   await waitForContext(parsed.routes[i]?.type, i===0?10000:5000);
   await wait(i===parsed.parts.length-1?150:450);
  }
 }finally{window.__JARVIS_COMMAND_CHAIN_RUNNING__=false}
};
const interceptSubmit=e=>{
 if(window.__JARVIS_COMMAND_CHAIN_RUNNING__)return;
 const form=e.target;
 if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;
 const input=form.querySelector('#commandInput');
 if(!(input instanceof HTMLInputElement))return;
 const parsed=parse(input.value);
 if(!parsed)return;
 e.preventDefault();e.stopImmediatePropagation();
 window.dispatchEvent(new CustomEvent('jarvis:command-chain',{detail:{parts:parsed.parts,routes:parsed.routes,version:'1.0.0'}}));
 void runChain(parsed);
};
const interceptVoice=e=>{
 if(window.__JARVIS_COMMAND_CHAIN_RUNNING__)return;
 const text=clean(e.detail?.text);if(!text)return;
 const parsed=parse(text);if(!parsed)return;
 e.preventDefault();e.stopImmediatePropagation();
 const input=document.querySelector('#commandInput');
 if(input instanceof HTMLInputElement)input.value=text;
 window.dispatchEvent(new CustomEvent('jarvis:command-chain',{detail:{parts:parsed.parts,routes:parsed.routes,version:'1.0.0',source:'voice'}}));
 void runChain(parsed);
};
document.addEventListener('submit',interceptSubmit,true);
window.addEventListener('jarvis:voice-command',interceptVoice,true);
window.jarvisCommandChain={version:'1.0.0',parse};
})();
