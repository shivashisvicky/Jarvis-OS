(()=>{'use strict';
if(window.__JARVIS_EBOOK_CONTEXT_ENTITY_GUARD_V1__)return;
window.__JARVIS_EBOOK_CONTEXT_ENTITY_GUARD_V1__=true;
const preserve=()=>{try{const e=window.__JARVIS_ENTITY__;if(!e||!['PERSON','BOOK_AUTHOR'].includes(e.type))return;window.jarvisContextEngine?.set?.({entity:{...e}},'merge')}catch{}};
window.addEventListener('jarvis:ebook-context',preserve,true);
window.addEventListener('jarvis:context-reference-sync',preserve,true);
})();
