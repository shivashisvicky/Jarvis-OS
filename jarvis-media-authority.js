/** J.A.R.V.I.S. OS 2.0 - Local Media Authority
 * Browser = thin control surface. Search/extraction/playback = local Python service.
 * No YouTube API key. No browser scraping. No CORS proxy. No provider race in the browser.
 */
(() => {
  'use strict';
  if (window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__) return;
  window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__ = true;

  const SERVICE = localStorage.getItem('jarvisMediaService') || 'http://127.0.0.1:8765';
  const TRACE_LIMIT = 300;
  const trace = [];
  let seq = 0;
  const log = (event, data = {}) => {
    const entry = { seq: ++seq, at: new Date().toISOString(), event, data };
    trace.push(entry); if (trace.length > TRACE_LIMIT) trace.shift();
    console.info(`[JARVIS MEDIA ${entry.seq}] ${event}`, data);
    window.__JARVIS_MEDIA_TRACE__ = trace.slice();
    window.__JARVIS_MEDIA_LAST_EVENT__ = entry;
  };
  const find = selectors => selectors.map(s => document.querySelector(s)).find(Boolean) || null;
  const input = () => find(['#videoQuery','input[name="videoQuery"]','.media-search-input']);
  const status = text => { const el=find(['#mediaState','.video-status','.media-status','#videoStatus']); if(el) el.textContent=text; log('STATUS',{text,found:Boolean(el)}); };
  const results = () => find(['#videoResults','.video-results-container','.jyt-results']);

  function bind() {
    const button=find(['#videoSearch','button.search-btn','.media-search-submit']);
    if(button && !button.dataset.jarvisLocalBound) {
      button.dataset.jarvisLocalBound='true';
      button.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); void search(); }, {capture:true});
      log('BIND',{control:'search',id:button.id});
    }
    const field=input();
    if(field && !field.dataset.jarvisLocalBound) {
      field.dataset.jarvisLocalBound='true';
      field.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); e.stopImmediatePropagation(); void search(); } }, {capture:true});
      log('BIND',{control:'input',id:field.id});
    }
  }

  async function call(path, payload) {
    const started=performance.now();
    log('REQUEST',{path,payload,service:SERVICE});
    const response=await fetch(`${SERVICE}${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await response.json().catch(()=>({ok:false,error:'Invalid JSON from local media service'}));
    log('RESPONSE',{path,status:response.status,ok:response.ok,data,elapsedMs:Math.round(performance.now()-started)});
    if(!response.ok || !data.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
    return data;
  }

  async function search() {
    const field=input();
    if(!field) { log('ERROR',{stage:'search',message:'Search input missing'}); return; }
    const query=field.value.trim();
    if(!query) return;
    log('SEARCH_START',{query,connected:field.isConnected});
    const box=results();
    if(box) { box.replaceChildren(); const loading=document.createElement('div'); loading.className='media-loading-indicator'; loading.textContent='JARVIS LOCAL MEDIA · SEARCHING / EXTRACTING / PLAYING…'; box.appendChild(loading); }
    status(`LOCAL MEDIA · SEARCHING · ${query.toUpperCase()}`);
    try {
      const data=await call('/search-play',{query});
      log('PLAY_SUCCESS',{query,message:data.message});
      status(`LOCAL VLC · ${data.message}`);
      if(box) { box.replaceChildren(); const ok=document.createElement('div'); ok.className='media-local-success'; ok.textContent=data.message; box.appendChild(ok); }
    } catch(error) {
      log('PLAY_FAILURE',{query,message:error.message});
      status(`LOCAL MEDIA ERROR · ${error.message}`);
      if(box) { box.replaceChildren(); const fail=document.createElement('div'); fail.className='media-degraded-state'; const p=document.createElement('p'); p.textContent='LOCAL MEDIA SERVICE UNAVAILABLE.'; const d=document.createElement('span'); d.className='diagnostic-text'; d.textContent=`NETWORK DIAGNOSTIC: ${error.message}`; fail.append(p,d); box.appendChild(fail); }
    }
  }

  window.JarvisMediaDebug={getTrace:()=>trace.slice(),dump:()=>console.table(trace),clear:()=>trace.splice(0),service:SERVICE};
  const boot=()=>{ log('BOOT',{service:SERVICE,online:navigator.onLine}); bind(); new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true}); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
