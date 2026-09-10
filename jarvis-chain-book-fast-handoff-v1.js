(()=>{
'use strict';
if(window.__JARVIS_CHAIN_BOOK_FAST_HANDOFF_V1__)return;
window.__JARVIS_CHAIN_BOOK_FAST_HANDOFF_V1__=true;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const openBooksSurface=async()=>{
  const nav=document.querySelector('.nav[data-app="files"]')||Array.from(document.querySelectorAll('[data-app="files"]')).find(Boolean);
  if(nav instanceof HTMLElement&&!nav.classList.contains('selected'))nav.click();
  for(let i=0;i<100;i++){
    const tab=document.querySelector('#jarvisFilesV4 .jf4-opt[data-tab="ebooks"]');
    if(tab instanceof HTMLElement){
      if(!tab.classList.contains('active')&&!tab.classList.contains('selected'))tab.click();
      for(let j=0;j<100;j++){
        if(document.querySelector('#jbe6Panel'))return true;
        await wait(30);
      }
      return false;
    }
    await wait(30);
  }
  return false;
};
const trace=(event,data={})=>{try{console.info('[JARVIS:BOOK_CHAIN_FAST]',event,data);window.dispatchEvent(new CustomEvent('jarvis:ebook-reader-trace',{detail:{event:'BOOK_CHAIN_FAST_'+event,...data,at:Date.now()}}))}catch{}};
const install=()=>{
  const api=window.jarvisEbookBookFastResolver;
  if(!api||typeof api.run!=='function'||api.__jarvisChainWrapped)return false;
  const original=api.run;
  const wrapped=async raw=>{
    if(!window.__JARVIS_COMMAND_CHAIN_RUNNING__)return original(raw);
    const started=Date.now();
    const surface=openBooksSurface();
    const task=Promise.resolve().then(()=>original(raw)).then(ok=>{
      trace('ORIGINAL_RESULT',{raw,ok,ms:Date.now()-started});
      if(!ok){try{void window.jarvisEntityAuthority?.handle?.(raw)}catch{}}
      return !!ok;
    }).catch(error=>{
      trace('ORIGINAL_ERROR',{raw,error:String(error?.message||error)});
      try{void window.jarvisEntityAuthority?.handle?.(raw)}catch{}
      return false;
    });
    const opened=await surface;
    trace('SURFACE_READY',{raw,opened,ms:Date.now()-started});
    if(opened)return true;
    return task;
  };
  wrapped.__jarvisChainWrapped=true;
  api.run=wrapped;
  api.version=`${api.version||'unknown'}+chain-handoff-v1`;
  trace('INSTALLED',{version:api.version});
  return true;
};
if(!install()){
  let n=0;
  const timer=setInterval(()=>{if(install()||++n>100)clearInterval(timer)},50);
}
})();
