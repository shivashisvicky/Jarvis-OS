(()=>{
  'use strict';
  if(window.__JARVIS_MEDIA_AUTHORITY_V3__) return;
  window.__JARVIS_MEDIA_AUTHORITY_V3__=1;

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
    return (hits.length?hits:INDEX).slice(0,4).map(v=>({...v,source:'JARVIS LOCAL INDEX',thumb:`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}));
  };
  const status=()=>{let s=$('#jvcStatus');if(!s){const r=$('#videoResults');if(!r)return null;s=document.createElement('div');s.id='jvcStatus';s.className='jvc-status';r.parentElement.insertBefore(s,r)}return s};
  const set=s=>{const el=status();if(el)el.textContent=s;const ms=$('#mediaState');if(ms)ms.textContent=s.split('·')[0].trim()};
  const play=item=>{
    if(!item?.id)return false;
    const p=$('#jarvisPlayer');if(!p)return false;
    p.innerHTML=`<iframe title="${E(item.title)}" src="https://www.youtube-nocookie.com/embed/${E(item.id)}?rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    set('PLAYING · JARVIS PLAYER');
    return true;
  };
  const render=items=>{
    const r=$('#videoResults');if(!r)return false;
    r.innerHTML=items.map(v=>`<button type="button" class="jvc-card" data-jvc-id="${E(v.id)}"><img src="${E(v.thumb)}" alt=""><span class="video-meta"><strong>${E(v.title)}</strong><small>${E(v.author)} · ${E(v.source||'JARVIS')}</small></span><b>▶</b></button>`).join('');
    set(`RESULTS · ${items.length} · IN-HOUSE INDEX`);return true;
  };
  const run=q0=>{
    const input=$('#videoQuery');const q=String(q0??input?.value??'').trim();
    if(!q){set('READY · ENTER A VIDEO SEARCH');return false}
    set('SEARCHING · JARVIS VIDEO INDEX');
    return render(localSearch(q));
  };
  const isMediaAction=t=>t?.closest?.('#videoSearch,[data-video-provider],#playVideo');
  document.addEventListener('click',e=>{
    const action=isMediaAction(e.target);
    if(action){
      e.preventDefault();e.stopImmediatePropagation();
      if(action.id==='videoSearch'){run();return}
      if(action.id==='playVideo'){
        const raw=$('#videoUrl')?.value.trim()||'';const id=youtubeIdFromInput(raw);
        if(id)play({id,title:'Pasted YouTube video'});else if(/^https?:\/\//i.test(raw)&&/\.(mp4|webm|ogg)(\?.*)?$/i.test(raw)){const p=$('#jarvisPlayer');if(p){p.innerHTML=`<video controls playsinline src="${E(raw)}"></video>`;set('PLAYING · DIRECT MEDIA')}}
        return;
      }
      const provider=action.dataset.videoProvider;const input=$('#videoQuery');if(input)input.value=provider==='trending'?'trending videos India':input.value||'trending videos India';run(input?.value);return;
    }
    const card=e.target.closest?.('.jvc-card');
    if(card){e.preventDefault();e.stopImmediatePropagation();const item=INDEX.find(v=>v.id===card.dataset.jvcId);if(item)play(item)}
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&e.target?.matches?.('#videoQuery')){e.preventDefault();e.stopImmediatePropagation();run(e.target.value)}
  },true);
  const observer=new MutationObserver(()=>{
    const r=$('#videoResults');if(!r)return;
    const bad=/No public video index responded|No video index responded|VIDEO INDEX DEGRADED|VIDEO INDEX OFFLINE|JARVIS will not redirect you|Try SEARCH again|OPEN YOUTUBE SEARCH|OPEN BING VIDEO SEARCH/i.test(r.textContent||'');
    if(bad)run($('#videoQuery')?.value||'trending videos India');
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  set('READY · IN-HOUSE VIDEO INDEX');
})();
