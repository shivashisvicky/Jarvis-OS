/* J.A.R.V.I.S. OS 2.0 - resilient keyless live media authority */
(() => {
  'use strict';
  if (window.__JARVIS_FINAL_MEDIA_AUTHORITY__) return;
  window.__JARVIS_FINAL_MEDIA_AUTHORITY__ = true;

  const TIMEOUT = 7000;
  const JINA = 'https://r.jina.ai/';
  const PIPED = ['https://pipedapi.kavin.rocks','https://pipedapi.tokhmi.xyz','https://pipedapi.moomoo.me','https://pipedapi.syncpundit.io','https://api-piped.mha.fi','https://piped-api.garudalinux.org'];
  const INVIDIOUS = ['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com','https://invidious.tiekoetter.com'];
  const $ = s => document.querySelector(s);
  const dom = () => ({input:$('#videoQuery'),search:$('#videoSearch'),results:$('#videoResults'),player:$('#jarvisPlayer'),state:$('#mediaState')||$('#jvcStatus')});
  const trace = (event,data={}) => { const log=Array.isArray(window.__JARVIS_MEDIA_TRACE__)?window.__JARVIS_MEDIA_TRACE__:[]; log.push({ts:new Date().toISOString(),event,...data}); window.__JARVIS_MEDIA_TRACE__=log.slice(-150); console.debug('[JARVIS-MEDIA]',log[log.length-1]); };
  const status = text => { const el=dom().state; if(el) el.textContent=text; };

  function ytId(value){
    const s=String(value||'').trim();
    if(/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
    try { const u=new URL(s); if(u.hostname==='youtu.be') return u.pathname.slice(1).split('/')[0]||''; if(/(^|\.)youtube\.com$/.test(u.hostname)){ if(u.pathname==='/watch') return u.searchParams.get('v')||''; const p=u.pathname.split('/').filter(Boolean); if(['shorts','embed','v'].includes(p[0])) return p[1]||''; } } catch {}
    return '';
  }
  const make=(id,title,channel='YouTube',thumbnail='')=>/^[A-Za-z0-9_-]{11}$/.test(id)?{id,title:String(title||'YouTube video'),channel:String(channel||'YouTube'),thumbnail:String(thumbnail||'')}:null;

  async function fetchText(url,label){
    const candidates=[{url,transport:'direct'},{url:JINA+url,transport:'jina'}]; let last;
    for(const c of candidates){ const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),TIMEOUT); const started=performance.now(); trace('request:start',{provider:label,transport:c.transport,url});
      try { const r=await fetch(c.url,{signal:controller.signal,cache:'no-store',credentials:'omit'}); if(!r.ok) throw new Error(`HTTP ${r.status}`); const body=await r.text(); if(body.length<20) throw new Error('empty response'); trace('request:success',{provider:label,transport:c.transport,ms:Math.round(performance.now()-started),bytes:body.length}); return body; }
      catch(e){ last=e; trace('request:failure',{provider:label,transport:c.transport,error:String(e)}); } finally { clearTimeout(timer); }
    }
    throw last||new Error('request failed');
  }
  async function fetchJson(url,label){ const raw=await fetchText(url,label); try{return JSON.parse(raw);}catch{throw new Error(`${label} returned non-JSON data`);} }

  function parseLinks(body,query,provider){
    const out=[],seen=new Set();
    const patterns=[/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/gi,/(?:https?:\/\/)?youtu\.be\/([A-Za-z0-9_-]{11})/gi];
    for(const re of patterns){ let m; while((m=re.exec(body))&&out.length<12){ const id=m[1]; if(!seen.has(id)){ seen.add(id); const around=body.slice(Math.max(0,m.index-220),Math.min(body.length,m.index+320)); const title=around.match(/\[([^\]]{3,180})\]\(/)?.[1]||`${query} · YouTube result ${out.length+1}`; out.push(make(id,title.replace(/\s+/g,' ').trim(),provider)); } } }
    trace('provider:results',{provider,query,count:out.length}); return out.filter(Boolean);
  }
  async function youtube(query){const u=new URL('https://www.youtube.com/results');u.searchParams.set('search_query',query);return parseLinks(await fetchText(u.toString(),'youtube'),query,'YouTube');}
  async function bing(query){const u=new URL('https://www.bing.com/videos/search');u.searchParams.set('q',`${query} site:youtube.com/watch`);return parseLinks(await fetchText(u.toString(),'bing'),query,'Bing/YouTube');}
  async function duck(query){const u=new URL('https://html.duckduckgo.com/html/');u.searchParams.set('q',`${query} site:youtube.com/watch`);return parseLinks(await fetchText(u.toString(),'duckduckgo'),query,'DuckDuckGo/YouTube');}
  async function piped(base,query){const u=new URL('/search',base);u.searchParams.set('q',query);u.searchParams.set('filter','videos');const raw=await fetchText(u.toString(),'piped');try{const data=JSON.parse(raw);const items=Array.isArray(data)?data:(Array.isArray(data?.items)?data.items:[]);return items.map(x=>make(String(x?.videoId||String(x?.url||'').match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1]||''),x?.title,x?.uploaderName||x?.uploader,x?.thumbnail)).filter(Boolean);}catch{return parseLinks(raw,query,'Piped');}}
  async function invidious(base,query){const u=new URL('/api/v1/search',base);u.searchParams.set('q',query);u.searchParams.set('type','video');u.searchParams.set('region','IN');const raw=await fetchText(u.toString(),'invidious');try{const data=JSON.parse(raw);return(Array.isArray(data)?data:[]).filter(x=>!x.type||x.type==='video').map(x=>make(x.videoId,x.title,x.author,x.videoThumbnails?.[0]?.url)).filter(Boolean);}catch{return parseLinks(raw,query,'Invidious');}}

  function render(v){const b=document.createElement('button');b.type='button';b.className='jvc-card';b.dataset.jvcId=v.id;const img=document.createElement('img');img.loading='lazy';img.alt='';img.src=v.thumbnail||`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`;const meta=document.createElement('span');meta.className='video-meta';const title=document.createElement('strong');title.textContent=v.title;const channel=document.createElement('small');channel.textContent=v.channel;const play=document.createElement('b');play.textContent='▶';meta.append(title,channel);b.append(img,meta,play);return b;}
  function play(id){const d=dom(),videoId=ytId(id);if(!d.player||!videoId)return;trace('player:start',{id:videoId});d.player.replaceChildren();const iframe=document.createElement('iframe');iframe.className='jarvis-video-frame';iframe.src=`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;iframe.title='JARVIS YouTube Player';iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.style.width='100%';iframe.style.aspectRatio='16 / 9';iframe.style.minHeight='320px';iframe.style.border='0';d.player.appendChild(iframe);status('PLAYING · OFFICIAL YOUTUBE PLAYER');}

  async function search(query){
    query=String(query||'').trim();const d=dom();if(!query||!d.results)return;trace('search:start',{query,length:query.length});const direct=ytId(query);if(direct)return play(direct);d.results.replaceChildren();status('SEARCHING LIVE SOURCES · '+query.toUpperCase());
    const jobs=[youtube(query),bing(query),duck(query),...PIPED.map(x=>piped(x,query)),...INVIDIOUS.map(x=>invidious(x,query))];const settled=await Promise.allSettled(jobs);const results=[],seen=new Set();let providerCount=0;
    for(const s of settled){if(s.status!=='fulfilled')continue;providerCount++;for(const v of s.value||[]){if(!seen.has(v.id)){seen.add(v.id);results.push(v);}if(results.length>=12)break;}}
    trace('search:complete',{query,providers:providerCount,results:results.length,ids:results.map(x=>x.id)});
    if(!results.length){const box=document.createElement('div');box.className='media-degraded-state';const strong=document.createElement('strong');strong.textContent='NO LIVE VIDEO RESULTS';const small=document.createElement('small');small.textContent='No fabricated, cached or hardcoded videos are shown.';const link=document.createElement('a');link.href=`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;link.target='_blank';link.rel='noopener noreferrer';link.textContent='OPEN OFFICIAL YOUTUBE SEARCH ↗';box.append(strong,small,link);d.results.appendChild(box);status('DEGRADED · NO LIVE RESULTS');return;}
    d.results.replaceChildren(...results.slice(0,8).map(render));status(`READY · ${Math.min(results.length,8)} LIVE VIDEO RESULTS`);
  }

  function mount(){const d=dom();if(!d.input||!d.results||!d.player||d.input.dataset.jarvisMediaBound==='1')return;d.input.dataset.jarvisMediaBound='1';trace('mount',{input:true,search:!!d.search,results:true,player:true});d.search?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();search(d.input.value);},true);d.input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();search(d.input.value);}},true);d.results.addEventListener('click',e=>{const card=e.target.closest('.jvc-card[data-jvc-id]');if(card){e.preventDefault();e.stopImmediatePropagation();play(card.dataset.jvcId);}},true);const ready=document.createElement('div');ready.className='media-degraded-state';ready.textContent='READY · LIVE VIDEO SEARCH';d.results.replaceChildren(ready);status('READY · LIVE SEARCH');}
  new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
