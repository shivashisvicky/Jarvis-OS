(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_DIAGNOSTIC_V4__) return;
  window.__JARVIS_MEDIA_DIAGNOSTIC_V4__ = true;

  const PEERTUBE=['https://peertube.cpy.re','https://framatube.org','https://peertube.uno'];
  const INVIDIOUS=['https://inv.nadeko.net','https://invidious.nerdvpn.de'];
  const TIMEOUT=8000;
  const DEBUG=new URLSearchParams(location.search).has('mediaDebug')||localStorage.getItem('jarvis.media.debug')==='1';
  const logs=[];
  let bound=null;

  const log=(step,data={})=>{
    const entry={t:new Date().toISOString(),step,...data}; logs.push(entry); if(logs.length>300) logs.shift();
    window.__JARVIS_MEDIA_LOGS__=logs; console.info('[JARVIS-MEDIA]',step,data);
    const out=document.querySelector('#jarvisMediaDebug'); if(out) out.textContent=logs.map(x=>`${x.t.slice(11,23)} ${x.step} ${JSON.stringify(x)}`).join('\n');
  };
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const duration=v=>{const n=Number(v)||0;return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;};

  function debugPanel(parent){
    if(!DEBUG||document.querySelector('#jarvisMediaDebug')) return;
    const pre=document.createElement('pre'); pre.id='jarvisMediaDebug'; pre.style.cssText='white-space:pre-wrap;max-height:280px;overflow:auto;margin:10px 0;padding:10px;border:1px solid #173545;border-radius:10px;font:11px monospace;color:#8fb1bd;background:#02070b'; parent.appendChild(pre);
  }

  async function http(url,label){
    const start=performance.now(); log('HTTP_REQUEST',{label,url}); const c=new AbortController(); const timer=setTimeout(()=>{log('HTTP_TIMEOUT',{label,url});c.abort();},TIMEOUT);
    try{
      const r=await fetch(url,{signal:c.signal,cache:'no-store',headers:{Accept:'application/json'}}); log('HTTP_RESPONSE',{label,url,status:r.status,ok:r.ok,ms:Math.round(performance.now()-start),contentType:r.headers.get('content-type')});
      if(!r.ok) throw new Error(`HTTP ${r.status}`); const data=await r.json(); log('HTTP_JSON',{label,count:Array.isArray(data)?data.length:Array.isArray(data?.data)?data.data.length:null,keys:data&&typeof data==='object'?Object.keys(data).slice(0,10):[]}); return data;
    }catch(e){log('HTTP_ERROR',{label,url,error:String(e)});throw e;}finally{clearTimeout(timer);}
  }

  function ptItem(x,host){const id=x?.uuid||x?.shortUUID||x?.id;if(!id){log('NORMALIZE_SKIP',{platform:'PeerTube'});return null;}const embed=`${host}/videos/embed/${encodeURIComponent(id)}?autoplay=1&peertubeLink=0`;log('NORMALIZE_RESULT',{platform:'PeerTube',id,title:x.name,embed});return{id:String(id),platform:'PeerTube',title:x.name||'Untitled video',author:x.channel?.displayName||x.account?.displayName||'PeerTube',duration:duration(x.duration),thumb:x.thumbnailPath?.startsWith('http')?x.thumbnailPath:(x.thumbnailPath?host+x.thumbnailPath:''),embed};}
  function invItem(x,host){if(!x?.videoId){log('NORMALIZE_SKIP',{platform:'Invidious'});return null;}const embed=`${host}/embed/${encodeURIComponent(x.videoId)}?autoplay=1`;log('NORMALIZE_RESULT',{platform:'Invidious',id:x.videoId,title:x.title,embed});return{id:String(x.videoId),platform:'Invidious',title:x.title||'Untitled video',author:x.author||'Invidious',duration:duration(x.lengthSeconds),thumb:x.videoThumbnails?.[0]?.url||'',embed};}

  async function search(query){
    log('SEARCH_START',{query});
    const pt=PEERTUBE.map(h=>`${h}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12&sort=-publishedAt`);
    const iv=INVIDIOUS.map(h=>`${h}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=1`);
    log('SEARCH_URLS_CONSTRUCTED',{peerTube:pt,invidious:iv});
    const a=await Promise.all(pt.map((u,i)=>http(u,`PeerTube:${PEERTUBE[i]}`).then(d=>(d.data||[]).map(x=>ptItem(x,PEERTUBE[i])).filter(Boolean)).catch(()=>[])));
    const b=await Promise.all(iv.map((u,i)=>http(u,`Invidious:${INVIDIOUS[i]}`).then(d=>(Array.isArray(d)?d:[]).map(x=>invItem(x,INVIDIOUS[i])).filter(Boolean)).catch(()=>[])));
    const seen=new Set(); const all=[...a.flat(),...b.flat()].filter(x=>{const k=x.platform+':'+x.id;if(seen.has(k))return false;seen.add(k);return true;}); log('SEARCH_COMPLETE',{peerTube:a.flat().length,invidious:b.flat().length,unique:all.length}); return all.slice(0,16);
  }

  function mount(){
    const input=document.querySelector('#videoQuery'),results=document.querySelector('#videoResults'),player=document.querySelector('#jarvisPlayer'),state=document.querySelector('#mediaState');
    if(!input||!results||!player||!state||bound===results)return !!results; bound=results; log('MOUNT',{url:location.href}); debugPanel(results.parentElement||results);
    const status=document.createElement('div');status.id='jmc7Status';status.style.cssText='padding:10px 12px;border:1px solid #173545;border-radius:10px;color:#8fb1bd;font-size:.78rem;margin:8px 0';results.parentElement?.insertBefore(status,results);
    const setStatus=t=>{status.textContent=t;state.textContent=String(t).split('·')[0].trim().toUpperCase();log('UI_STATUS',{text:t});};
    const play=item=>{log('PLAY_REQUEST',{platform:item.platform,id:item.id,title:item.title,embed:item.embed});const iframe=document.createElement('iframe');iframe.title=item.title||'Video';iframe.allow='autoplay; fullscreen; picture-in-picture';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.src=item.embed;log('PLAYER_URL_SET',{src:iframe.src});iframe.addEventListener('load',()=>{log('IFRAME_LOAD',{src:iframe.src});setStatus(`PLAYING · ${item.platform}`);});iframe.addEventListener('error',()=>{log('IFRAME_ERROR',{src:iframe.src});setStatus(`PLAYER_ERROR · ${item.platform}`);});player.replaceChildren(iframe);setStatus(`LOADING · ${item.platform}`);setTimeout(()=>{if(player.contains(iframe))log('PLAYER_10S_CHECK',{src:iframe.src});},10000);};
    const render=items=>{log('RENDER_START',{count:items.length});results.innerHTML='';items.forEach(item=>{const b=document.createElement('button');b.type='button';b.className='jom-card';b.style.cssText='display:grid;grid-template-columns:150px 1fr 30px;gap:12px;width:100%;padding:0;margin:0 0 8px;text-align:left;border:1px solid #173545;border-radius:14px;background:#030b11;color:#d9f7ff;overflow:hidden';b.innerHTML=`<img style="width:150px;aspect-ratio:16/9;object-fit:cover" loading="lazy" src="${esc(item.thumb)}" alt=""><span style="padding:10px"><strong>${esc(item.title)}</strong><small style="display:block;margin-top:5px;color:#7896a3">${esc(item.platform)} · ${esc(item.author)} · ${esc(item.duration)}</small></span><b style="padding:10px">▶</b>`;b.addEventListener('click',()=>play(item));results.appendChild(b);});log('RENDER_COMPLETE',{cards:results.querySelectorAll('.jom-card').length});setStatus(`RESULTS · ${items.length}`);};
    const doSearch=async()=>{const q=input.value.trim();if(!q){setStatus('READY · ENTER A VIDEO SEARCH TERM');return;}log('SEARCH_CLICK',{query:q});results.innerHTML='<div class="jom-status">SEARCHING…</div>';setStatus(`SEARCHING · ${q}`);try{const items=await search(q);if(items.length)render(items);else{log('SEARCH_EMPTY',{query:q});results.innerHTML='<div class="jom-status">VIDEO SEARCH TEMPORARILY UNAVAILABLE</div>';setStatus('DEGRADED · OPEN VIDEO NETWORK');}}catch(e){log('SEARCH_FATAL',{error:String(e)});results.innerHTML='<div class="jom-status">VIDEO SEARCH ERROR · SEE MEDIA LOG</div>';setStatus('ERROR · VIDEO SEARCH');}};
    const oldButton=document.querySelector('#videoSearch');if(oldButton){const b=oldButton.cloneNode(true);oldButton.replaceWith(b);b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void doSearch();},true);}
    const oldInput=input.cloneNode(true);input.replaceWith(oldInput);oldInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();void doSearch();}},true);
    setStatus('READY · OPEN VIDEO'); return true;
  }

  const observer=new MutationObserver(()=>{if(document.querySelector('#videoQuery')&&!document.querySelector('#jmc7Status')){log('DOM_REATTACH');mount();}}); observer.observe(document.documentElement,{childList:true,subtree:true});
  const boot=()=>{log('BOOT');const timer=setInterval(()=>{if(mount())clearInterval(timer);},100);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
