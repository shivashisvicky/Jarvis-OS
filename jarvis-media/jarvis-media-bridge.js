/* JARVIS local media bridge. The browser is a thin UI; yt-dlp/VLC live locally. */
(() => {
  'use strict';
  if (window.__JARVIS_LOCAL_MEDIA_BRIDGE__) return;
  window.__JARVIS_LOCAL_MEDIA_BRIDGE__ = true;

  const BASE = localStorage.getItem('jarvisMediaService') || 'http://127.0.0.1:8765';
  const q = s => document.querySelector(s);
  const input = () => q('#videoQuery, input[name="videoQuery"], .media-search-input');
  const status = t => { const el=q('#mediaState, .video-status, .media-status, #videoStatus'); if(el) el.textContent=t; };
  const trace = (event,data={}) => console.info('[JARVIS LOCAL MEDIA]',event,data);

  async function request(path, body) {
    const response = await fetch(`${BASE}${path}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    const data = await response.json().catch(() => ({ok:false,error:'Invalid service response'}));
    if (!response.ok || !data.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
    return data;
  }

  async function play(query) {
    query = String(query || '').trim();
    if (!query) return;
    trace('SEARCH_START',{query,service:BASE});
    status(`LOCAL MEDIA · SEARCHING · ${query.toUpperCase()}`);
    try {
      const result = await request('/search-play',{query});
      trace('SEARCH_PLAY_SUCCESS',result);
      status(`LOCAL VLC · ${result.message}`);
    } catch (error) {
      trace('SEARCH_PLAY_FAIL',{message:error.message});
      status(`LOCAL MEDIA ERROR · ${error.message}`);
    }
  }

  function bind() {
    const button=q('#videoSearch, button.search-btn, .media-search-submit');
    if(button && !button.dataset.jarvisLocalBound) {
      button.dataset.jarvisLocalBound='true';
      button.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void play(input()?.value);},{capture:true});
    }
    const field=input();
    if(field && !field.dataset.jarvisLocalBound) {
      field.dataset.jarvisLocalBound='true';
      field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();void play(field.value);}}, {capture:true});
    }
  }

  const observer=new MutationObserver(bind);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  bind();
  window.JarvisLocalMedia={play,baseUrl:BASE};
})();
