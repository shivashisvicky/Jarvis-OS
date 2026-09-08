(()=>{
'use strict';
if(window.__JARVIS_EBOOK_AUTHOR_ROUTING_GUARD_V1__)return;
window.__JARVIS_EBOOK_AUTHOR_ROUTING_GUARD_V1__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim().replace(/[?!.]+$/,'').trim();
const authorFollowup=q=>{
 const s=clean(q);
 return /^(?:(?:who|who's|who is)\s+(?:the\s+)?(?:author|writer)(?:\s+(?:of|for))?(?:\s+(?:this|it|this book|this one))?|who\s+(?:wrote|has written)\s+(?:this|it|this book|this one)|who\s+(?:wrote|has written)\s+(?:the\s+)?book)$/i.test(s)
   || /^(?:what\s+else\s+(?:did|has|have)\s+(?:he|she|they|the author)\s+(?:write|written)|what\s+(?:are|were)\s+(?:his|her|their|the author's)\s+(?:other\s+)?books|what\s+other\s+(?:books|works|novels)\s+(?:did|has|have)\s+(?:he|she|they|the author)\s+(?:write|written)|show\s+me\s+(?:his|her|their|the author's)\s+(?:other\s+)?(?:books|works|novels)|show\s+(?:his|her|their)\s+(?:other\s+)?(?:books|works|novels)|list\s+(?:his|her|their)\s+(?:other\s+)?(?:books|works|novels))$/i.test(s);
};
const handle=raw=>{
 const q=clean(raw);
 if(!authorFollowup(q))return false;
 const run=window.jarvisEbookAuthorIntelligence?.run;
 if(typeof run!=='function')return false;
 try{return !!run(q)}catch{return false}
};
window.addEventListener('jarvis:voice-command',e=>{
 if(!handle(e.detail?.text))return;
 e.preventDefault?.();e.stopImmediatePropagation?.();
},true);
document.addEventListener('submit',e=>{
 const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;
 const i=f.querySelector('#commandInput');const q=i instanceof HTMLInputElement?i.value:'';
 if(!handle(q))return;
 e.preventDefault();e.stopImmediatePropagation();
},true);
window.jarvisEbookAuthorRoutingGuard={version:'1.0.0',candidate:authorFollowup,run:handle};
})();
