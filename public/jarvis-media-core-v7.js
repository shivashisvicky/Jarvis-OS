(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_DIAGNOSTIC_V3__) return;
  window.__JARVIS_MEDIA_DIAGNOSTIC_V3__ = true;

  const PEERTUBE = ['https://peertube.cpy.re', 'https://framatube.org', 'https://peertube.uno'];
  const INVIDIOUS = ['https://inv.nadeko.net', 'https://invidious.nerdvpn.de'];
  const TIMEOUT = 8000;
  const DEBUG = new URLSearchParams(location.search).has('mediaDebug') || localStorage.getItem('jarvis.media.debug') === '1';
  const logs = [];
  let boundRoot = null;

  const log = (step, data = {}) => {
    const entry = { t: new Date().toISOString(), step, ...data };
    logs.push(entry);
    if (logs.length > 200) logs.shift();
    window.__JARVIS_MEDIA_LOGS__ = logs;
    console.info('[JARVIS-MEDIA]', step, data);
    if (DEBUG) {
      const el = document.querySelector('#jarvisMediaDebug');
      if (el) el.textContent = logs.map(x => `${x.t.slice(11,23)} ${x.step} ${JSON.stringify(x)}`).join('\n');
    }
  };

  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const duration = v => { const n = Number(v)||0; return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`; };

  function debugPanel(parent) {
    if (!DEBUG || document.querySelector('#jarvisMediaDebug')) return;
    const pre = document.createElement('pre');
    pre.id = 'jarvisMediaDebug';
    pre.style.cssText = 'white-space:pre-wrap;max-height:260px;overflow:auto;margin:10px 0;padding:10px;border:1px solid #173545;border-radius:10px;font:11px monospace;color:#8fb1bd;background:#02070b';
    parent.appendChild(pre);
  }

  async function request(url, label) {
    const started = performance.now();
    log('HTTP_REQUEST', { label, url });
    const controller = new AbortController();
    const timer = setTimeout(() => { log('HTTP_TIMEOUT', { label, url }); controller.abort(); }, TIMEOUT);
    try {
      const response = await fetch(url, { signal: controller.signal, cache:'no-store', headers:{Accept:'application/json'} });
      const ms = Math.round(performance.now()-started);
      log('HTTP_RESPONSE', { label, url, status:response.status, ok:response.ok, ms, type:response.headers.get('content-type') });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      log('HTTP_JSON', { label, keys:data && typeof data==='object' ? Object.keys(data).slice(0,12) : [], count:Array.isArray(data) ? data.length : Array.isArray(data?.data) ? data.data.length : null });
      return data;
    } catch (error) {
      log('HTTP_ERROR', { label, url, error:String(error) });
      throw error;
    } finally { clearTimeout(timer); }
  }

  const peerItem = (x, host) => {
    const id = x?.uuid || x?.shortUUID || x?.id;
    if (!id) { log('NORMALIZE_SKIP', { platform:'PeerTube', reason:'missing id' }); return null; }
    const embed = `${host}/videos/embed/${encodeURIComponent(id)}?autoplay=1&peertubeLink=0`;
    log('NORMALIZE_RESULT', { platform:'PeerTube', id:String(id), title:x.name, embed });
    return { id:String(id), platform:'PeerTube', title:x.name||'Untitled video', author:x.channel?.displayName||x.account?.displayName||'PeerTube', views:x.views||0, duration:duration(x.duration), thumb:x.thumbnailPath?.startsWith('http')?x.thumbnailPath:(x.thumbnailPath?host+x.thumbnailPath:''), embed };
  };

  const invItem = (x, host) => {
    if (!x?.videoId) { log('NORMALIZE_SKIP', { platform:'Invidious', reason:'missing videoId' }); return null; }
    const embed = `${host}/embed/${encodeURIComponent(x.videoId)}?autoplay=1`;
    log('NORMALIZE_RESULT', { platform:'Invidious', id:String(x.videoId), title:x.title, embed });
    return { id:String(x.videoId), platform:'Invidious', title:x.title||'Untitled video', author:x.author||'Invidious', views:x.viewCount||0, duration:duration(x.lengthSeconds), thumb:x.videoThumbnails?.[0]?.url||'', embed };
  };

  async function search(query) {
    log('SEARCH_START', { query });
    const ptUrls = PEERTUBE.map(h => `${h}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12&sort=-publishedAt`);
    const invUrls = INVIDIOUS.map(h => `${h}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=1`);
    log('SEARCH_URLS_CONSTRUCTED', { peerTube:ptUrls, invidious:invUrls });

    const pt = await Promise.all(ptUrls.map((url,i) => request(url,`PeerTube:${PEERTUBE[i]}`).then(d => (d.data||[]).map(x=>peerItem(x,PEERTUBE[i])).filter(Boolean)).catch(()=>[])));
    const inv = await Promise.all(invUrls.map((url,i) => request(url,`Invidious:${INVIDIOUS[i]}`).then(d => (Array.isArray(d)?d:[]).map(x=>invItem(x,INVIDIOUS[i])).filter(Boolean)).catch(()=>[])));
    const all = [...pt.flat(), ...inv.flat()];
    const seen = new Set();
    const unique = all.filter(x => { const k=`${x.platform}:${x.id}`; if(seen.has(k)) return false; seen.add(k); return true; });
    log('SEARCH_COMPLETE', { peerTube:pt.flat().length, invidious:inv.flat().length, unique:unique.length });
    return unique.slice(0,16);
  }

  function mount() {
    const input=document.querySelector('#videoQuery'), results=document.querySelector('#videoResults'), player=document.querySelector('#jarvisPlayer'), state=document.querySelector('#mediaState');
    if(!input||!results||!player||!state) return false;
    if(boundRoot===results) return true;
    boundRoot=results;
    log('MOUNT', { url:location.href, input:true, results:true, player:true });
    debugPanel(results.parentElement||results);

    const status=document.createElement('div'); status.id='jmc7Status'; status.style.cssText='padding:10px 12px;border:1px solid #173545;border-radius:10px;color:#8fb1bd;font-size:.78rem;margin:8px 0'; results.parentElement?.insertBefore(status,results);
    const setStatus=t=>{status.textContent=t; state.textContent=String(t).split('·')[0].trim().toUpperCase(); log('UI_STATUS',{text:t});};

    const play=item=>{
      log('PLAY_REQUEST',{platform:item.platform,id:item.id,title:item.title,embed:item.embed});
      const iframe=document.createElement('iframe');
      iframe.title=item.title||'Video'; iframe.allow='autoplay; fullscreen; picture-in-picture'; iframe.allowFullscreen=true; iframe.referrerPolicy='strict-origin-when-cross-origin'; iframe.src=item.embed;
      log('PLAYER_URL_SET',{src:iframe.src});
      iframe.addEventListener('load',()=>{log('IFRAME_LOAD',{src:iframe.src});setStatus(`PLAYING · ${item.platform}`);});
      iframe.addEventListener('error',()=>{log('IFRAME_ERROR',{src:iframe.src});setStatus(`PLAYER ERROR · ${item.platform}`);});
      player.replaceChildren(iframe);
      setStatus(`LOADING · ${item.platform}`);
      setTimeout(()=>{ if(player.contains(iframe)) log('PLAYER_10S_CHECK',{src:iframe.src}); },10000);
    };

    const render=items=>{
      log('RENDER_START',{count:items.length});
      results.innerHTML='';
      items.forEach(item=>{
        const b=document.createElement('button'); b.type='button'; b.className='jom-card'; b.style.cssText='display:grid;grid-template-columns:150px 1fr 30px;gap:12px;width:100%;padding:0;margin:0 0 8px;text-align:left;border:1px solid #173545;border-radius:14px;background:#030b11;color:#d9f7ff;overflow:hidden';
        b.innerHTML=`<img style="width:150px;aspect-ratio:16/9;object-fit:cover" loading="lazy" src="${esc(item.thumb)}" alt=""><span style="padding:10px"><strong>${esc(item.title)}</strong><small style="display:block;margin-top:5px;color:#7896a3">${esc(item.platform)} · ${esc(item.author)} · ${esc(item.duration)}</small></span><b style="padding:10px">▶</b>`;
        b.addEventListener('click',()=>play(item)); results.appendChild(b);
      });
      log('RENDER_COMPLETE',{cards:results.querySelectorAll('.jom-card').length});
      setStatus(`RESULTS · ${items.length}`);
    };

    const doSearch=async()=>{
      const q=input.value.trim(); if(!q){setStatus('READY · ENTER A VIDEO SEARCH TERM');return;}
      results.innerHTML='<div class="jom-status">SEARCHING…</div>'; setStatus(`SEARCHING · ${q}`);
      try { const items=await search(q); if(items.length) render(items); else {log('SEARCH_EMPTY',{query:q});results.innerHTML='<div class="jom-status">VIDEO SEARCH TEMPORARILY UNAVAILABLE</div>';setStatus('DEGRADED · OPEN VIDEO NETWORK');} }
      catch(e){log('SEARCH_FATAL',{error:String(e)});results.innerHTML='<div class="jom-status">VIDEO SEARCH ERROR · SEE MEDIA LOG</div>';setStatus('ERROR · VIDEO SEARCH');}
    };

    const button=document.querySelector('#videoSearch');
    if(button){const fresh=button.cloneNode(true);button.replaceWith(fresh);fresh.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void doSearch();},true);}
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();void doSearch();}},true);
    setStatus('READY · OPEN VIDEO');
    return true;
  }

  const boot=()=>{const timer=setInterval(()=>{if(mount())clearInterval(timer);},100);};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
