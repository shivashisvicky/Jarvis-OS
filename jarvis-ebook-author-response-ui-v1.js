(()=>{'use strict';if(window.__JARVIS_EBOOK_AUTHOR_RESPONSE_UI_V1__)return;window.__JARVIS_EBOOK_AUTHOR_RESPONSE_UI_V1__=true;
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
function render(text){const value=clean(text);if(!value)return false;const reply=document.querySelector('#jarvisReply');if(!reply)return false;reply.textContent=value;reply.classList.add('visible');return true}
window.jarvisRenderResponse=render;
window.addEventListener('jarvis:jarvis-response',e=>{const text=e?.detail?.text;if(text)render(text)});
window.addEventListener('jarvis:author-response',e=>{const text=e?.detail?.text;if(text)render(text)});
})();
