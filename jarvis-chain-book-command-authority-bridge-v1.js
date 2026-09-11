(()=>{
'use strict';
if(window.__JARVIS_CHAIN_BOOK_COMMAND_AUTHORITY_BRIDGE_V1__)return;
window.__JARVIS_CHAIN_BOOK_COMMAND_AUTHORITY_BRIDGE_V1__=true;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const candidate=q=>{try{return typeof window.jarvisEntityAuthority?.candidate==='function'&&!!window.jarvisEntityAuthority.candidate(q)}catch{return false}};
const install=()=>{
  const entity=window.jarvisEntityAuthority;
  const form=document.querySelector('#commandForm');
  if(!entity||typeof entity.handle!=='function'||entity.handle.__jarvisBookCommandBridge)return false;
  if(!form)return false;
  const original=entity.handle;
  const wrapped=async raw=>{
    if(!window.__JARVIS_COMMAND_CHAIN_RUNNING__||!candidate(raw))return original(raw);
    const input=form.querySelector('#commandInput');
    if(!(input instanceof HTMLInputElement))return original(raw);
    input.value=clean(raw);
    try{
      const event=new Event('submit',{bubbles:true,cancelable:true});
      form.dispatchEvent(event);
      return true;
    }catch{return original(raw)}
  };
  wrapped.__jarvisBookCommandBridge=true;
  window.jarvisEntityAuthority=Object.freeze({...entity,handle:wrapped});
  try{window.dispatchEvent(new CustomEvent('jarvis:ebook-reader-trace',{detail:{event:'BOOK_CHAIN_COMMAND_BRIDGE_INSTALLED',at:Date.now()}}))}catch{}
  return true;
};
if(!install()){
  let n=0;
  const timer=setInterval(()=>{if(install()||++n>100)clearInterval(timer)},50);
}
})();
