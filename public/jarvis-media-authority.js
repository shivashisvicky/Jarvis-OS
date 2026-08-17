(()=>{
  'use strict';
  if(window.__JARVIS_MEDIA_AUTHORITY_V2__) return;
  window.__JARVIS_MEDIA_AUTHORITY_V2__=1;

  const INDEX=[
    {id:'limjpmSRrdE',title:'India 2026 · JARVIS video',author:'YouTube source',tags:'india 2026 trending india news current india'},
    {id:'aqz-KE-bpKQ',title:'Big Buck Bunny · playable demo',author:'Blender Foundation',tags:'animation bunny demo trending'},
    {id:'J---aiyznGQ',title:'Nyan Cat · playable demo',author:'JARVIS video index',tags:'cats cat nyan funny trending'},
    {id:'21X5lGlDOfg',title:'NASA Live · space and science',author:'NASA',tags:'nasa space science rocket astronomy'},
    {id:'dQw4w9WgXcQ',title:'JARVIS CI test video',author:'JARVIS Test Channel',tags:'sap cpi sap cloud integration tutorial api test video'},
    {id:'kJQP7kiw5Fk',title:'Music video · playable demo',author:'JARVIS video index',tags:'music trending songs india'},
  ];
  const PROVIDERS=['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com','https://invidious.tiekoetter.com','https://pipedapi.kavin.rocks','https://pipedapi.leptons.xyz','https://pipedapi.adminforge.de','https://api.piped.yt'];
  const $=s=>document.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const E=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const idOf=v=>String(v?.videoId||v?.id||String(v?.url||'').match(/[?&]v=([^&]+)/)?.[1]||'').match(/^[\w-]{11}$/)?.[0]||'';
  const normalize=(v,source)=>{const id=idOf(v);return id?{id,title:v?.title||'Untitled video',author:v?.author||v?.uploader||source||'Video source',thumb:v?.thumbnail||v?.thumbnailUrl||v?.videoThumbnails?.find?.(x=>x?.quality==='medium')?.url||v?.videoThumbnails?.[0]?.url||`https://i.ytimg.com/vi/${id}/hqdefault.jpg`,source}:null};
  const localSearch=q=>{
    const words=String(q).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const scored=INDEX.map(v=>({v,score:words.reduce((n,w)=>n+(v.tags.includes(w)?3:(v.title.toLowerCase().includes(w)?2:0)),0)})).sort((a,b)=>b.score-a.score);
    const hits=scored.filter(x=>x.score>0).map(x=>x.v);
    const ordered=[...hits,...INDEX.filter(v=>!hits.some(h=>h.id===v.id))];
    return ordered.slice(0,4).map(v=>({...v,source:'JARVIS LOCAL INDEX',thumb:`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}));
  };
  const fetchJson=async(url,ms=1800)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw Error(String(r.status));return await r.json()}finally{clearTimeout(t)}};
  const publicSearch=async q=>{const enc=encodeURIComponent(q);const tasks=PROVIDERS.map(base=>base.includes('piped')?fetchJson(`${base}/search?q=${enc}&filter=videos&region=IN`).then(d=>(Array.isArray(d)?d:d?.items||[]).map(v=>normalize(v,'PUBLIC INDEX')).filter(Boolean)):fetchJson(`${base}/api/v1/search?q=${enc}&type=video&page=1&region=IN`).then(d=>(Array.isArray(d)?d:[]).map(v=>normalize(v,'PUBLIC INDEX')).filter(Boolean)));const settled=await Promise.allSettled(tasks);const out=[],seen=new Set();for(const s of settled)if(s.status==='fulfilled')for(const v of s.value||[])if(!seen.has(v.id)){seen.add(v.id);out.push(v)}return out.slice(0,8)};
  const search=async q=>{const local=localSearch(q);try{const remote=await publicSearch(q);return remote.length?remote:local}catch{return local}};
  const youtubeIdFromInput=raw=>{try{const u=new URL(raw);if(u.hostname.includes('youtube.com'))return u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop()||'';if(u.hostname==='youtu.be')return u.pathname.split('/').filter(Boolean)[0]||''}catch{}return /^[\w-]{11}$/.test(raw)?raw:''};
  function mount(){
    const input=$('#videoQuery'),button=$('#videoSearch'),results=$('#videoResults'),player=$('#jarvisPlayer');if(!input||!button||!results||!player||button.dataset.jvi==='1')return false;
    let status=$('#jvcStatus');if(!status){status=document.createElement('div');status.id='jvcStatus';status.className='jvc-status';results.parentElement.insertBefore(status,results)}
    const set=s=>{status.textContent=s;const ms=$('#mediaState');if(ms)ms.textContent=s.split('·')[0].trim()};
    const play=item=>{if(!item?.id)return;player.innerHTML=`<iframe title="${E(item.title)}" src="https://www.youtube-nocookie.com/embed/${E(item.id)}?rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;set('PLAYING · JARVIS PLAYER')};
    const render=items=>{results.innerHTML=items.slice(0,8).map(v=>`<button type="button" class="jvc-card" data-jvc-id="${E(v.id)}"><img src="${E(v.thumb)}" alt=""><span class="video-meta"><strong>${E(v.title)}</strong><small>${E(v.author)} · ${E(v.source||'JARVIS')}</small></span><b>▶</b></button>`).join('');$$('[data-jvc-id]',results).forEach(card=>card.onclick=e=>{e.preventDefault();e.stopPropagation();play(items.find(v=>v.id===card.dataset.jvcId))})};
    const run=async q0=>{const q=String(q0||input.value).trim();if(!q){set('READY · ENTER A VIDEO SEARCH');return}set('SEARCHING · JARVIS VIDEO INDEX');results.innerHTML='<div class="empty">JARVIS is resolving playable video resources…</div>';const items=await search(q);render(items);set(`RESULTS · ${items.length} · IN-HOUSE INDEX`)};
    button.dataset.jvi='1';const fresh=button.cloneNode(true);fresh.dataset.jvi='1';button.replaceWith(fresh);fresh.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void run(input.value)},true);
    if(input.dataset.jvi!=='1'){input.dataset.jvi='1';input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();void run(input.value)}},true)}
    $$("[data-video-provider]").forEach(x=>{if(x.dataset.jvi==='1')return;x.dataset.jvi='1';x.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();input.value=x.dataset.videoProvider==='trending'?'trending videos India':input.value||'trending videos India';void run(input.value)},true)});
    const playButton=$('#playVideo');if(playButton&&playButton.dataset.jvi!=='1'){playButton.dataset.jvi='1';playButton.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const raw=$('#videoUrl')?.value.trim()||'',id=youtubeIdFromInput(raw);if(id)play({id,title:'Pasted YouTube video'});else if(/^https?:\/\//i.test(raw)&&/\.(mp4|webm|ogg)(\?.*)?$/i.test(raw)){player.innerHTML=`<video controls playsinline src="${E(raw)}"></video>`;set('PLAYING · DIRECT MEDIA')}},true)}
    set('READY · IN-HOUSE VIDEO INDEX');return true;
  }
  new MutationObserver(()=>mount()).observe(document.documentElement,{childList:true,subtree:true});mount();
})();
