(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_V9_BOOT__) return;
  window.__JARVIS_MEDIA_V9_BOOT__ = true;

  const PEERTUBE = ['https://peertube.cpy.re','https://peertube2.cpy.re','https://peertube3.cpy.re'];
  const sources = new Map();
  const originalFetch = window.fetch.bind(window);
  const log = (...a) => { try { console.debug('[JARVIS-MEDIA-V9]', ...a); } catch {} };
  const jsonResponse = value => new Response(JSON.stringify(value), {status:200,headers:{'Content-Type':'application/json'}});

  async function ptFetch(path) {
    let last;
    for (const host of PEERTUBE) {
      const url = `${host}${path}`; const started=performance.now();
      try {
        log('HTTP_REQUEST',url);
        const r=await originalFetch(url,{headers:{Accept:'application/json'},cache:'no-store'});
        log('HTTP_RESPONSE',r.status,url,`${Math.round(performance.now()-started)}ms`);
        if(r.ok)return {host,data:await r.json()};
        last=new Error(`${r.status} ${r.statusText}`);
      } catch(e){last=e;log('HTTP_ERROR',url,e instanceof Error?e.message:String(e));}
    }
    throw last instanceof Error?last:new Error('PeerTube unavailable');
  }

  async function ptFetchFrom(host,path) {
    const url=`${host}${path}`; const started=performance.now(); log('STREAM_HTTP_REQUEST',url);
    const r=await originalFetch(url,{headers:{Accept:'application/json'},cache:'no-store'});
    log('STREAM_HTTP_RESPONSE',r.status,url,`${Math.round(performance.now()-started)}ms`);
    if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);
    return {host,data:await r.json()};
  }

  function pipedItem(host,v) {
    const id=String(v.uuid||v.shortUUID||v.id||''); if(!id)return null;
    sources.set(id,host);
    const thumb=typeof v.thumbnailPath==='string'&&/^https?:/i.test(v.thumbnailPath)?v.thumbnailPath:(v.thumbnailPath?`${host}${v.thumbnailPath}`:(v.thumbnails?.[0]?.fileUrl||''));
    return {url:`https://youtube.com/watch?v=${encodeURIComponent(id)}`,videoId:id,title:v.name||v.displayName||'Untitled video',uploader:v.videoChannel?.displayName||v.ownerAccount?.displayName||'PeerTube',thumbnail:thumb,uploadedDate:v.publishedAt||'',views:v.views||0};
  }

  async function searchPeerTube(query) {
    const {host,data}=await ptFetch(`/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12&sort=-trending&hasWebVideoFiles=true&nsfw=false`);
    const items=(data.data||[]).map(v=>pipedItem(host,v)).filter(Boolean);
    log('SEARCH_RESULT',query,items.length);
    return items;
  }

  async function trendingPeerTube() {
    const {host,data}=await ptFetch('/api/v1/videos?count=12&sort=-trending&hasWebVideoFiles=true&nsfw=false');
    const items=(data.data||[]).map(v=>pipedItem(host,v)).filter(Boolean);
    log('TRENDING_RESULT',items.length);
    return items;
  }

  async function streamPeerTube(id) {
    const host=sources.get(id)||PEERTUBE[0];
    const {data}=await ptFetchFrom(host,`/api/v1/videos/${encodeURIComponent(id)}?include=8`);
    const files=(data.files||[]).filter(f=>f.fileUrl&&f.hasVideo!==false&&f.hasAudio!==false).sort((a,b)=>Number(b.height||0)-Number(a.height||0));
    const f=files[0];
    if(!f)throw new Error('PeerTube video has no browser-playable web file');
    log('STREAM_SELECTED',id,f.fileUrl,f.mimeType||'video/mp4',f.resolution?.label||`${f.height||''}p`);
    return {videoStreams:[{url:f.fileUrl,mimeType:f.mimeType||'video/mp4',quality:f.resolution?.label||`${f.height||''}p`,height:f.height||0,videoOnly:false}],thumbnailUrl:data.thumbnailPath?`${host}${data.thumbnailPath}`:''};
  }

  window.fetch=async function(input,init) {
    const url=typeof input==='string'?input:input?.url||'';
    try {
      const u=new URL(url,location.href);
      if(/pipedapi[^/]*\./i.test(u.hostname)) {
        if(u.pathname==='/search')return jsonResponse({items:await searchPeerTube(u.searchParams.get('q')||'')});
        if(u.pathname==='/trending')return jsonResponse(await trendingPeerTube());
        const m=u.pathname.match(/^\/streams\/([^/]+)$/);
        if(m)return jsonResponse(await streamPeerTube(decodeURIComponent(m[1])));
      }
    } catch(e) { log('ADAPTER_ERROR',e instanceof Error?e.message:String(e)); }
    return originalFetch(input,init);
  };

  const bindPlayerDiagnostics=()=>{
    const p=document.querySelector('#jarvisPlayer');
    if(!p||p.dataset.v9diag==='1')return;
    p.dataset.v9diag='1';
    p.addEventListener('error',e=>log('PLAYER_ERROR',e instanceof Event?'media element error':String(e)),true);
    p.addEventListener('loadedmetadata',()=>log('PLAYER_METADATA'));
    p.addEventListener('canplay',()=>log('PLAYER_CANPLAY'));
    p.addEventListener('playing',()=>log('PLAYER_PLAYING'));
    p.addEventListener('waiting',()=>log('PLAYER_WAITING'));
  };
  const timer=setInterval(()=>{bindPlayerDiagnostics();if(document.querySelector('#jarvisPlayer'))clearInterval(timer);},100);
  log('BOOT','PeerTube adapter active before JARVIS media initialization');
})();
