(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_AUTHORITY_V8__) return;
  window.__JARVIS_MEDIA_AUTHORITY_V8__ = true;

  const PEERTUBE = ['https://peertube.cpy.re','https://framatube.org','https://peertube.uno'];
  const PIPED = ['https://pipedapi.kavin.rocks','https://pipedapi.syncpundit.io','https://api-piped.mha.fi','https://piped-api.garudalinux.org','https://pipedapi.adminforge.de','https://pipedapi.leptons.xyz','https://api.piped.yt'];
  const INVIDIOUS = ['https://inv.nadeko.net','https://invidious.nerdvpn.de'];
  const TIMEOUT = 6500;
  const logs = [];
  const debug = new URLSearchParams(location.search).has('mediaDebug') || localStorage.getItem('jarvis.media.debug') === '1';
  const log = (step, data = {}) => {
    const entry = { t: new Date().toISOString(), step, ...data };
    logs.push(entry); if (logs.length > 500) logs.shift();
    window.__JARVIS_MEDIA_LOGS__ = logs;
    console.info('[JARVIS-MEDIA-V8]', step, data);
    const panel = document.querySelector('#jarvisMediaDebug');
    if (panel) panel.textContent = logs.map(x => `${x.t.slice(11,23)} ${x.step} ${JSON.stringify(x)}`).join('\n');
  };
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const duration = v => { const n = Number(v) || 0; return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`; };
  const withTimeout = async (url, label) => {
    const controller = new AbortController();
    const timer = setTimeout(() => { log('HTTP_TIMEOUT',{label,url}); controller.abort(); }, TIMEOUT);
    const started = performance.now();
    log('HTTP_REQUEST',{label,url});
    try {
      const r = await fetch(url,{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}});
      log('HTTP_RESPONSE',{label,url,status:r.status,ok:r.ok,ms:Math.round(performance.now()-started),cors:r.headers.get('access-control-allow-origin') || null});
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      log('HTTP_JSON',{label,keys:data && typeof data==='object' ? Object.keys(data).slice(0,15) : [],count:Array.isArray(data)?data.length:(data?.items?.length ?? data?.data?.length ?? null)});
      return data;
    } finally { clearTimeout(timer); }
  };
  const firstSuccessful = async jobs => {
    const wrapped = jobs.map(async job => {
      try { const value = await job(); if (!value) throw new Error('empty'); return value; }
      catch (error) { log('PROVIDER_FAIL',{error:String(error)}); throw error; }
    });
    return Promise.any(wrapped);
  };

  function panel(parent) {
    if (!debug || document.querySelector('#jarvisMediaDebug')) return;
    const p = document.createElement('pre'); p.id='jarvisMediaDebug'; p.style.cssText='white-space:pre-wrap;max-height:300px;overflow:auto;margin:10px 0;padding:10px;border:1px solid #173545;border-radius:10px;font:11px monospace;color:#9ac0cc;background:#02070b'; parent.appendChild(p);
  }
  function peerItem(x, host) {
    const id = x?.uuid || x?.shortUUID || x?.id; if (!id) return null;
    return {id:String(id),platform:'PeerTube',title:x.name||'Untitled video',author:x.channel?.displayName||x.account?.displayName||'PeerTube',duration:duration(x.duration),thumb:x.thumbnailPath?.startsWith('http')?x.thumbnailPath:(x.thumbnailPath?host+x.thumbnailPath:''),embed:`${host}/videos/embed/${encodeURIComponent(id)}?autoplay=1&peertubeLink=0`};
  }
  function pipedItem(x, host) {
    let id = x?.videoId || null;
    try { id = id || new URL(x?.url || '',host).searchParams.get('v'); } catch {}
    if (!id) return null;
    return {id:String(id),platform:'Piped',title:x.title||'Untitled video',author:x.uploader||'YouTube',duration:duration(x.duration),thumb:x.thumbnail||'',api:host};
  }
  function invItem(x,host) {
    if (!x?.videoId) return null;
    return {id:String(x.videoId),platform:'Invidious',title:x.title||'Untitled video',author:x.author||'Invidious',duration:duration(x.lengthSeconds),thumb:x.videoThumbnails?.[0]?.url||'',embed:`${host}/embed/${encodeURIComponent(x.videoId)}?autoplay=1`};
  }

  async function search(query) {
    log('SEARCH_START',{query});
    const jobs = [
      ...PEERTUBE.map(host => async () => {
        const url=`${host}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12&sort=-publishedAt`;
        const d=await withTimeout(url,`PeerTube:${host}`); const items=(d.data||[]).map(x=>peerItem(x,host)).filter(Boolean);
        if (!items.length) throw new Error('PeerTube empty'); return items;
      }),
      ...PIPED.map(host => async () => {
        const url=`${host}/search?q=${encodeURIComponent(query)}&filter=videos`;
        const d=await withTimeout(url,`Piped:${host}`); const items=(d.items||[]).filter(x=>x.type==='stream').map(x=>pipedItem(x,host)).filter(Boolean);
        if (!items.length) throw new Error('Piped empty'); return items;
      }),
      ...INVIDIOUS.map(host => async () => {
        const url=`${host}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=1`;
        const d=await withTimeout(url,`Invidious:${host}`); const items=(Array.isArray(d)?d:[]).filter(x=>x.type==='video').map(x=>invItem(x,host)).filter(Boolean);
        if (!items.length) throw new Error('Invidious empty'); return items;
      })
    ];
    const winner = await firstSuccessful(jobs);
    log('SEARCH_WINNER',{count:winner.length,platform:winner[0]?.platform,instance:winner[0]?.api || null});
    return winner.slice(0,18);
  }

  async function pipedStream(item) {
    const candidates=[item.api,...PIPED.filter(x=>x!==item.api)];
    log('STREAM_RESOLVE_START',{id:item.id,candidates});
    for (const host of candidates) {
      try {
        const d=await withTimeout(`${host}/streams/${encodeURIComponent(item.id)}`,`PipedStream:${host}`);
        const streams=(d.videoStreams||[]).filter(x=>x?.url&&!x.videoOnly&&/^video\/mp4/i.test(x.mimeType||''));
        streams.sort((a,b)=>(Number(b.height)||0)-(Number(a.height)||0));
        if(streams[0]?.url){ log('STREAM_SELECTED',{id:item.id,host,url:streams[0].url,quality:streams[0].quality,height:streams[0].height}); return streams[0].url; }
        if(d.hls){ log('STREAM_SELECTED_HLS',{id:item.id,host,url:d.hls}); return d.hls; }
        throw new Error('No muxed playable stream');
      } catch(error) { log('STREAM_PROVIDER_FAIL',{id:item.id,host,error:String(error)}); }
    }
    throw new Error('No playable Piped stream');
  }

  function mount() {
    const input=document.querySelector('#videoQuery'), results=document.querySelector('#videoResults'), player=document.querySelector('#jarvisPlayer'), state=document.querySelector('#mediaState'), searchButton=document.querySelector('#videoSearch');
    if(!input||!results||!player||!state||!searchButton) return false;
    panel(results.parentElement||results);
    if (!results.dataset.v8Owner) {
      results.dataset.v8Owner='1';
      log('MEDIA_OWNER_ACQUIRED',{url:location.href});
      const status=document.createElement('div'); status.id='jv8Status'; status.style.cssText='padding:8px 10px;margin:8px 0;border:1px solid #173545;border-radius:9px;color:#8fb1bd;font-size:.75rem'; results.parentElement?.insertBefore(status,results);
      const setStatus=text=>{status.textContent=text;state.textContent=String(text).split('·')[0].trim().toUpperCase();log('UI_STATUS',{text});};
      const play=async item=>{
        log('PLAY_REQUEST',{platform:item.platform,id:item.id,title:item.title,api:item.api,embed:item.embed}); setStatus(`RESOLVING · ${item.platform}`);
        try {
          if(item.platform==='Piped') {
            const src=await pipedStream(item); log('PLAYER_URL_CONSTRUCTED',{platform:item.platform,id:item.id,src});
            const v=document.createElement('video'); v.controls=true; v.autoplay=true; v.playsInline=true; v.preload='auto'; v.src=src;
            v.addEventListener('loadedmetadata',()=>log('VIDEO_METADATA',{id:item.id,duration:v.duration,src}));
            v.addEventListener('canplay',()=>{log('VIDEO_CANPLAY',{id:item.id,src});v.play().then(()=>log('VIDEO_PLAY_RESOLVED',{id:item.id})).catch(e=>log('VIDEO_PLAY_REJECTED',{id:item.id,error:String(e)}));});
            v.addEventListener('playing',()=>{log('VIDEO_PLAYING',{id:item.id,currentTime:v.currentTime});setStatus(`PLAYING · PIPED`);});
            v.addEventListener('error',()=>{log('VIDEO_ERROR',{id:item.id,src,error:v.error?{code:v.error.code,message:v.error.message}:null});setStatus('PLAYER_ERROR · PIPED');});
            player.replaceChildren(v); return;
          }
          if(item.platform==='PeerTube'||item.platform==='Invidious') {
            const f=document.createElement('iframe'); f.title=item.title||'Video'; f.allow='autoplay; fullscreen; picture-in-picture'; f.allowFullscreen=true; f.referrerPolicy='strict-origin-when-cross-origin'; f.src=item.embed; log('PLAYER_URL_SET',{platform:item.platform,src:f.src}); f.addEventListener('load',()=>{log('IFRAME_LOAD',{platform:item.platform,src:f.src});setStatus(`LOADED · ${item.platform}`)}); f.addEventListener('error',()=>{log('IFRAME_ERROR',{platform:item.platform,src:f.src});setStatus(`PLAYER_ERROR · ${item.platform}`)}); player.replaceChildren(f);
          }
        } catch(error) { log('PLAY_FATAL',{platform:item.platform,id:item.id,error:String(error)}); setStatus(`PLAYER_ERROR · ${item.platform}`); }
      };
      const render=items=>{log('RENDER_START',{count:items.length});results.innerHTML='';items.forEach(item=>{const b=document.createElement('button');b.type='button';b.className='jom-card';b.dataset.platform=item.platform;b.dataset.videoId=item.id;b.style.cssText='display:grid;grid-template-columns:150px 1fr 30px;gap:12px;width:100%;padding:0;margin:0 0 8px;text-align:left;border:1px solid #173545;border-radius:14px;background:#030b11;color:#d9f7ff;overflow:hidden';b.innerHTML=`<img style="width:150px;aspect-ratio:16/9;object-fit:cover" loading="lazy" src="${esc(item.thumb)}" alt=""><span style="padding:10px"><strong>${esc(item.title)}</strong><small style="display:block;margin-top:5px;color:#7896a3">${esc(item.platform)} · ${esc(item.author)} · ${esc(item.duration)}</small></span><b style="padding:10px">▶</b>`;b.addEventListener('click',()=>void play(item));results.appendChild(b)});log('RENDER_COMPLETE',{cards:results.querySelectorAll('.jom-card').length});setStatus(`RESULTS · ${items.length}`)};
      const doSearch=async()=>{const q=input.value.trim();if(!q){setStatus('READY · ENTER A VIDEO SEARCH TERM');return}log('SEARCH_CLICK',{query:q});setStatus(`SEARCHING · ${q}`);results.innerHTML='<div class="jom-status">SEARCHING OPEN VIDEO NETWORKS…</div>';try{render(await search(q));}catch(error){log('SEARCH_FATAL',{error:String(error)});results.innerHTML='<div class="jom-status">VIDEO SEARCH FAILED · SEE MEDIA LOG</div>';setStatus('ERROR · VIDEO SEARCH')}};
      const sb=searchButton.cloneNode(true);searchButton.replaceWith(sb);sb.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void doSearch()},true);
      const ni=input.cloneNode(true);input.replaceWith(ni);ni.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();void doSearch()}},true);
      const playButton=document.querySelector('#playVideo');if(playButton){const pb=playButton.cloneNode(true);playButton.replaceWith(pb);pb.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const raw=document.querySelector('#videoUrl')?.value?.trim();const id=raw?.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/)?.[1]||raw;if(/^https?:\/\//.test(raw||'')){player.innerHTML=`<video controls autoplay playsinline src="${esc(raw)}"></video>`;setStatus('PLAYING · DIRECT URL')}else if(id&&/^[A-Za-z0-9_-]{11}$/.test(id)){const f=document.createElement('iframe');f.allow='autoplay; fullscreen; picture-in-picture';f.allowFullscreen=true;f.src=`https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1`;player.replaceChildren(f);setStatus('LOADED · YOUTUBE')}else setStatus('READY · ENTER VIDEO URL')},true)}
      setStatus('READY · OPEN VIDEO');
    }
    return true;
  }

  // The React/TS shell currently has its own historical setupMedia(). This watchdog
  // intentionally reclaims the controls after each shell render without touching
  // any other JARVIS subsystem.
  const takeover=()=>{const r=document.querySelector('#videoResults');if(r&&!r.dataset.v8Owner){mount();}else if(r&&r.dataset.v8Owner&&!document.querySelector('#jv8Status')){r.dataset.v8Owner='';mount();}};
  new MutationObserver(takeover).observe(document.documentElement,{subtree:true,childList:true});
  setInterval(takeover,350);
  log('V8_BOOT',{providers:{peerTube:PEERTUBE,piped:PIPED,invidious:INVIDIOUS},timeout:TIMEOUT});
  takeover();
})();
