/** J.A.R.V.I.S. OS 2.0 - FINAL MEDIA AUTHORITY */
(() => {
  'use strict';
  if (window.__JARVIS_FINAL_MEDIA_AUTHORITY__) return;
  window.__JARVIS_FINAL_MEDIA_AUTHORITY__ = true;

  const API_SEARCH = '/api/youtube-search?q=';
  const PEERTUBE = 'https://peertube.cpy.re';
  const TIMEOUT = 7000;
  let mounted = false;
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const dom = () => ({input:$('#videoQuery'),results:$('#videoResults'),player:$('#jarvisPlayer'),state:$('#mediaState')||$('#jvcStatus')});
  const state = (a,b='') => { const x=dom().state; if(x)x.textContent=b?`${a} · ${b}`:a; };
  const clear = x => { while(x?.firstChild)x.removeChild(x.firstChild); };
  const resultCard = (v) => { const b=document.createElement('button'); b.type='button'; b.className='jvc-card'; b.dataset.jvcId=v.id; b.dataset.jvcSource='YouTube'; const img=document.createElement('img'); img.loading='lazy'; img.src=v.thumbnail||''; img.alt=''; const meta=document.createElement('span'); meta.className='video-meta'; const title=document.createElement('strong'); title.textContent=v.title; const channel=document.createElement('small'); channel.textContent=v.channel||'YouTube'; meta.append(title,channel); const play=document.createElement('b'); play.textContent='▶'; b.append(img,meta,play); return b; };

  async function search(q){
    q=String(q||'').trim(); if(!q)return;
    const d=dom(); if(!d.results)return;
    clear(d.results); state('SEARCHING',q.toUpperCase());
    const loading=document.createElement('div'); loading.className='media-loading-indicator'; loading.textContent='SEARCHING YOUTUBE…'; d.results.append(loading);
    try{
      const c=new AbortController(); const timer=setTimeout(()=>c.abort(),TIMEOUT);
      const r=await fetch(API_SEARCH+encodeURIComponent(q),{signal:c.signal,cache:'no-store'}); clearTimeout(timer);
      const data=await r.json(); if(!r.ok)throw new Error(data?.error||'YouTube search failed');
      clear(d.results);
      if(!Array.isArray(data.results)||!data.results.length)throw new Error('No YouTube videos found');
      data.results.forEach(v=>d.results.append(resultCard(v)));
      state('READY',`${data.results.length} REAL YOUTUBE RESULTS`);
    }catch(e){ clear(d.results); const box=document.createElement('div'); box.className='media-degraded-state'; const strong=document.createElement('strong'); strong.textContent='VIDEO SEARCH UNAVAILABLE'; const small=document.createElement('small'); small.textContent=e instanceof Error?e.message:'Search failed'; box.append(strong,small); d.results.append(box); state('DEGRADED','NO FABRICATED RESULTS'); }
  }

  function play(id){ const d=dom(); if(!d.player||!id)return; clear(d.player); const iframe=document.createElement('iframe'); iframe.className='jarvis-video-frame'; iframe.title='JARVIS YouTube player'; iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen'; iframe.allowFullscreen=true; iframe.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0`; d.player.append(iframe); state('PLAYING','YOUTUBE'); }

  function mount(){ if(mounted)return; const d=dom(); if(!d.input||!d.results||!d.player)return; mounted=true;
    $('#videoSearch')?.addEventListener('click',e=>{e.preventDefault();search(d.input.value);});
    d.input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search(d.input.value);}});
    d.results.addEventListener('click',e=>{const card=e.target.closest('.jvc-card[data-jvc-id]');if(card)play(card.dataset.jvcId);});
    clear(d.results); const ready=document.createElement('div'); ready.className='media-degraded-state'; const s=document.createElement('strong'); s.textContent='READY'; const m=document.createElement('small'); m.textContent='Search for a video. No fixed results.'; ready.append(s,m); d.results.append(ready); state('READY','NO FIXED VIDEOS');
  }
  const timer=setInterval(()=>{mount();if(mounted)clearInterval(timer);},100); mount();
})();
