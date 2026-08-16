(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const PIPED = [
    'https://pipedapi.kavin.rocks','https://pipedapi.leptons.xyz','https://pipedapi.nosebs.ru',
    'https://piped-api.privacy.com.de','https://pipedapi.adminforge.de','https://api.piped.yt',
    'https://pipedapi.drgns.space','https://pipedapi.owo.si','https://pipedapi.rivo.lol'
  ];

  function css(){
    if($('#jv2-css')) return;
    const s=document.createElement('style'); s.id='jv2-css'; s.textContent=`
      .jv2-console{margin:0 0 22px;padding:22px;border:1px solid rgba(126,205,255,.2);border-radius:18px;background:linear-gradient(135deg,rgba(10,24,36,.96),rgba(3,9,14,.98));box-shadow:0 18px 60px rgba(0,0,0,.2)}
      .jv2-console .jmc-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.jv2-console .jmc-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:18px}.jv2-console .jmc-action{min-height:78px;text-align:left;padding:13px;border:1px solid rgba(126,205,255,.14);border-radius:12px;background:rgba(255,255,255,.025);color:inherit;cursor:pointer}.jv2-console .jmc-action:hover{border-color:#55d6ff;background:rgba(85,214,255,.06);transform:translateY(-1px)}.jv2-console .jmc-index{color:#65d8ff;font:700 11px ui-monospace,monospace}.jv2-console .jmc-action b{display:block;font-size:12px;letter-spacing:.06em}.jv2-console .jmc-action small{display:block;margin-top:5px;color:#7895a4;line-height:1.35}
      .jv2-answer{margin-top:14px;padding:16px;border:1px solid rgba(126,205,255,.16);border-radius:14px;background:rgba(2,8,14,.78);line-height:1.55}.jv2-answer h3{margin:0 0 8px}.jv2-answer .meta{margin-top:9px;color:#7895a4;font-size:11px}.jv2-answer a{color:#77defb}
      .jvc-status{margin:10px 0;padding:10px 12px;border:1px solid rgba(126,205,255,.13);border-radius:10px;color:#8fb2bf;font:600 10px ui-monospace,monospace;letter-spacing:.08em}.jvc-grid{display:grid;gap:9px}.jvc-card{display:grid;grid-template-columns:130px 1fr auto;gap:10px;align-items:center;text-align:left;width:100%;padding:7px;border:1px solid rgba(126,205,255,.12);border-radius:12px;background:rgba(3,11,17,.9);color:inherit;cursor:pointer}.jvc-card:hover{border-color:#55d6ff;background:rgba(85,214,255,.05)}.jvc-card img{width:130px;height:74px;object-fit:cover;border-radius:7px;background:#02070a}.jvc-card strong{display:block;font-size:12px;line-height:1.3}.jvc-card small{display:block;color:#718e9b;margin-top:5px;font-size:10px}.jvc-card .play{font-size:15px;color:#66dfff;padding:7px}.jvc-player{min-height:260px;border:1px solid rgba(126,205,255,.2);border-radius:14px;overflow:hidden;background:#000}.jvc-player iframe,.jvc-player video{display:block;width:100%;height:min(62vh,560px);border:0;background:#000}.jvc-player .empty{min-height:260px;display:grid;place-items:center;text-align:center;color:#7895a4;padding:24px}
      .jv2-map{height:520px;min-height:420px;overflow:hidden;border-radius:15px;background:#071017}.jv2-map iframe{width:100%;height:100%;border:0;display:block}.jv2-place-list{display:grid;gap:7px;margin-top:10px}.jv2-place{padding:10px;text-align:left;border:1px solid rgba(126,205,255,.12);border-radius:10px;background:#07131b;color:#c9f5ff;cursor:pointer}.jv2-place:hover{border-color:#55d6ff}.jv2-news-text{display:grid;gap:9px;padding:12px}.jv2-news-text article{padding:12px;border:1px solid rgba(126,205,255,.1);border-radius:11px;background:rgba(3,11,17,.72)}.jv2-news-text h3{margin:0;font-size:13px;line-height:1.4}.jv2-news-text p{margin:7px 0 0;color:#9bb0ba;font-size:11px;line-height:1.5}.jv2-news-text a{color:#69d9ff;font-size:10px}
      .jv2-pad{display:grid;grid-template-columns:repeat(3,52px);gap:7px;justify-content:center;margin:12px auto}.jv2-pad button{width:52px;height:46px;border:1px solid #2b6178;background:#071923;color:#c9f5ff;border-radius:10px;font-size:20px;touch-action:manipulation}.jv2-pad .blank{visibility:hidden}.jv2-help{text-align:center;color:#7895a4;font-size:10px;margin-top:7px}
      @media(max-width:800px){.jv2-console .jmc-actions{grid-template-columns:1fr 1fr}.jvc-card{grid-template-columns:96px 1fr auto}.jvc-card img{width:96px;height:56px}.jv2-map{height:430px}}
      @media(max-width:520px){.jv2-console .jmc-head{display:block}.jv2-console .jmc-actions{grid-template-columns:1fr}.jvc-card{grid-template-columns:88px 1fr}.jvc-card img{width:88px;height:52px}.jvc-card .play{grid-column:2;justify-self:start}}
    `; document.head.appendChild(s);
  }

  function clickApp(id){ const b=$(`button.nav[data-app="${id}"]`); if(b){b.click();return true} return false; }

  function ensureMission(){
    const home=$('.command-center'); if(!home)return;
    let old=$('.jarvis-mission-console');
    if(old && !$('.jmc-action',old)){ old.remove(); old=null; }
    if(old)return;
    const el=document.createElement('section'); el.className='jarvis-mission-console jv2-console panel'; el.setAttribute('aria-label','JARVIS intelligence core');
    el.innerHTML=`<div class="jmc-head"><div><p class="eyebrow">JARVIS / ORCHESTRATION</p><h2>JARVIS INTELLIGENCE CORE</h2><p class="sub">What should JARVIS work on?</p></div><div class="jmc-status">● READY · LOCAL-FIRST</div></div><div class="jmc-actions">
      <button class="jmc-action" data-jv2-intent="news" type="button"><span class="jmc-index">01</span><b>TODAY'S SIGNAL</b><small>Read a concise live intelligence brief</small></button>
      <button class="jmc-action" data-jv2-intent="media" type="button"><span class="jmc-index">02</span><b>FIND VIDEO</b><small>Search and play media without leaving JARVIS</small></button>
      <button class="jmc-action" data-jv2-intent="research" type="button"><span class="jmc-index">03</span><b>RESEARCH</b><small>Ask the central search layer a question</small></button>
      <button class="jmc-action" data-jv2-intent="api" type="button"><span class="jmc-index">04</span><b>ENGINEERING</b><small>Open the API engineering workspace</small></button>
    </div>`;
    home.insertBefore(el, $('.command-surface',home)||home.firstChild);
    $$('[data-jv2-intent]',el).forEach(b=>b.addEventListener('click',()=>{
      const k=b.dataset.jv2Intent;
      if(k==='media')clickApp('media'); else if(k==='api')clickApp('api'); else if(k==='research'){clickApp('web');}
      else { const i=$('#commandInput'); if(i){i.value='latest AI and technology news'; $('#commandForm')?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));} }
    }));
  }

  async function knowledgeSearch(query){
    const q=query.trim();
    let answer='',source='';
    try{const r=await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,{cache:'no-store'});if(r.ok){const d=await r.json();answer=d.AbstractText||d.Answer||d.Definition||'';source=d.AbstractURL||'';}}catch{}
    if(!answer){try{const r=await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/\s+/g,'_'))}`,{cache:'no-store'});if(r.ok){const d=await r.json();answer=d.extract||'';source=d.content_urls?.desktop?.page||'';}}catch{}}
    return {answer,source};
  }

  async function centralSearch(raw){
    let q=String(raw||'').trim(); if(!q)return;
    q=q.replace(/^(search|look up|find|ask jarvis|tell me about)\s+/i,'').trim();
    const low=q.toLowerCase();
    if(/\b(video|videos|youtube|movie|movies)\b/.test(low)){clickApp('media');await sleep(150);const i=$('#videoQuery');if(i){i.value=q;$('#videoSearch')?.click();}return;}
    if(/\b(map|maps|navigate|location|directions)\b/.test(low)){clickApp('maps');await sleep(150);const i=$('#mapQuery');if(i){i.value=q.replace(/\b(show|open|find|maps?|navigate|location|directions)\b/gi,'').trim()||'Jagannath Nagar, Bhubaneswar';$('#mapSearch')?.click();}return;}
    if(/\b(news|headlines|latest)\b/.test(low)){renderNews(q);return;}
    const home=$('.command-center');if(!home)return;
    let box=$('#jv2-answer');if(!box){box=document.createElement('section');box.id='jv2-answer';box.className='jv2-answer';($('.command-surface',home)||home).appendChild(box);}
    box.innerHTML='<strong>JARVIS is searching its knowledge layer…</strong><div class="meta">Local command → knowledge index → internet fallback</div>';
    const r=await knowledgeSearch(q);
    if(r.answer){box.innerHTML=`<h3>${esc(q)}</h3><div>${esc(r.answer)}</div>${r.source?`<div class="meta">Source: <a href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">${esc(r.source)}</a></div>`:''}`;return;}
    box.innerHTML=`<h3>No local answer found</h3><div>JARVIS could not resolve that request internally. The internet fallback is ready.</div><div class="meta"><button id="jv2-web-fallback" class="primary" type="button">SEARCH THE INTERNET</button></div>`;
    $('#jv2-web-fallback')?.addEventListener('click',()=>window.open(`https://search.brave.com/search?q=${encodeURIComponent(q)}`,'_blank','noopener,noreferrer'));
  }

  function interceptCommand(){
    document.addEventListener('submit',e=>{
      const form=e.target?.closest?.('#commandForm');if(!form)return;
      const input=$('#commandInput',form),q=input?.value?.trim()||'';if(!q)return;
      if(/^(open|launch|go to)\s+(maps|media|api|sftp|files|notes|calculator|arcade|search|settings)$/i.test(q))return;
      if(/^(search|look up|find|ask jarvis|tell me|what is|who is|where is|how|why|latest|news|show me)\b/i.test(q)){e.preventDefault();e.stopImmediatePropagation();void centralSearch(q);}
    },true);
  }

  function normalizeMaps(){
    const w=$('.maps-workspace');if(!w||w.dataset.jv2==='1')return;w.dataset.jv2='1';
    const frame=$('#mapFrame',w);const q=$('#mapQuery',w);const results=$('#mapResults',w);if(!frame||!q||!results)return;
    frame.classList.add('jv2-map');
    const render=(lat,lon,zoom=15)=>{const d=.045/Math.pow(2,Math.max(0,zoom-12));frame.innerHTML=`<iframe title="JARVIS OpenStreetMap" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-d},${lat-d},${lon+d},${lat+d}&layer=mapnik&marker=${lat},${lon}"></iframe>`;};
    render(20.2961,85.8245,12);
    const geocode=async term=>{
      const clean=term.trim();if(!clean)return;
      const variants=[clean,`${clean}, Bhubaneswar, Odisha, India`,`${clean}, Bhubaneswar, Odisha, 751001, India`,`${clean}, Odisha, India`];
      let places=[];
      for(const v of variants){try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=10&addressdetails=1&countrycodes=in&q=${encodeURIComponent(v)}`,{headers:{Accept:'application/json'},cache:'no-store'});if(r.ok){const d=await r.json();if(d.length){places=d;break}}}catch{}}
      if(!places.length){results.innerHTML='<div class="empty">No place found. Try “Jagannath Nagar, Bhubaneswar” or “GGP Colony, Bhubaneswar”.</div>';return;}
      results.classList.add('jv2-place-list');results.innerHTML=places.map((p,i)=>`<button type="button" class="jv2-place" data-place="${i}"><strong>${esc(p.display_name.split(',').slice(0,2).join(', '))}</strong><small>${esc(p.display_name)}</small></button>`).join('');
      const select=p=>render(Number(p.lat),Number(p.lon),16);$$('[data-place]',results).forEach(b=>b.onclick=()=>select(places[Number(b.dataset.place)]));select(places[0]);
    };
    const doSearch=()=>void geocode(q.value);$('#mapSearch',w)?.addEventListener('click',doSearch);q.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doSearch()}});
    $('#locateMe',w)?.addEventListener('click',()=>navigator.geolocation?.getCurrentPosition(p=>{q.value=`${p.coords.latitude}, ${p.coords.longitude}`;doSearch()},()=>{results.innerHTML='<div class="empty">Location permission was not granted.</div>'}));
  }

  async function piped(path){
    let last=null;
    for(const base of PIPED){try{const c=new AbortController(),t=setTimeout(()=>c.abort(),5000);const r=await fetch(base+path,{signal:c.signal,headers:{Accept:'application/json'},cache:'no-store'});clearTimeout(t);if(!r.ok)throw new Error(`${r.status}`);return await r.json()}catch(e){last=e}}
    throw last||new Error('Video index unavailable');
  }
  function videoId(raw){try{const u=new URL(raw);if(u.hostname.includes('youtu.be'))return u.pathname.split('/').filter(Boolean)[0]||null;if(u.hostname.includes('youtube.com'))return u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop()||null}catch{}return /^[A-Za-z0-9_-]{11}$/.test(raw.trim())?raw.trim():null;}
  function youtubePlayer(id){const p=$('#jarvisPlayer');if(!p)return;p.className='jvc-player';p.innerHTML=`<iframe title="JARVIS YouTube player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" src="https://www.youtube.com/embed/${encodeURIComponent(id)}?playsinline=1&origin=${encodeURIComponent(location.origin)}"></iframe>`;}
  async function playVideo(id,title){const p=$('#jarvisPlayer'),st=$('#jvcStatus');if(!p)return;p.className='jvc-player';p.innerHTML='<div class="empty">Resolving a browser-playable stream…</div>';if(st)st.textContent='RESOLVING STREAM';
    try{const d=await piped(`/streams/${encodeURIComponent(id)}`);const streams=(d.videoStreams||[]).filter(x=>x&&x.url&&!x.videoOnly&&/^video\//i.test(x.mimeType||'')).sort((a,b)=>(b.height||0)-(a.height||0));const s=streams[0];if(s?.url){p.innerHTML=`<video controls playsinline preload="metadata" poster="${esc(d.thumbnailUrl||'')}"><source src="${esc(s.url)}" type="${esc(s.mimeType||'video/mp4')}"></video>`;const v=$('video',p);v?.play?.().catch(()=>{});if(st)st.textContent=`PLAYING · ${esc(title||d.title||'VIDEO')}`;return;}}
    catch{}
    youtubePlayer(id);if(st)st.textContent=`PLAYING · ${esc(title||'YOUTUBE PLAYER')}`;
  }
  function renderVideos(items){
    const r=$('#videoResults');if(!r)return;
    r.className='jvc-grid';r.innerHTML=items.slice(0,10).map(v=>{const id=String(v.videoId||v.id||'');return `<button type="button" class="jvc-card" data-video-id="${esc(id)}"><img loading="lazy" src="${esc(v.thumbnail||v.thumbnailUrl||`https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg`)}" alt=""><span><strong>${esc(v.title||'Untitled video')}</strong><small>${esc(v.uploader||v.author||'YouTube')} ${v.views?`· ${Number(v.views).toLocaleString()} views`:''}</small></span><span class="play">▶</span></button>`}).join('')||'<div class="empty">No video matches found.</div>';
    $$('.jvc-card',r).forEach(b=>b.onclick=()=>void playVideo(b.dataset.videoId,b.querySelector('strong')?.textContent||'JARVIS Video'));
  }
  async function videoSearch(q){
    const data=await piped(`/search?q=${encodeURIComponent(q)}&filter=videos`);const raw=Array.isArray(data)?data:(data.items||[]);return raw.map(v=>({videoId:v.videoId||String(v.url||'').match(/[?&]v=([^&]+)/)?.[1]||'',title:v.title,thumbnail:v.thumbnail,uploader:v.uploader,views:v.views})).filter(v=>v.videoId&&v.title).slice(0,10);
  }
  async function normalizeMedia(){
    const w=$('.media-workspace');if(!w||w.dataset.jv2==='1')return;w.dataset.jv2='1';
    const input=$('#videoQuery',w),results=$('#videoResults',w),player=$('#jarvisPlayer',w);if(!input||!results||!player)return;
    player.className='jvc-player';
    let st=$('#jvcStatus',w);if(!st){st=document.createElement('div');st.id='jvcStatus';st.className='jvc-status';results.before(st)}st.textContent='READY · IN-HOUSE VIDEO SEARCH';
    const search=async()=>{const q=input.value.trim();if(!q){st.textContent='READY · ENTER A VIDEO SEARCH';return}st.textContent='SEARCHING · JARVIS VIDEO INDEX';results.innerHTML='<div class="jvc-status">Querying multiple video indexes…</div>';try{const items=await videoSearch(q);renderVideos(items);st.textContent=`${items.length} RESULTS · STAYING INSIDE JARVIS`;}catch{results.innerHTML='<div class="jvc-status">Video index temporarily unavailable. JARVIS will not redirect you. Try again in a moment or paste a YouTube URL below.</div>';st.textContent='VIDEO INDEX DEGRADED';}};
    const btn=$('#videoSearch',w);if(btn)btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void search()},true);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void search()}});
    const play=$('#playVideo',w);play?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const raw=$('#videoUrl',w)?.value?.trim()||'';const id=videoId(raw);if(id)void playVideo(id,'Pasted video');else if(/^https?:\/\//.test(raw)){player.innerHTML=`<video controls playsinline src="${esc(raw)}"></video>`;st.textContent='PLAYING · DIRECT MEDIA'}else st.textContent='PASTE A YOUTUBE URL OR 11-CHARACTER VIDEO ID'},true);
    $$('.media-search-links [data-video-provider]',w).forEach(b=>{b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(b.dataset.videoProvider==='trending'){input.value='trending videos India';void search()}else{input.focus();st.textContent='TYPE YOUR SEARCH ABOVE · JARVIS WILL SEARCH IN-HOUSE'}},true)});
    try{const items=await videoSearch('trending videos India');renderVideos(items);if(items.length)st.textContent=`${items.length} RESULTS · TRENDING`;else st.textContent='READY · IN-HOUSE VIDEO SEARCH';}catch{st.textContent='READY · IN-HOUSE VIDEO SEARCH';}
  }

  async function renderNews(query='India OR technology'){
    const home=$('.command-center');if(!home)return;let desk=$('#newsDesk',home);if(!desk){desk=document.createElement('section');desk.id='newsDesk';desk.className='news-desk panel';const anchor=$('.command-surface',home);anchor?.insertAdjacentElement('afterend',desk)||home.appendChild(desk)}
    if($('.jv2-news-text',desk))return;
    desk.innerHTML=`<div class="news-head"><div><p class="eyebrow">INTELLIGENCE / TEXT BRIEF</p><h2>World signal</h2><p class="sub">Current headlines, kept lightweight and readable.</p></div><span class="live" id="jv2NewsStatus">CONNECTING</span></div><div class="jv2-news-text" id="jv2NewsGrid"><div class="empty">Loading headlines…</div></div>`;
    try{const q=encodeURIComponent(query);const r=await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=(${q})&mode=artlist&format=json&maxrecords=8&timespan=24h&sort=datedesc`,{cache:'no-store'});if(!r.ok)throw new Error();const d=await r.json(),items=(d.articles||[]).slice(0,8);if(!items.length)throw new Error();$('#jv2NewsStatus',desk).textContent=`${items.length} CURRENT STORIES`;$('#jv2NewsGrid',desk).innerHTML=items.map(a=>`<article class="news-card"><h3>${esc(a.title||'Untitled story')}</h3><p>${esc(a.domain||a.sourcecountry||'GLOBAL')} · ${esc(a.seendate||'Today')}</p><a href="${esc(a.url||'#')}" target="_blank" rel="noopener noreferrer">READ SOURCE ↗</a></article>`).join('');}
    catch{$('#jv2NewsStatus',desk).textContent='NEWS FEED DEGRADED';$('#jv2NewsGrid',desk).innerHTML='<div class="empty">News service is temporarily unavailable. The text-only desk remains ready for retry.</div>'}
  }
  function patchNews(){
    const desk=$('#newsDesk');if(!desk)return;
    const cards=$$('.news-card',desk);if(cards.some(c=>$('img',c))){cards.forEach(c=>$('img',c)?.remove());}
  }

  function gamesPad(target,send){if(!target||$('.jv2-pad',target))return;const p=document.createElement('div');p.className='jv2-pad';p.innerHTML='<button class="blank">·</button><button data-d="up">▲</button><button class="blank">·</button><button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button>';target.appendChild(p);$$('[data-d]',p).forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();send(b.dataset.d)},{passive:false}));}
  function patchGames(){
    const g=$('.jgames');if(g){const two=$('#g2048')?.parentElement,tet=$('#tet')?.parentElement;if(two)gamesPad(two,d=>document.dispatchEvent(new KeyboardEvent('keydown',{key:{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[d],bubbles:true})));if(tet)gamesPad(tet,d=>document.dispatchEvent(new KeyboardEvent('keydown',{key:{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[d],bubbles:true})));}
    const a=$('.arcade');if(a&&!$('.jv2-pad',a)){gamesPad(a,d=>document.dispatchEvent(new KeyboardEvent('keydown',{key:{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[d],bubbles:true})));}
  }

  function tick(){css();ensureMission();patchNews();patchGames();const h=$('h1')?.textContent||'';if(h==='Maps')normalizeMaps();if(h==='Media Center')void normalizeMedia();}
  interceptCommand();
  const obs=new MutationObserver(()=>{clearTimeout(window.__jv2tick);window.__jv2tick=setTimeout(tick,25)});obs.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick,{once:true});else tick();
  window.addEventListener('jarvis:news',e=>void renderNews(e.detail?.query||'India OR technology'));
})();
