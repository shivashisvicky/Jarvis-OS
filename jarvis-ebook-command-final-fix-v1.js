(()=>{
'use strict';
if(window.__JARVIS_EBOOK_COMMAND_FINAL_FIX_V2__)return;
window.__JARVIS_EBOOK_COMMAND_FINAL_FIX_V2__=true;
const clean=s=>String(s??'').replace(/[?!.]+$/,'').replace(/\s+/g,' ').trim();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const norm=s=>clean(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const openFiles=()=>{const b=document.querySelector('.nav[data-app="files"]')||Array.from(document.querySelectorAll('[data-app="files"]')).find(Boolean);if(b)b.click();else return false;return true};
const selectEbooks=()=>{const root=document.querySelector('#jarvisFilesV4');const b=root?.querySelector('.jf4-opt[data-tab="ebooks"]');if(b){b.click();return true}return false};
const canonicalSearch=async(q)=>{
 const search=window.jarvisEbookSearchAuthority?.search;
 if(typeof search!=='function')return false;
 const panel=document.querySelector('#jbe6Panel');
 const input=panel?.querySelector('#jbe6Query');
 if(!panel||!input)return false;
 input.value=q;
 input.dispatchEvent(new Event('input',{bubbles:true}));
 input.dispatchEvent(new Event('change',{bubbles:true}));
 panel.querySelector('#jbe6Results')?.replaceChildren();
 await search(q);
 return true;
};
const defaultCatalogue=panel=>{
 const names=[...panel?.querySelectorAll('#jbe6Results .jbe6-name')||[]].map(x=>norm(x.textContent));
 return names.length>0 && names.slice(0,3).some(x=>x.includes('pride and prejudice')) && names.some(x=>x.includes('moby dick'));
};
let lastQuery='';
let reconcileBusy=false;
const reconcile=async()=>{
 if(reconcileBusy)return;
 const panel=document.querySelector('#jbe6Panel');
 const input=panel?.querySelector('#jbe6Query');
 if(!panel||!input)return;
 const q=clean(input.value);
 if(q.length<2)return;
 if(!defaultCatalogue(panel))return;
 const key=norm(q);
 if(key===lastQuery)return;
 lastQuery=key;
 reconcileBusy=true;
 try{await canonicalSearch(q)}finally{reconcileBusy=false}
};
const run=async(raw)=>{
 const q=clean(raw);
 if(!q||/\bstandard\s+ebooks?\b/i.test(q))return false;
 if(!openFiles())return false;
 for(let i=0;i<100;i++){
  if(selectEbooks()){
   lastQuery='';
   return await canonicalSearch(q);
  }
  await wait(100);
 }
 return false;
};
window.__JARVIS_EBOOK_FINAL_RUN__=run;
const watch=()=>{const panel=document.querySelector('#jbe6Panel');if(!panel||panel.dataset.jarvisFinalReconcile==='1')return;panel.dataset.jarvisFinalReconcile='1';const obs=new MutationObserver(()=>{if(panel.querySelector('.jbe6-book'))reconcile()});obs.observe(panel,{childList:true,subtree:true});reconcile()};
new MutationObserver(watch).observe(document.body,{childList:true,subtree:true});
watch();
})();
