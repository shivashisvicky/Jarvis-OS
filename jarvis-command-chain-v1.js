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
 const parts=s.split(/(?:,\s*|\s+(?:and|then)\s+)(?=(?:and|then)\s+)?(?:open|read|show|select|choose|play|watch|take|navigate|go|find|search|look\s+up|lookup|google|tell|give|what|what's|what\s+is)\b|(?:,\s*|\s+(?:and|then)\s+)(?=(?:the\s+)?(?:first|second|third|fourth|one|two|three|four)\b|(?:it|that|this)\b)/i).map(normalize).filter(Boolean);
 if(parts.length<2)return [];
 return parts;
};
const safeType=t=>['MAP_POI','MAP_NAV','YOUTUBE','MEDIA','BOOKS','SEARCH','CONTEXT_FOLLOWUP'].includes(String(t||'').toUpperCase());
const inferType=q=>{
 const s=clean(q);
 if(/\b(?:open|read|show|select|choose|play|watch)\b.*\b(?:first|second|third|fourth|one|two|three|four|it|that|this|the)\b/i.test(s))return 'CONTEXT_FOLLOWUP';
 if(/^(?:(?:the\s+)?(?:first|second|third|fourth|one|two|three|four)|it|that|this)\b/i.test(s))return 'CONTEXT_FOLLOWUP';
 if(/\b(?:take me|navigate|go)\b.*\b(?:there|here|to it|to that|to this)\b/i.test(s))return 'MAP_NAV';
 return null;
};
const resolveRoute=q=>{const r=route(q);if(r&&safeType(r.type))return r;const inferred=inferType(q);return inferred?{type:inferred,inferred:true}:null};
const parse=text=>{const parts=splitChain(text);if(parts.length<2||parts.length>4)return null;const first=resolveRoute(parts[0]);if(!first)return null;return {parts,routes:[first,...parts.slice(1).map(p=>({type:inferType(p)||null,inferred:!!inferType(p)}))]}};
const wait=ms=>new Promise(r=>window.setTimeout(r,ms));
const waitForFreshContext=(expected,beforeTurn,timeout=10000)=>new Promise(resolve=>{const started=Date.now();const ok=()=>{const c=window.jarvisContextEngine?.get?.();if(!c?.active||Number(c.turn||0)<=Number(beforeTurn||0))return false;const d=String(c.domain||'').toUpperCase();const e=String(expected||'').toUpperCase();if(e==='MAP_POI'||e==='MAP_NAV')return d==='MAPS'&&(e==='MAP_NAV'||Array.isArray(c.results)&&c.results.length>0);if(e==='YOUTUBE'||e==='MEDIA')return ['MEDIA','VIDEOS','VIDEO','YOUTUBE'].includes(d)&&(Array.isArray(c.results)?c.results.length>0:true);if(e==='BOOKS')return d==='BOOKS'&&(Array.isArray(c.results)?c.results.length>0:true);return true};const poll=()=>{if(ok()||Date.now()-started>=timeout){resolve();return}window.setTimeout(poll,100)};poll()});
const dispatchClause=clause=>{const input=document.querySelector('#commandInput');const form=document.querySelector('#commandForm');if(!(input instanceof HTMLInputElement)||!(form instanceof HTMLFormElement))return false;input.value=clause;form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return true};
const dispatchFollowup=clause=>{try{if(window.jarvisContextReferenceAuthority?.run?.(clause))return true}catch{}return dispatchClause(clause)};
const runChain=async(parsed)=>{if(window.__JARVIS_COMMAND_CHAIN_RUNNING__)return;window.__JARVIS_COMMAND_CHAIN_RUNNING__=true;try{for(let i=0;i<parsed.parts.length;i++){const clause=parsed.parts[i],resolved=resolveRoute(clause);if(!resolved)return;const beforeTurn=Number(window.jarvisContextEngine?.get?.()?.turn||0);const dispatched=resolved.type==='CONTEXT_FOLLOWUP'?dispatchFollowup(clause):dispatchClause(clause);if(!dispatched)return;if(resolved.type!=='CONTEXT_FOLLOWUP')await waitForFreshContext(resolved.type,beforeTurn,i===0?10000:7000);await wait(i===parsed.parts.length-1?150:350)}}finally{window.__JARVIS_COMMAND_CHAIN_RUNNING__=false}};
const interceptSubmit=e=>{if(window.__JARVIS_COMMAND_CHAIN_RUNNING__)return;const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;const input=form.querySelector('#commandInput');if(!(input instanceof HTMLInputElement))return;const parsed=parse(input.value);if(!parsed)return;e.preventDefault();e.stopImmediatePropagation();window.dispatchEvent(new CustomEvent('jarvis:command-chain',{detail:{parts:parsed.parts,routes:parsed.routes,version:'1.4.0'}}));void runChain(parsed)};
const interceptVoice=e=>{if(window.__JARVIS_COMMAND_CHAIN_RUNNING__)return;const text=clean(e.detail?.text);if(!text)return;const parsed=parse(text);if(!parsed)return;e.preventDefault();e.stopImmediatePropagation();const input=document.querySelector('#commandInput');if(input instanceof HTMLInputElement)input.value=text;window.dispatchEvent(new CustomEvent('jarvis:command-chain',{detail:{parts:parsed.parts,routes:parsed.routes,version:'1.4.0',source:'voice'}}));void runChain(parsed)};
document.addEventListener('submit',interceptSubmit,true);window.addEventListener('jarvis:voice-command',interceptVoice,true);window.jarvisCommandChain={version:'1.4.0',parse};
})();