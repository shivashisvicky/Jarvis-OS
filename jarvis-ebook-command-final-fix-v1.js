(()=>{
'use strict';
if(window.__JARVIS_EBOOK_COMMAND_FINAL_FIX_V1__)return;
window.__JARVIS_EBOOK_COMMAND_FINAL_FIX_V1__=true;
const clean=s=>String(s??'').replace(/[?!.]+$/,'').replace(/\s+/g,' ').trim();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const openFiles=()=>{const b=document.querySelector('.nav[data-app="files"]')||Array.from(document.querySelectorAll('[data-app="files"]')).find(Boolean);if(b)b.click();else return false;return true};
const selectEbooks=()=>{const root=document.querySelector('#jarvisFilesV4');const b=root?.querySelector('.jf4-opt[data-tab="ebooks"]');if(b){b.click();return true}return false};
const run=async(raw)=>{
 const q=clean(raw);
 if(!q||/\bstandard\s+ebooks?\b/i.test(q))return false;
 if(!openFiles())return false;
 for(let i=0;i<100;i++){
  if(selectEbooks()){
   const search=window.jarvisEbookSearchAuthority?.search;
   if(typeof search!=='function')return false;
   await search(q);
   const panel=document.querySelector('#jbe6Panel');
   for(let j=0;j<100;j++){
    const status=panel?.querySelector('#jbe6StatusLine')?.textContent||'';
    const cards=[...panel?.querySelectorAll('#jbe6Results .jbe6-book')||[]];
    if(cards.length&&!/SEARCHING/i.test(status)&&/GUTENBERG/i.test(status))return true;
    await wait(100);
   }
   return false;
  }
  await wait(100);
 }
 return false;
};
window.__JARVIS_EBOOK_FINAL_RUN__=run;
})();
