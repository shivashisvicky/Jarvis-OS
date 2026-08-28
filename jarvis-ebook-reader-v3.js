(()=>{
'use strict';
// Reader v3 is now a compatibility shim. The ebook authority owns the single
// canonical jbe2 reader. Older versions preformatted the first result in the
// background, which created unnecessary network/CPU work and made iOS scrolling
// and navigation feel sluggish.
if(window.__JARVIS_EBOOK_READER_V3__)return;
window.__JARVIS_EBOOK_READER_V3__=true;
window.jarvisEbookReaderOpenV3=(id,title)=>{
  const open=window.jarvisEbookAuthority?.openReader||window.jarvisEbookReaderOpen;
  if(typeof open==='function')return open(String(id),String(title||''));
  return false;
};
})();
