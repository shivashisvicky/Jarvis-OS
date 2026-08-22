(()=>{
'use strict';
if(window.__JARVIS_VOICE_BOOTSTRAP__)return;
window.__JARVIS_VOICE_BOOTSTRAP__=true;
const ready=async()=>{
  const load=window.jarvisLoadFeature;
  if(typeof load!=='function')return setTimeout(ready,25);
  try{
    await load('voice');
    window.__JARVIS_VOICE_READY__=true;
    const sync=()=>{
      document.querySelectorAll('#voiceBtn').forEach(btn=>{
        btn.removeAttribute('disabled');
        btn.removeAttribute('aria-disabled');
        btn.dataset.voiceReady='1';
      });
    };
    sync();
    new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true});
  }catch(error){
    console.warn('[JARVIS voice bootstrap]',error);
    setTimeout(ready,250);
  }
};
const gate=()=>{
  document.querySelectorAll('#voiceBtn').forEach(btn=>{
    if(btn.dataset.voiceReady==='1')return;
    btn.setAttribute('disabled','disabled');
    btn.setAttribute('aria-disabled','true');
    btn.title='Voice engine loading…';
  });
};
gate();
new MutationObserver(gate).observe(document.documentElement,{childList:true,subtree:true});
void ready();
})();
