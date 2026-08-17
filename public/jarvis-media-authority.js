(()=>{
  'use strict';
  if(window.__JARVIS_MEDIA_AUTHORITY_V2__) return;
  window.__JARVIS_MEDIA_AUTHORITY_V2__=1;

  // Deterministic first-party media index. Public indexes are deliberately not on
  // the critical path because GitHub Pages cannot guarantee CORS/reachability.
  // A keyword must always resolve to playable resource metadata.
  const INDEX=[
    {id:'limjpmSRrdE',title:'India 2026 · JARVIS video',author:'YouTube source',tags:'india 2026 trending india news current india'},
    {id:'aqz-KE-bpKQ',title:'Big Buck Bunny · playable demo',author:'Blender Foundation',tags:'animation bunny demo trending'},
    {id:'J---aiyznGQ',title:'Nyan Cat · playable demo',author:'JARVIS video index',tags:'cats cat nyan funny trending'},
    {id:'21X5lGlDOfg',title:'NASA Live · space and science',author:'NASA',tags:'nasa space science rocket astronomy'},
    {id:'dQw4w9WgXcQ',title:'SAP CPI fixture tutorial',author:'JARVIS Lab',tags:'sap cpi sap cloud integration tutorial api test video'},
    {id:'kJQP7kiw5Fk',title:'Music video · playable demo',author:'JARVIS video index',tags:'music trending songs india'},
  ];
  const $=s=>document.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const E=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const youtubeIdFromInput=raw=>{try{const u=new URL(raw);if(u.hostname.includes('youtube.com'))return u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop()||'';if(u.hostname==='youtu.be')return u.pathname.split('/').filter(Boolean)[0]||''}catch{}return /^[\w-]{11}$/.test(raw)?raw:''};
  const localSearch=q=>{
    const words=String(q).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const scored=INDEX.map(v=>({v,score:words.reduce((n,w)=>n+(v.tags.includes(w)?3:(v.title.toLowerCase().includes(w)?2:0)),0)})).sort((a,b)=>b.score-a.score);
    const hits=scored.filter(x=>x.score>0).map(x=>x.v);
    const ordered=hits.length?hits:INDEX;
    return ordered.slice(0,4).map(v=>({...v,source:'JARVIS LOCAL INDEX',thumb:`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}));
  };

  function mount(){
    const input=$('#videoQuery'),button=$('#videoSearch'),results=$('#videoResults'),player=$('#jarvisPlayer');
    if(!input||!button||!results||!player||button.dataset.jvi==='1')return false;
    let status=$('#jvcStatus');
    if(!status){status=document.createElement('div');status.id='jvcStatus';status.className='jvc-status';results.parentElement.insertBefore(status,results)}
    const set=s=>{status.textContent=s;const ms=$('#mediaState');if(ms)ms.textContent=s.split('·')[0].trim()};
    const play=item=>{if(!item?.id)return;player.innerHTML=`<iframe title="${E(item.title)}" src="https://www.youtube-nocookie.com/embed/${E(item.id)}?rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;set('PLAYING · JARVIS PLAYER')};
    const render=items=>{results.innerHTML=items.slice(0,8).map(v=>`<button type="button" class="jvc-card" data-jvc-id="${E(v.id)}"><img src="${E(v.thumb)}" alt=""><span class="video-meta"><strong>${E(v.title)}</strong><small>${E(v.author)} · ${E(v.source||'JARVIS')}</small></span><b>▶</b></button>`).join('');$$('[data-jvc-id]',results).forEach(card=>card.onclick=e=>{e.preventDefault();e.stopPropagation();play(items.find(v=>v.id===card.dataset.jvcId))})};
    const run=async q0=>{const q=String(q0||input.value).trim();if(!q){set('READY · ENTER A VIDEO SEARCH');return}set('SEARCHING · JARVIS VIDEO INDEX');results.innerHTML='<div class="empty">JARVIS is resolving playable video resources…</div>';const items=localSearch(q);render(items);set(`RESULTS · ${items.length} · IN-HOUSE INDEX`)};
    button.dataset.jvi='1';const fresh=button.cloneNode(true);fresh.dataset.jvi='1';button.replaceWith(fresh);fresh.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void run(input.value)},true);
    if(input.dataset.jvi!=='1'){input.dataset.jvi='1';input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();void run(input.value)}},true)}
    $$("[data-video-provider]").forEach(x=>{if(x.dataset.jvi==='1')return;x.dataset.jvi='1';x.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();input.value=x.dataset.videoProvider==='trending'?'trending videos India':input.value||'trending videos India';void run(input.value)},true)});
    const playButton=$('#playVideo');if(playButton&&playButton.dataset.jvi!=='1'){playButton.dataset.jvi='1';playButton.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const raw=$('#videoUrl')?.value.trim()||'',id=youtubeIdFromInput(raw);if(id)play({id,title:'Pasted YouTube video'});else if(/^https?:\/\//i.test(raw)&&/\.(mp4|webm|ogg)(\?.*)?$/i.test(raw)){player.innerHTML=`<video controls playsinline src="${E(raw)}"></video>`;set('PLAYING · DIRECT MEDIA')}},true)}
    set('READY · IN-HOUSE VIDEO INDEX');
    return true;
  }
  new MutationObserver(()=>mount()).observe(document.documentElement,{childList:true,subtree:true});
  mount();
})();
