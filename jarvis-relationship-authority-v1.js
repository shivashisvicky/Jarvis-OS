(()=>{
'use strict';
if(window.__JARVIS_RELATIONSHIP_AUTHORITY_V1__)return;
window.__JARVIS_RELATIONSHIP_AUTHORITY_V1__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const isBooks=c=>{const d=String(c?.domain||'').toUpperCase();return c?.active&&['BOOKS','BOOK','BOOK_AUTHOR'].includes(d)&&Array.isArray(c.results)&&c.results.length};
const authorOf=r=>clean(r?.author||r?.authors||r?.creator||'');
const titleOf=r=>clean(r?.title||r?.name||'');
const speak=text=>{const el=document.querySelector('#jarvisReply');if(el){el.textContent=text;el.classList.add('visible')}try{window.jarvisVoiceAuthoritySpeak?.(text)||window.jarvisCinematicSpeak?.(text)||window.jarvisSpeak?.(text)}catch{}};
const currentBook=ctx=>{const s=ctx?.selected;if(s&&typeof s==='object'&&authorOf(s))return s;const title=clean(ctx?.entity?.title||'').toLowerCase();if(title){const hit=ctx.results.find(r=>titleOf(r).toLowerCase()===title);if(hit)return hit}return null};
const whoWrote=/^(?:please\s+)?(?:who|which\s+person)\s+(?:wrote|authored|is\s+the\s+author\s+of)\s+(?:it|that|this)(?:\s+book)?[?!.]*$/i;
const otherBooks=/^(?:please\s+)?(?:show|find|give)\s+me\s+(?:his|her|their)\s+(?:other|more)\s+books[?!.]*$/i;
const run=raw=>{const q=clean(raw);if(!whoWrote.test(q)&&!otherBooks.test(q))return false;const ctx=window.jarvisContextEngine?.get?.();if(!isBooks(ctx))return false;let book=currentBook(ctx);let author=authorOf(book);if(!author&&window.__JARVIS_RELATIONSHIP_AUTHOR__)author=clean(window.__JARVIS_RELATIONSHIP_AUTHOR__);if(!author){speak('I have the book context, but I cannot determine its author from the current result.');return true}if(whoWrote.test(q)){window.__JARVIS_RELATIONSHIP_AUTHOR__=author;const title=titleOf(book);speak(title?`${title} was written by ${author}.`:`The author is ${author}.`);return true}window.__JARVIS_RELATIONSHIP_AUTHOR__=author;const search=window.jarvisEbookSearchAuthority?.search;if(typeof search!=='function'){speak(`I know the author is ${author}, but the book search is not ready.`);return true}const promise=search(author);Promise.resolve(promise).catch(()=>{});return true};
const intercept=e=>{const raw=clean(e.detail?.text);if(!run(raw))return;e.preventDefault?.();e.stopImmediatePropagation?.()};
window.addEventListener('jarvis:voice-command',intercept,true);
document.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;const input=f.querySelector('#commandInput');const raw=input instanceof HTMLInputElement?input.value:'';if(!run(raw))return;e.preventDefault();e.stopImmediatePropagation();if(input instanceof HTMLInputElement)input.value=''},true);
window.jarvisRelationshipAuthority={version:'1.0.0',run};
})();
