(()=>{
'use strict';
if(window.__JARVIS_MAP_PAGINATION_V1__)return;
window.__JARVIS_MAP_PAGINATION_V1__=true;
const PAGE=6;
let page=1,lastSignature='',lastQuery='',prefetchTimer=0,rendering=false;
const q=s=>document.querySelector(s);
const cards=()=>[...document.querySelectorAll('#mapResults [data-jarvis-map-v21]')];
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
function ensurePagination(){
 const el=q('#mapResults');if(!el)return;
 const all=cards();if(!all.length)return;
 const total=all.length,pages=Math.max(1,Math.ceil(total/PAGE));if(page>pages)page=pages;
 all.forEach((b,i)=>{b.style.display=(Math.floor(i/PAGE)+1===page)?'':'none';});
 let pager=el.querySelector('#jarvisMapPagerV1');
 if(!pager){pager=document.createElement('div');pager.id='jarvisMapPagerV1';pager.style.cssText='display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap;margin:10px 0 6px;';el.appendChild(pager);}
 pager.innerHTML='';
 const add=(label,target,disabled=false,active=false)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.dataset.page=String(target);b.style.cssText='min-width:38px;height:34px;border:1px solid rgba(80,190,230,.45);border-radius:9px;background:'+(active?'rgba(70,190,230,.28)':'rgba(5,15,22,.88)')+';color:#d9f6ff;font-weight:700;font-size:13px;';if(!disabled)b.addEventListener('click',()=>{page=target;ensurePagination();window.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+window.scrollY-8),behavior:'smooth'});});pager.appendChild(b);};
 add('‹',page-1,page<=1);for(let i=1;i<=pages;i++)add(String(i),i,false,i===page);add('›',page+1,page>=pages);
 const info=document.createElement('span');info.textContent=`${Math.min((page-1)*PAGE+1,total)}–${Math.min(page*PAGE,total)} of ${total}`;info.style.cssText='width:100%;text-align:center;color:var(--muted,#78939c);font-size:11px;margin-top:2px;';pager.appendChild(info);
 const legacy=el.querySelector('#mapMoreResultsV21');if(legacy)legacy.style.display='none';
}
function schedulePrefetch(){
 if(prefetchTimer||cards().length>=6)return;
 const more=q('#mapMoreResultsV21');
 if(!(more instanceof HTMLButtonElement)||more.disabled)return;
 prefetchTimer=setTimeout(()=>{prefetchTimer=0;const current=q('#mapMoreResultsV21');if(current instanceof HTMLButtonElement&&!current.disabled)current.click();},900);
}
function watch(){
 const el=q('#mapResults');if(!el)return;
 const query=normalize(q('#mapQuery')?.value||'');
 if(query!==lastQuery){lastQuery=query;page=1;}
 const sig=normalize(el.innerText||'');
 if(sig===lastSignature){ensurePagination();return;}
 lastSignature=sig;
 if(rendering)return;
 rendering=true;
 requestAnimationFrame(()=>{ensurePagination();schedulePrefetch();rendering=false;});
}
new MutationObserver(watch).observe(document.documentElement,{childList:true,subtree:true});
setInterval(watch,500);watch();
})();
