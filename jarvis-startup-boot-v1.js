/* JARVIS Startup Boot v1: readiness gate + cinematic startup + intelligence warmup */
(() => {
  'use strict';
  if (window.__JARVIS_STARTUP_BOOT__) return;
  window.__JARVIS_STARTUP_BOOT__ = true;
  const boot = document.createElement('div');
  boot.id = 'jarvis-boot';
  boot.setAttribute('role', 'status');
  boot.setAttribute('aria-label', 'JARVIS initializing');
  boot.innerHTML = `<div class="jarvis-boot-core"><div class="jarvis-reactor" aria-hidden="true"><div class="jarvis-reactor-ring"></div><div class="jarvis-reactor-core"></div></div><p class="jarvis-boot-name">J.A.R.V.I.S.</p><p class="jarvis-boot-subtitle">PERSONAL INTELLIGENCE SYSTEM</p><div class="jarvis-boot-status" aria-hidden="true"><div class="jarvis-boot-row"><span>CORE SYSTEM</span><b id="boot-core">ONLINE</b></div><div class="jarvis-boot-row"><span>VOICE AUTHORITY</span><b id="boot-voice">SYNCING</b></div><div class="jarvis-boot-row"><span>COMMAND AUTHORITY</span><b id="boot-command">SYNCING</b></div><div class="jarvis-boot-row"><span>LIBRARY CONTEXT</span><b id="boot-library">SYNCING</b></div></div><div class="jarvis-boot-track"><span></span></div><div class="jarvis-boot-online"><strong>JARVIS</strong> &nbsp; INITIALIZING</div></div>`;
  const mount=()=>{if(!document.body.contains(boot))document.body.appendChild(boot)};
  if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
  const started=performance.now(),minDisplay=900,timeout=6500;

  // Warm the real Gutenberg path. This primes DNS/TLS and a real Beowulf result
  // set without making boot dependent on Gutenberg being reachable.
  try{
    const key='jarvis:gutenberg:warm:Beowulf';
    const cached=JSON.parse(sessionStorage.getItem(key)||'null');
    if(!(cached?.results?.length&&Date.now()-cached.at<30*60*1000)){
      fetch('https://gutendex.com/books/?search=Beowulf&languages=en',{cache:'no-store',headers:{Accept:'application/json'},keepalive:true}).then(r=>r.ok?r.json():null).then(data=>{
        if(Array.isArray(data?.results)&&data.results.length){try{sessionStorage.setItem(key,JSON.stringify({at:Date.now(),results:data.results}))}catch(_){}try{console.info('[JARVIS:BOOT_WARM] Gutenberg ready',data.results.length)}catch(_){} }
      }).catch(()=>{});
    }
  }catch(_){ }

  const readiness=async()=>{
    await new Promise(resolve=>setTimeout(resolve,50));
    set('boot-command','READY');set('boot-library','READY');
    if(window.__JARVIS_VOICE_PRELOAD__){try{await Promise.race([window.__JARVIS_VOICE_PRELOAD__,new Promise(resolve=>setTimeout(resolve,2200))])}catch(_){}}
    set('boot-voice','READY');
    if(document.readyState!=='complete')await new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
  };
  const finish=async()=>{try{await readiness()}catch(_){}const elapsed=performance.now()-started,remaining=Math.max(0,minDisplay-elapsed);if(remaining)await new Promise(resolve=>setTimeout(resolve,remaining));set('boot-core','ONLINE');set('boot-voice','READY');set('boot-command','READY');set('boot-library','READY');const online=boot.querySelector('.jarvis-boot-online');if(online)online.innerHTML='<strong>JARVIS ONLINE</strong> &nbsp; READY';await new Promise(resolve=>setTimeout(resolve,180));boot.classList.add('is-ready');window.dispatchEvent(new CustomEvent('jarvis:ready'));setTimeout(()=>boot.remove(),700)};
  setTimeout(finish,0);
  setTimeout(()=>{if(!boot.classList.contains('is-ready')){boot.classList.add('is-ready');window.dispatchEvent(new CustomEvent('jarvis:ready',{detail:{timeout:true}}));setTimeout(()=>boot.remove(),700)}},timeout);
})();
