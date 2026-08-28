(()=>{
'use strict';
if(window.__JARVIS_EBOOK_RESULT_GUARD_V1__)return;
window.__JARVIS_EBOOK_RESULT_GUARD_V1__=true;
const API='https://gutendex.com/books/';
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const meta=async id=>{try{const r=await fetch(`${API}${encodeURIComponent(id)}`,{cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)return null;return await r.json()}catch{return null}};
const text=b=>Object.keys(b?.formats||{}).some(k=>/^text\/(plain|html)/i.test(k));
const sound=b=>String(b?.media_type||'').toLowerCase()==='sound'||String(b?.type||'').toLowerCase()==='sound';
const cover=b=>b?.formats?.['image/jpeg']||b?.formats?.['image/png']||b?.formats?.['image/webp']||'';
let busy=false;
const cleanResults=async()=>{if(busy)return;const box=document.querySelector('#jbe6Results');if(!box)return;const cards=[...box.querySelectorAll('.jbe6-book')];if(!cards.length)return;busy=true;try{const data=await Promise.all(cards.map(async card=>{const id=card.getAttribute('data-book-id')||card.querySelector('[data-read]')?.getAttribute('data-read')||'';return{id,b:await meta(id),card}}));const seen=new Set();let n=0;for(const x of data){const title=x.card.querySelector('.jbe6-name')?.textContent?.replace(/^\d+\.\s*/,'').trim()||'';const author=x.card.querySelector('.jbe6-author')?.textContent?.trim()||'';if(!x.b||sound(x.b)||!text(x.b)){x.card.remove();continue}const key=`${norm(title)}|${norm(author)}`;if(seen.has(key)){x.card.remove();continue}seen.add(key);n++;const name=x.card.querySelector('.jbe6-name');if(name)name.textContent=`${n}. ${title}`;const holder=x.card.querySelector('.jbe6-cover');const src=cover(x.b);if(holder&&src&&!holder.querySelector('img')){const img=document.createElement('img');img.src=src;img.loading='lazy';img.alt='';img.style='width:100%;height:100%;object-fit:cover;border-radius:8px';holder.appendChild(img)}}const line=document.querySelector('#jbe6StatusLine');if(line)line.textContent=`${n} RESULTS · GUTENBERG`}finally{busy=false}};
let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(cleanResults,120)};
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});schedule();
})();