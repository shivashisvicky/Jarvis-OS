(()=>{
'use strict';
if(window.__JARVIS_COMMAND_GRAMMAR_AUTHORITY_V1__)return;
window.__JARVIS_COMMAND_GRAMMAR_AUTHORITY_V1__=true;

// Lightweight grammar gate. It normalizes speech/text before the existing
// module routers run. It never calls a network service or an LLM.
// Preserve '?' because the intelligence router uses it to recognize natural questions.
const clean=s=>String(s||'').replace(/\s+/g,' ').trim().replace(/[.!]+$/,'').trim();
const normalize=s=>{
 let q=clean(s);
 if(!q)return q;

 // Common speech-recognition variants. Keep corrections deliberately narrow.
 q=q.replace(/\b(resturants?|restaraunts?|restaurents?|restuarants?|resturents?)\b/gi,'restaurants');
 q=q.replace(/\bpharmec(?:y|ies)\b/gi,'pharmacy');
 q=q.replace(/\bhosptials?\b/gi,'hospital');
 q=q.replace(/\byoutub(?:e|)\b/gi,'YouTube');

 // Maps / POI grammar: natural spoken "restaurants to X" means
 // "restaurants in X". Navigation uses "to" for the destination.
 if(/\b(?:restaurant|restaurants|cafe|cafes|hospital|hospitals|pharmacy|pharmacies|hotel|hotels|school|schools|bank|banks|atm|atms|petrol|fuel|gym|gyms|supermarket|supermarkets|temple|temples)\b/i.test(q)){
   q=q.replace(/\b(?:restaurants?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\s+stations?)?|fuel|gyms?|supermarkets?|temples?)\b([\s\S]*?)\s+to\s+/i,(m)=>m.replace(/\s+to\s+/i,' in '));
 }
 q=q.replace(/\b(take me|navigate me|navigate)\s+in\s+/i,'$1 to ');
 q=q.replace(/\b(take me|navigate me|navigate)\s+at\s+/i,'$1 to ');

 // Web/search grammar: remove destination prepositions that otherwise leak
 // into the search query, while preserving the user's actual search terms.
 q=q.replace(/\s+(?:on|in)\s+(?:the\s+)?web\s*$/i,'');
 q=q.replace(/\s+(?:on|in)\s+the\s+internet\s*$/i,'');
 q=q.replace(/\s+(?:on|in)\s+(?:google|bing)\s*$/i,'');

 // Media grammar outside YouTube. Keep the requested subject intact.
 q=q.replace(/\s+(?:in|on)\s+the\s+media\s*$/i,'');

 // A narrow calculator grammar for obvious arithmetic questions. General
 // "what is ..." questions are left untouched.
 const arithmeticQ=q.replace(/\?$/,'');
 if(/^\s*what(?:'s| is)\s+[-+*/%\d().\s]+(?:plus|minus|times|multiplied by|divided by)[-+*/%\d().\s]+$/i.test(arithmeticQ)){
   q=arithmeticQ.replace(/^\s*what(?:'s| is)\s+/i,'calculate ');
 }
 return clean(q);
};

window.jarvisNormalizeCommand=normalize;

const normalizeInput=()=>{
 const input=document.querySelector('#commandInput');
 if(!(input instanceof HTMLInputElement))return;
 const next=normalize(input.value);
 if(next&&next!==input.value)input.value=next;
};

document.addEventListener('submit',event=>{
 const form=event.target;
 if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;
 normalizeInput();
},true);

window.addEventListener('jarvis:voice-command',event=>{
 const detail=event.detail;
 if(!detail||typeof detail.text!=='string')return;
 const next=normalize(detail.text);
 if(next)detail.text=next;
},true);
})();
