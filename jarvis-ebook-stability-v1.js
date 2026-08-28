(()=>{
'use strict';
if(window.__JARVIS_EBOOK_STABILITY_V1__)return;
window.__JARVIS_EBOOK_STABILITY_V1__=true;
const API='https://gutendex.com/books/';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const getAuthority=()=>window.jarvisEbookAuthority;
const openReader=(id,title)=>{const a=getAuthority();if(!a||typeof a.openReader!=='function')return false;return !!a.openReader(String(id),String(title||''));};
window.jarvisEbookReaderOpen=window.jarvisEbookReaderOpen||openReader;

const wireReader=()=>{
  const panel=document.querySelector('#jbe6Panel');
  if(!panel)return;
  if(panel.dataset.stabilityReader==='1')return;
  panel.dataset.stabilityReader='1';
  panel.addEventListener('click',e=>{
    const b=e.target?.closest?.('[data-jbe2-read],[data-read]');
    if(!b||!panel.contains(b))return;
    const id=b.getAttribute('data-jbe2-read')||b.getAttribute('data-read');
    if(!id)return;
    const card=b.closest('.jbe6-book');
    const title=(b.getAttribute('data-title')||card?.querySelector('.jbe6-name')?.textContent||'').replace(/^\d+\.\s*/,'').trim();
    if(openReader(id,title)){e.preventDefault();e.stopImmediatePropagation();}
  },true);
};

const coverCache=new Map();
const loadCover=async(card)=>{
  if(card.dataset.coverReady==='1'||card.dataset.coverLoading==='1')return;
  const id=card.getAttribute('data-book-id');
  if(!id)return;
  card.dataset.coverLoading='1';
  try{
    let book=coverCache.get(id);
    if(!book){
      const r=await fetch(`${API}${encodeURIComponent(id)}`,{cache:'no-store',headers:{Accept:'application/json'}});
      if(!r.ok)throw Error(`HTTP ${r.status}`);
      book=await r.json();coverCache.set(id,book);
    }
    const url=book?.formats?.['image/jpeg']||'';
    const box=card.querySelector('.jbe6-cover');
    if(box&&url){
      const img=document.createElement('img');
      img.className='jbe6-cover';img.alt='';img.loading='lazy';img.decoding='async';img.src=url;
      img.style.cssText='width:58px;height:76px;object-fit:cover;border-radius:5px;background:#0b171e;border:1px solid var(--line);display:block';
      box.replaceWith(img);
    }
    card.dataset.coverReady='1';
  }catch{card.dataset.coverReady='1';}
  delete card.dataset.coverLoading;
};
const covers=()=>document.querySelectorAll('#jbe6Results .jbe6-book').forEach(loadCover);

const wireSearch=()=>{
  const panel=document.querySelector('#jbe6Panel');
  const a=getAuthority();
  if(!panel||!a||typeof a.search!=='function')return;
  const btn=panel.querySelector('#jbe6Search'),input=panel.querySelector('#jbe6Query');
  if(!btn||!input||panel.dataset.stabilitySearch==='1')return;
  panel.dataset.stabilitySearch='1';
  const run=()=>{const q=input.value.trim();if(!q)return;void a.search(q);};
  btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();run();},true);
  input.addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();e.stopImmediatePropagation();run();},true);
};

const observe=()=>{wireReader();wireSearch();covers();};
new MutationObserver(observe).observe(document.documentElement,{childList:true,subtree:true});
setInterval(observe,250);
observe();
})();
