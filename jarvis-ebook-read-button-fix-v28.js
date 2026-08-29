(()=>{'use strict';
if(window.__JARVIS_EBOOK_READ_BUTTON_V28__)return;window.__JARVIS_EBOOK_READ_BUTTON_V28__=true;
const TRACE='[JARVIS:GUTENBERG_TRACE]';
const log=(e,d={})=>{try{console.info(TRACE,e,d)}catch{}};
const get=b=>({id:b?.getAttribute('data-read')||b?.getAttribute('data-rel-read')||b?.getAttribute('data-final-read')||b?.getAttribute('data-native-read')||'',title:b?.getAttribute('data-title')||b?.closest('.jbe6-book')?.querySelector('.jbe6-name')?.textContent?.replace(/^\d+\.\s*/,'')||'JARVIS READER',plain:b?.getAttribute('data-plain')||'',epub:b?.getAttribute('data-epub')||''});
const open=b=>{const x=get(b);if(!x.id)return;log('READ_BUTTON_V28',{id:x.id,title:x.title});const f=window.jarvisEbookReaderOpenV24||window.jarvisEbookReaderOpenV22||window.jarvisEbookReaderOpen;if(typeof f==='function'){f(x.id,x.title,x.plain,x.epub);return}log('READ_BUTTON_V28_NO_READER',{id:x.id})};
window.addEventListener('click',e=>{const b=e.target?.closest?.('[data-read],[data-rel-read],[data-final-read],[data-native-read]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();open(b)},true);
log('READ_BUTTON_V28_READY');
})();