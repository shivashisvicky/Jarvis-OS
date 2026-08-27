(()=>{'use strict';
if(window.__JARVIS_EBOOK_DISPLAY_AUTHORITY_V2__)return;window.__JARVIS_EBOOK_DISPLAY_AUTHORITY_V2__=true;
const norm=s=>String(s??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const clean=s=>String(s??'').replace(/[?!.]+$/,'').replace(/\b(?:search|find|look up|show me|show|open|read|reading|book|books|ebook|ebooks|gutenberg|standard ebooks|library|for|on)\b/gi,' ').replace(/\s+/g,' ').trim();
const valid=s=>{const q=clean(s);return q.length>=2&&q.length<=180};
const getContextQuery=()=>{try{const e=window.jarvisContextEngine?.get?.();if(e?.active&&['BOOKS','BOOK','BOOK_AUTHOR'].includes(e.domain)&&valid(e.query))return clean(e.query)}catch{}try{const m=window.jarvisContextMemory?.get?.();if(m?.domain&&['BOOKS','BOOK','BOOK_AUTHOR'].includes(m.domain)&&valid(m.query))return clean(m.query)}catch{}try{const x=JSON.parse(localStorage.getItem('JARVIS_LAST_BOOK_CONTEXT_V2')||'null');if(x&&Array.isArray(x.results)&&x.results.length&&valid(x.query)&&Date.now()-Number(x.savedAt||0)<30*60*1000)return clean(x.query)}catch{}return ''};
const isBook=q=>{const s=String(q??'');try{if(window.jarvisCommandAuthority?.route?.(s)?.type==='BOOKS')return true}catch{}return /\b(?:ebook|ebooks|book|books|novel|novels|gutenberg|standard ebooks)\b/i.test(s)};
let pending=null,lastContext='';
const queue=(raw,source='event')=>{if(!valid(raw))return;const q=clean(raw);if(!q)return;pending={query:q,at:Date.now(),source};lastContext=norm(q)};
window.addEventListener('jarvis:voice-command',e=>{const raw=e.detail?.text||'';if(isBook(raw))queue(raw)},true);
window.addEventListener('jarvis:ebook-context',e=>{const q=e.detail?.query||'';if(valid(q))queue(q,'context')},true);
const matches=(cards,q)=>{const wanted=norm(q);if(!wanted)return false;const tokens=wanted.split(' ').filter(Boolean);return cards.some(c=>{const text=norm(c.textContent||'');return text.includes(wanted)||tokens.every(t=>text.includes(t))})};
const runSearch=(panel,q)=>{const input=panel.querySelector('#jbe6Query'),button=panel.querySelector('#jbe6Search');if(!input||!button)return false;input.value=q;input.dataset.jarvisUserQuery='1';input.dispatchEvent(new Event('input',{bubbles:true}));try{if(typeof window.jarvisEbookSearchAuthority?.search==='function'){window.jarvisEbookSearchAuthority.search(q);return true}}catch{}try{button.click();return true}catch{return false}};
const tick=()=>{const panel=document.querySelector('#jbe6Panel');if(!panel)return;const results=panel.querySelector('#jbe6Results');if(!results)return;
if(!pending){const q=getContextQuery();if(q&&norm(q)!==lastContext){queue(q,'persisted-context')}}
if(!pending)return;if(Date.now()-pending.at>25000){pending=null;return}const q=pending.query;const cards=[...results.querySelectorAll('.jbe6-book')];if(matches(cards,q)){results.style.visibility='visible';pending=null;return}
results.style.visibility='hidden';if(!panel.__jarvisDisplaySearchFor||panel.__jarvisDisplaySearchFor!==norm(q)){panel.__jarvisDisplaySearchFor=norm(q);runSearch(panel,q)};
};
new MutationObserver(tick).observe(document.documentElement,{childList:true,subtree:true});setInterval(tick,150);tick();
})();
