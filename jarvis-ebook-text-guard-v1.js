(()=>{
'use strict';
if(window.__JARVIS_EBOOK_TEXT_GUARD_V1__)return;
window.__JARVIS_EBOOK_TEXT_GUARD_V1__=true;
const API='https://gutendex.com/books/';
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const toast=msg=>{let t=document.querySelector('#jbeTextGuardToast');if(!t){t=document.createElement('div');t.id='jbeTextGuardToast';t.style.cssText='position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:1000000;max-width:88vw;padding:11px 14px;border:1px solid rgba(120,220,240,.28);border-radius:12px;background:rgba(6,14,19,.96);color:#dffaff;font:700 11px/1.35 system-ui;text-align:center;box-shadow:0 10px 35px rgba(0,0,0,.35)';document.body.appendChild(t)}t.textContent=msg;t.hidden=false;clearTimeout(t.__timer);t.__timer=setTimeout(()=>{t.hidden=true},3200)};
const isText=b=>String(b?.media_type||'').toLowerCase()==='text'||Object.keys(b?.formats||{}).some(k=>/^text\/(plain|html)/i.test(k));
const filter=async()=>{const cards=[...document.querySelectorAll('#jbe6Results .jbe6-book')];if(!cards.length)return;await Promise.all(cards.map(async card=>{const btn=card.querySelector('[data-read]');const id=btn?.getAttribute('data-read');if(!id)return;try{const r=await fetch(`${API}${encodeURIComponent(id)}`,{cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)return;const b=await r.json();if(!isText(b)){card.remove()}}catch{}}));const remaining=document.querySelectorAll('#jbe6Results .jbe6-book').length;const status=document.querySelector('#jbe6StatusLine');if(status&&remaining)status.textContent=`${remaining} TEXT BOOKS`};
const intercept=e=>{const b=e.target?.closest?.('#jbe6Results [data-read]');if(!b)return;const id=b.getAttribute('data-read');if(!id)return;e.preventDefault();e.stopImmediatePropagation();(async()=>{try{const r=await fetch(`${API}${encodeURIComponent(id)}`,{cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw Error();const book=await r.json();if(!isText(book)){toast('This Gutenberg item is an audiobook. JARVIS will only open text editions.');return}window.jarvisEbookReaderOpenV14?.(book.id,book.title)}catch{toast('JARVIS could not verify this book. Please try again.')}})()};
window.addEventListener('click',intercept,true);
new MutationObserver(()=>{if(document.querySelector('#jbe6Results .jbe6-book'))filter()}).observe(document.body,{childList:true,subtree:true});
setTimeout(filter,700);setTimeout(filter,1800);setTimeout(filter,3500);
})();