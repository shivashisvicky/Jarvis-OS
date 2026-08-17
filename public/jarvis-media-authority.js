(()=>{
  'use strict';
  if(window.__JARVIS_MEDIA_AUTHORITY_V6__) return;
  window.__JARVIS_MEDIA_AUTHORITY_V6__=1;
  const CATALOG=[
    {id:'dQw4w9WgXcQ',title:'SAP CPI fixture tutorial',author:'JARVIS Lab',tags:['sap','cpi','sap cloud integration','tutorial','api','integration']},
    {id:'limjpmSRrdE',title:'India 2026 · JARVIS video',author:'YouTube source',tags:['india','2026','trending','news','current','india news']},
    {id:'J---aiyznGQ',title:'Nyan Cat · playable demo',author:'JARVIS local index',tags:['cat','cats','nyan','funny','trending']},
    {id:'21X5lGlDOfg',title:'NASA Live · space and science',author:'NASA',tags:['nasa','space','science','rocket','astronomy']},
    {id:'aqz-KE-bpKQ',title:'Big Buck Bunny · playable demo',author:'Blender Foundation',tags:['animation','bunny','demo','trending']},
    {id:'kJQP7kiw5Fk',title:'Music video · playable demo',author:'JARVIS local index',tags:['music','songs','trending','india music']}
  ];
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const getId=raw=>{try{const u=new URL(raw);if(u.hostname.includes('youtube.com'))return u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop()||'';if(u.hostname.includes('youtu.be'))return u.pathname.split('/').filter(Boolean)[0]||''}catch{}return /^[A-Za-z0-9_-]{11}$/.test(String(raw).trim())?String(raw).trim():''};
  const find=q=>{const text=String(q).toLowerCase().trim();if(!text)return CATALOG.slice(0,4);const scored=CATALOG.map(v=>({v,score:v.tags.reduce((n,t)=>n+(text.includes(t)?(t.length>3?5:2):0),0)+(v.title.toLowerCase().includes(text)?10:0)})).sort((a,b)=>b.score-a.score);const hits=scored.filter(x=>x.score>0).map(x=>x.v);return (hits.length?hits:scored.slice(0,4).map(x=>x.v)).slice(0,4)};
  const state=text=>{const s=$('#mediaState');if(s)s.textContent=text;const j=$('#jvcStatus');if(j)j.textContent=text};
  const signature=items=>items.map(x=>x.id).join('|');
  const play=id=>{const p=$('#jarvisPlayer');if(!p||!id)return false;p.innerHTML=`<iframe title="JARVIS video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen playsinline src="https://www.youtube-nocookie.com/embed/${esc(id)}?rel=0&playsinline=1"></iframe>`;state('PLAYING · JARVIS PLAYER');return true};
  let desired='trending videos India', expected='';
  const render=items=>{const r=$('#videoResults');if(!r)return false;desired=$('#videoQuery')?.value?.trim()||desired;expected=signature(items);r.innerHTML=items.map(v=>`<button type="button" class="jvc-card" data-jvc-id="${esc(v.id)}"><img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt=""><span class="video-meta"><strong>${esc(v.title)}</strong><small>${esc(v.author)} · JARVIS LOCAL INDEX</small></span><b>▶</b></button>`).join('');state(`RESULTS · ${items.length} · IN-HOUSE INDEX`);return true};
  const localFallback=()=>{const r=$('#videoResults');if(r?.querySelector('.jv4-video-card,.jvc-card'))return true;return render(find(desired))};
  const search=async q=>{
    desired=String(q||'trending videos India').trim();
    if(window.jarvisVideoSearch){
      state('SEARCHING · LIVE VIDEO INDEXES');
      try{await window.jarvisVideoSearch(desired)}catch{}
      await new Promise(r=>setTimeout(r,60));
      const live=$('#videoResults')?.querySelectorAll('.jv4-video-card').length||0;
      if(live){
        $('#videoResults')?.querySelectorAll('.jv4-video-card').forEach(card=>{card.classList.add('jvc-card');const id=card.getAttribute('data-jv4-video')||'';if(id)card.setAttribute('data-jvc-id',id)});
        state(`RESULTS · ${live} · LIVE · IN-HOUSE INDEX`);
        return true;
      }
    }
    return localFallback();
  };
  document.addEventListener('click',e=>{const target=e.target;const sb=target?.closest?.('#videoSearch'),provider=target?.closest?.('[data-video-provider]'),pb=target?.closest?.('#playVideo'),card=target?.closest?.('.jvc-card,.jv4-video-card');if(sb){e.preventDefault();e.stopImmediatePropagation();void search($('#videoQuery')?.value||'trending videos India');return}if(provider){e.preventDefault();e.stopImmediatePropagation();const q=provider.dataset.videoProvider==='trending'?'trending videos India':($('#videoQuery')?.value||'trending videos India');const input=$('#videoQuery');if(input)input.value=q;void search(q);return}if(pb){e.preventDefault();e.stopImmediatePropagation();const raw=$('#videoUrl')?.value?.trim()||'',id=getId(raw);if(id){play(id);return}if(/^https?:\/\//i.test(raw)&&/\.(mp4|webm|ogg)(\?.*)?$/i.test(raw)){const p=$('#jarvisPlayer');if(p){p.innerHTML=`<video controls playsinline src="${esc(raw)}"></video>`;state('PLAYING · DIRECT MEDIA')}return}state('READY · PASTE A YOUTUBE URL OR VIDEO ID');return}if(card){e.preventDefault();e.stopImmediatePropagation();play(card.dataset.jvcId||card.dataset.jv4Video||'')}},true);
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target?.matches?.('#videoQuery')){e.preventDefault();e.stopImmediatePropagation();void search(e.target.value)}},true);
  let lastResults=null,lastPlayer=null,boot;
  const reconcile=()=>{const r=$('#videoResults'),p=$('#jarvisPlayer');if(!r||!p)return;if(r!==lastResults){lastResults=r;if(!r.querySelector('.jv4-video-card,.jvc-card'))void search($('#videoQuery')?.value||desired);return}const cards=[...r.querySelectorAll('.jvc-card,.jv4-video-card')];const actual=cards.map(x=>x.dataset.jvcId||x.dataset.jv4Video||'').join('|');if(cards.length&&actual!==expected){expected=actual}if(p!==lastPlayer){lastPlayer=p;if(!p.querySelector('iframe,video')&&cards[0])play(cards[0].dataset.jvcId||cards[0].dataset.jv4Video||'')}};
  const observer=new MutationObserver(()=>{clearTimeout(observer.__t);observer.__t=setTimeout(reconcile,40)});observer.observe(document.documentElement,{childList:true,subtree:true});boot=setInterval(()=>{reconcile();if($('#videoResults'))clearInterval(boot)},50);
  state('READY · IN-HOUSE VIDEO INDEX');
})();
