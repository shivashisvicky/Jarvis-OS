(() => {
  'use strict';
  const INVIDIOUS=['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com','https://invidious.tiekoetter.com'];
  const PIPED=['https://pipedapi.kavin.rocks','https://pipedapi.leptons.xyz','https://pipedapi.adminforge.de','https://api.piped.yt'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const findId=v=>String(v.videoId||String(v.url||'').match(/[?&]v=([^&]+)/)?.[1]||'');
  const json=async url=>{const r=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});if(!r.ok)throw Error(String(r.status));return r.json()};
  const normalize=items=>items.map(v=>({id:findId(v),title:v.title||'Untitled video',author:v.author||v.uploader||'Unknown channel',views:Number(v.viewCount||v.views||0),published:v.publishedText||v.uploadedDate||'',thumb:v.videoThumbnails?.find(x=>x.quality==='medium')?.url||v.videoThumbnails?.[0]?.url||v.thumbnail||''})).filter(v=>v.id);
  async function search(q){
    for(const base of INVIDIOUS){try{const d=await json(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=1`);const x=normalize(Array.isArray(d)?d.filter(v=>v.type==='video'||v.videoId):[]);if(x.length)return x;}catch{}}
    for(const base of PIPED){try{const d=await json(`${base}/search?q=${encodeURIComponent(q)}&filter=videos`);const x=normalize(Array.isArray(d)?d:(d.items||[]));if(x.length)return x;}catch{}}
    return [];
  }
  function install(){
    const input=document.querySelector('#videoQuery'), button=document.querySelector('#videoSearch'), results=document.querySelector('#videoResults'), player=document.querySelector('#jarvisPlayer');
    if(!input||!button||!results||!player||input.dataset.finalMedia==='1')return;
    input.dataset.finalMedia='1';
    let status=document.querySelector('#jvcStatus');
    if(!status){status=document.createElement('div');status.id='jvcStatus';status.className='jvc-status';results.parentElement.insertBefore(status,results);}
    const set=s=>{status.textContent=s;const ms=document.querySelector('#mediaState');if(ms)ms.textContent=s.split('·')[0].trim();};
    const play=id=>{player.innerHTML=`<iframe title="JARVIS video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1"></iframe>`;set('PLAYING · IN-HOUSE PLAYER');};
    const render=items=>{results.innerHTML=items.slice(0,8).map(v=>`<button class="jvc-card" data-id="${esc(v.id)}"><img src="${esc(v.thumb)}" alt=""><span class="video-meta"><strong>${esc(v.title)}</strong><small>${esc(v.author)}${v.views?' · '+v.views.toLocaleString()+' views':''}</small><small>${esc(v.published)}</small></span><b>▶</b></button>`).join('');results.querySelectorAll('.jvc-card').forEach(b=>b.onclick=()=>play(b.dataset.id));};
    const run=async()=>{const q=input.value.trim();if(!q){set('READY · ENTER A VIDEO SEARCH TERM');return;}set('SEARCHING · JARVIS INDEX');results.innerHTML='<div class="empty">JARVIS is searching video indexes…</div>';const items=await search(q);if(items.length){render(items);set('RESULTS · '+items.length+' · IN-HOUSE');}else{results.innerHTML='<div class="video-context"><strong>No public video index responded with results</strong><p>JARVIS will not redirect you. Try SEARCH again or paste a video URL.</p></div>';set('NO REDIRECT');}};
    const fresh=button.cloneNode(true);button.replaceWith(fresh);fresh.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void run();},true);
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();void run();}},true);
    document.querySelectorAll('[data-video-provider]').forEach(x=>{const b=x.cloneNode(true);x.replaceWith(b);b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(b.dataset.videoProvider==='trending'){input.value='trending videos India';}void run();},true);});
    set('READY · IN-HOUSE VIDEO SEARCH');
  }
  const observer=new MutationObserver(()=>install());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  install();
})();
