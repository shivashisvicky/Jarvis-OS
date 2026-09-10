(()=>{
'use strict';
if(window.__JARVIS_COMMAND_CHAIN_V1__)return;
window.__JARVIS_COMMAND_CHAIN_V1__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const normalize=s=>clean(s).replace(/^(?:and|then)\s+/i,'').trim();
const route=q=>{try{return window.jarvisCommandAuthority?.route?.(q)||null}catch{return null}};
const bareMapPoi=q=>/^(?:restaurants?|resturants?|restaraunts?|restaurents?|restuarants?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\s+stations?)?|fuel|gyms?|supermarkets?|temples?)\s+(?:in|near|around|at)\s+.+$/i.test(clean(q));
const ordinalTail='(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|thirtieth|fortieth|fiftieth|sixtieth|seventieth|eightieth|ninetieth|\\d+(?:st|nd|rd|th)?|one|two|three|four|five|six|seven|eight|nine|ten)';
const splitChain=text=>{
 const s=clean(text);
 if(!s)return [];
 const parts=s.split(new RegExp('(?:,\\s*(?:then\\s+)?|\\s+(?:and|then)\\s+)(?=(?:open|read|show|select|choose|play|watch|take|navigate|go|find|search|look\\s+up|lookup|google|tell|give|what|what\\'s|what\\s+is)\\b|(?:the\\s+)?'+ordinalTail+'\\b|(?:it|that|this)\\b)','i')).map(normalize).filter(Boolean);
 if(parts.length>=2)return parts;
 const ordinal=new RegExp('^(?:the\\s+)?'+ordinalTail+'(?:\\s+(?:one|result))?$','i');
 const actionOrdinal=new RegExp('^(?:open|read|show|select|choose|play|watch)\\s+(?:the\\s+)?'+ordinalTail+'(?:\\s+(?:one|result))?$','i');
 const m=s.match(new RegExp('^(.+?)\\s+((?:open|read|show|select|choose|play|watch)\\s+(?:the\\s+)?'+ordinalTail+'(?:\\s+(?:one|result))?)$','i'));
 if(m&&clean(m[1])&&actionOrdinal.test(clean(m[2])))return[clean(m[1]),clean(m[2])];
 const n=s.match(new RegExp('^(.+?)\\s+((?:the\\s+)?'+ordinalTail+'(?:\\s+(?:one|result))?)$','i'));
 if(n&&clean(n[1])&&ordinal.test(clean(n[2]))){const r=route(clean(n[1]));if(!r||r.type==='CONVERSATION_OR_INTELLIGENCE')return[clean(n[1]),clean(n[2])]}
 return [];
};
const safeType=t=>['MAP_POI','MAP_NAV','YOUTUBE','MEDIA','BOOKS','SEARCH','CONTEXT_FOLLOWUP'].includes(String(t||'').toUpperCase());
const inferType=q=>{
 const s=clean(q);
 if(bareMapPoi(s))return 'MAP_POI';
 if(/\b(?:open|read|show|select|choose|play|watch)\b.*\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|one|two|three|four|five|six|seven|eight|nine|ten|it|that|this|\d+(?:st|nd|rd|th)?)\b/i.test(s))return 'CONTEXT_FOLLOWUP';
 if(/^(?:(?:the\s+)?(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|one|two|three|four|five|six|seven|eight|nine|ten|\d+(?:st|nd|rd|th)?)|it|that|this)\b/i.test(s))return 'CONTEXT_FOLLOWUP';
 if(/\b(?:take me|navigate|go)\b.*\b(?:there|here|to it|to that|to this)\b/i.test(s))return 'MAP_NAV';
 return null;
};
const resolveRoute=q=>{const r=route(q);if(r&&safeType(r.type))return r;const inferred=inferType(q);return inferred?{type:inferred,inferred:true}:null};
const parse=text=>{const parts=splitChain(text);if(parts.length<2||parts.length>4)return null;const first=resolveRoute(parts[0]);return {parts,routes:[first,...parts.slice(1).map(p=>({type:inferType(p)||null,inferred:!!inferType(p)}))]}};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const relatedQuery=(clause,query)=>{const a=clean(clause).toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(x=>x&&!['and','then','the','in','near','around','at','on','for','search','find','look','up','play','watch','open','show','youtube','yt'].includes(x));const b=clean(query).toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean);return !a.length||!b.length||a.some(x=>b.includes(x))};
const waitForFreshContext=(expected,beforeTurn,timeout=10000,queryHint='')=>new Promise(resolve=>{const started=Date.now();const ok=()=>{const c=window.jarvisContextEngine?.get?.();if(!c?.active)return false;const d=String(c.domain||'').toUpperCase();const e=String(expected||'').toUpperCase();if(e==='MAP_POI'||e==='MAP_NAV')return d==='MAPS'&&(e==='MAP_NAV'||Array.isArray(c.results)&&c.results.length>0)&&relatedQuery(queryHint,c.query);if(Number(c.turn||0)<=Number(beforeTurn||0))return false;if(e==='ANY')return Array.isArray(c.results)&&c.results.length>0&&relatedQuery(queryHint,c.query);if(e==='YOUTUBE'||e==='MEDIA')return ['MEDIA','VIDEOS','VIDEO','YOUTUBE'].includes(d)&&(Array.isArray(c.results)?c.results.length>0:true);if(e==='BOOKS')return d==='BOOKS'&&(Array.isArray(c.results)?c.results.length>0:true);return true};const poll=()=>{if(ok()||Date.now()-started>=timeout){resolve();return}window.setTimeout(poll,100)};poll()});
const chainDeferredMediaQuery=clause=>{const s=clean(clause);if(!/^(?:please\s+)?(?:play|watch)\b/i.test(s)||!/\b(?:youtube|yt)\b/i.test(s))return s;const q=s.replace(/^(?:please\s+)?(?:play|watch)\s+/i,'').replace(/\b(?:on|in)\s+(?:youtube|yt)\b/gi,'').trim();return `search ${q} on YouTube`;};
const dispatchClause=(clause,options={})=>{const input=document.querySelector('#commandInput');const form=document.querySelector('#commandForm');if(!(input instanceof HTMLInputElement)||!(form instanceof HTMLFormElement))return false;input.value=options.deferMediaPlay?chainDeferredMediaQuery(clause):clause;window.__JARVIS_COMMAND_CHAIN_INTERNAL_SUBMIT__=true;try{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))}finally{window.__JARVIS_COMMAND_CHAIN_INTERNAL_SUBMIT__=false}return true};
const dispatchFollowup=clause=>{try{if(window.jarvisContextReferenceAuthority?.run?.(clause))return true}catch{}return dispatchClause(clause)};
const dispatchFirst=async(clause,resolved)=>{const canEntity=typeof window.jarvisEntityAuthority?.handle==='function'&&typeof window.jarvisEntityAuthority?.candidate==='function'&&window.jarvisEntityAuthority.candidate(clause);if(canEntity&&(!resolved||resolved.type==='BOOKS'))return !!(await window.jarvisEntityAuthority.handle(clause));return dispatchClause(clause,{deferMediaPlay:false})};
const runChain=async(parsed)=>{if(window.__JARVIS_COMMAND_CHAIN_RUNNING__)return;window.__JARVIS_COMMAND_CHAIN_RUNNING__=true;try{try{console.info('[JARVIS:CHAIN_TRACE] START',parsed);window.dispatchEvent(new CustomEvent('jarvis:command-chain-trace',{detail:{event:'START',parsed,at:Date.now()}}))}catch{} for(let i=0;i<parsed.parts.length;i++){const clause=parsed.parts[i],resolved=resolveRoute(clause);const beforeTurn=Number(window.jarvisContextEngine?.get?.()?.turn||0);const deferred=i<parsed.parts.length-1&&resolved?.type==='YOUTUBE'&&/\b(?:play|watch)\b/i.test(clause);const dispatched=i===0?await dispatchFirst(clause,resolved):(resolved?.type==='CONTEXT_FOLLOWUP'?dispatchFollowup(clause):dispatchClause(clause,{deferMediaPlay:deferred}));try{console.info('[JARVIS:CHAIN_TRACE] CLAUSE',{index:i,clause,resolved,dispatched});window.dispatchEvent(new CustomEvent('jarvis:command-chain-trace',{detail:{event:'CLAUSE',index:i,clause,resolved,dispatched,at:Date.now()}}))}catch{} if(!dispatched)return;if(resolved?.type!=='CONTEXT_FOLLOWUP'){const expected=resolved?.type||'ANY';await waitForFreshContext(expected,beforeTurn,i===0?12000:7000,clause)}await wait(i===parsed.parts.length-1?150:350)}}finally{window.__JARVIS_COMMAND_CHAIN_RUNNING__=false}};
const interceptSubmit=e=>{const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;if(window.__JARVIS_COMMAND_CHAIN_RUNNING__&&!window.__JARVIS_COMMAND_CHAIN_INTERNAL_SUBMIT__){e.preventDefault();e.stopImmediatePropagation();return}if(window.__JARVIS_COMMAND_CHAIN_RUNNING__)return;const input=form.querySelector('#commandInput');if(!(input instanceof HTMLInputElement))return;const parsed=parse(input.value);if(!parsed)return;e.preventDefault();e.stopImmediatePropagation();window.dispatchEvent(new CustomEvent('jarvis:command-chain',{detail:{parts:parsed.parts,routes:parsed.routes,version:'2.3.0'}}));void runChain(parsed)};
const interceptVoice=e=>{if(window.__JARVIS_COMMAND_CHAIN_RUNNING__){e.preventDefault();e.stopImmediatePropagation();return}const text=clean(e.detail?.text);if(!text)return;const parsed=parse(text);if(!parsed)return;e.preventDefault();e.stopImmediatePropagation();const input=document.querySelector('#commandInput');if(input instanceof HTMLInputElement)input.value=text;window.dispatchEvent(new CustomEvent('jarvis:command-chain',{detail:{parts:parsed.parts,routes:parsed.routes,version:'2.3.0',source:'voice'}}));void runChain(parsed)};
document.addEventListener('submit',interceptSubmit,true);window.addEventListener('jarvis:voice-command',interceptVoice,true);window.jarvisCommandChain={version:'2.3.0',parse};
})();
// TEST deployment trigger: preserve trace build and force a fresh Pages publish.
