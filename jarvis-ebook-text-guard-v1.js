(()=>{
'use strict';
if(window.__JARVIS_EBOOK_TEXT_GUARD_V2__)return;
window.__JARVIS_EBOOK_TEXT_GUARD_V2__=true;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const norm=s=>clean(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const dedupe=()=>{const box=document.querySelector('#jbe6Results');if(!box)return;const seen=new Set();[...box.querySelectorAll('.jbe6-book')].forEach(card=>{const title=norm(card.querySelector('.jbe6-name')?.textContent||'');const author=norm(card.querySelector('.jbe6-author')?.textContent||'');const key=`${title}|${author}`;if(!title||seen.has(key))card.remove();else seen.add(key)});const status=document.querySelector('#jbe6StatusLine');const remaining=box.querySelectorAll('.jbe6-book').length;if(status&&remaining)status.textContent=`${remaining} TEXT BOOKS · GUTENBERG`};
const intercept=e=>{const b=e.target?.closest?.('#jbe6Results [data-read]');if(!b)return;const id=b.getAttribute('data-read');if(!id)return;e.preventDefault();e.stopImmediatePropagation();const title=clean(b.getAttribute('data-title')||b.closest('.jbe6-book')?.querySelector('.jbe6-name')?.textContent||'JARVIS READER').replace(/^\d+\.\s*/,'');try{const open=window.jarvisEbookAuthority?.openReader||window.jarvisEbookReaderOpen;if(typeof open==='function')void Promise.resolve(open(String(id),title));else console.warn('[JARVIS ebook guard] reader authority unavailable')}catch(error){console.warn('[JARVIS ebook guard] reader open failed',error)}};
window.addEventListener('click',intercept,true);
let scheduled=false;const scheduleDedupe=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;dedupe()})};
new MutationObserver(scheduleDedupe).observe(document.body,{childList:true,subtree:true});
setTimeout(dedupe,700);setTimeout(dedupe,1800);setTimeout(dedupe,3500);
})();
