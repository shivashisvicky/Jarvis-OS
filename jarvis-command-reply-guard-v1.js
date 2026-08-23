(()=>{
  'use strict';
  if(window.__JARVIS_COMMAND_REPLY_GUARD_V1__)return;
  window.__JARVIS_COMMAND_REPLY_GUARD_V1__=true;

  const ensureReply=()=>{
    const surface=document.querySelector('.command-surface');
    if(!(surface instanceof HTMLElement))return null;
    let reply=document.querySelector('#jarvisReply');
    if(!(reply instanceof HTMLElement)||!surface.contains(reply)){
      reply=document.createElement('div');
      reply.id='jarvisReply';
      reply.className='jarvis-reply';
      surface.appendChild(reply);
    }
    return reply;
  };

  document.addEventListener('submit',event=>{
    const form=event.target;
    if(form instanceof HTMLFormElement&&form.id==='commandForm')ensureReply();
  },true);

  document.addEventListener('click',event=>{
    const target=event.target;
    if(!(target instanceof Element))return;
    if(target.closest('#voiceBtn,#commandForm'))ensureReply();
  },true);

  document.addEventListener('input',event=>{
    const target=event.target;
    if(target instanceof HTMLInputElement&&target.id==='commandInput')ensureReply();
  },true);

  ensureReply();
  new MutationObserver(()=>ensureReply()).observe(document.documentElement,{childList:true,subtree:true});
})();
