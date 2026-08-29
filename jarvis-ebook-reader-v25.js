(()=>{'use strict';
if(window.__JARVIS_EBOOK_READER_BRIDGE_V25__)return;window.__JARVIS_EBOOK_READER_BRIDGE_V25__=true;
const TRACE='[JARVIS:GUTENBERG_TRACE]';
const log=(e,d={})=>{try{console.info(TRACE,e,d)}catch{}};
let readerPromise;
const loadReader=()=>{
  if(typeof window.jarvisEbookReaderOpenV24==='function')return Promise.resolve(window.jarvisEbookReaderOpenV24);
  if(readerPromise)return readerPromise;
  readerPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='./jarvis-ebook-reader-v24.js?v=20260829-reader-v24';
    s.defer=false;
    s.onload=()=>{const f=window.jarvisEbookReaderOpenV24||window.jarvisEbookReaderOpenV22;if(f){log('READER_V24_READY');resolve(f)}else{reject(Error('Reader global missing'))}};
    s.onerror=()=>{log('READER_V24_LOAD_FAILED');reject(Error('Reader script failed to load'))};
    document.head.appendChild(s);
  });
  return readerPromise;
};
const readButton=e=>{
  const b=e.target?.closest?.('[data-read],[data-rel-read],[data-final-read],[data-native-read]');
  if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();
  const id=b.getAttribute('data-rel-read')||b.getAttribute('data-final-read')||b.getAttribute('data-read')||b.getAttribute('data-native-read');
  if(!id)return;
  const title=b.getAttribute('data-title')||b.closest('.jbe6-book')?.querySelector('.jbe6-name')?.textContent?.replace(/^\d+\.\s*/,'')||'JARVIS READER';
  const plain=b.getAttribute('data-plain')||'';
  const epub=b.getAttribute('data-epub')||b.closest('.jbe6-book')?.querySelector('[data-epub]')?.getAttribute('data-epub')||'';
  log('READ_BUTTON',{id,title});
  loadReader().then(f=>f(id,title,plain,epub)).catch(err=>log('READ_BUTTON_ERROR',{id,error:String(err?.message||err)}));
};
const searchButton=e=>{
  const b=e.target?.closest?.('#jbe6Search');
  if(!b)return;
  const panel=b.closest('#jbe6Panel'),input=panel?.querySelector('#jbe6Query')||document.querySelector('#jbe6Query');
  if(!input)return;
  e.preventDefault();e.stopImmediatePropagation();
  const api=window.jarvisEbookSearchAuthority;
  log('BROWSE_BUTTON',{query:input.value});
  if(api?.search)api.search(input.value);
  else{try{b.dataset.bridgePending='1';input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))}catch{}}
};
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-read],[data-rel-read],[data-final-read],[data-native-read]'))return readButton(e);if(e.target?.closest?.('#jbe6Search'))return searchButton(e)},true);
loadReader().catch(()=>{});
})();
