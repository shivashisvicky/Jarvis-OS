(() => {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ws = () => document.querySelector('.workspace');
  const newsFeeds = {
    india: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
    local: 'https://news.google.com/rss/search?q=Bhubaneswar%20Odisha&hl=en-IN&gl=IN&ceid=IN:en',
    world: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    tech: 'https://news.google.com/rss/search?q=technology%20AI&hl=en-US&gl=US&ceid=US:en'
  };
  const videoApis = ['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com'];

  function style() {
    if (document.querySelector('#jarvisFinalStyle')) return;
    const s = document.createElement('style'); s.id = 'jarvisFinalStyle';
    s.textContent = `
      .jarvis-final-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;margin-top:14px}
      .jarvis-final-card{border:1px solid rgba(100,220,255,.18);border-radius:16px;padding:14px;background:rgba(4,12,18,.86)}
      .jarvis-final-card h3{font-size:1rem;line-height:1.3;margin:0 0 8px}.jarvis-final-card p{opacity:.72;line-height:1.45;margin:6px 0}.jarvis-final-meta{font-size:.72rem;opacity:.5;margin-top:10px}
      .jarvis-final-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.jarvis-final-tabs button{min-height:42px}.jarvis-final-tabs .active{outline:2px solid rgba(90,215,255,.45)}
      .jarvis-final-status{padding:12px;border:1px solid rgba(100,220,255,.16);border-radius:12px;opacity:.8}
      .jarvis-final-player{margin-top:14px;border:1px solid rgba(100,220,255,.2);border-radius:18px;overflow:hidden;background:#000;box-shadow:0 15px 40px rgba(0,0,0,.25)}
      .jarvis-final-player iframe,.jarvis-final-player video{display:block;width:100%;aspect-ratio:16/9;min-height:240px;border:0;background:#000}.jarvis-final-player video{height:auto}
      .jarvis-video-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-top:12px}.jarvis-video-result{padding:0;overflow:hidden;text-align:left}.jarvis-video-result img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}.jarvis-video-result div{padding:12px}.jarvis-video-result strong{display:block;line-height:1.3}.jarvis-video-result small{display:block;opacity:.55;margin-top:6px}
      .jarvis-chat{margin-top:12px;border:1px solid rgba(100,220,255,.16);border-radius:16px;padding:12px;background:rgba(3,10,16,.75)}.jarvis-chat-log{max-height:260px;overflow:auto;display:flex;flex-direction:column;gap:8px}.jarvis-chat-msg{padding:9px 11px;border-radius:12px;background:rgba(255,255,255,.04)}.jarvis-chat-msg.user{border-left:3px solid #55d6ff}.jarvis-chat-msg.jarvis{border-left:3px solid #f5c95b}.jarvis-chat small{opacity:.55}.jarvis-chat-input{display:flex;gap:8px;margin-top:10px}.jarvis-chat-input input{flex:1;min-width:0}
      @media(max-width:700px){.jarvis-final-grid{grid-template-columns:1fr}.jarvis-chat-input{flex-direction:column}}
    `; document.head.appendChild(s);
  }

  function addNewsNav() {
    const aside = document.querySelector('aside'); if (!aside || aside.querySelector('[data-app="news"]')) return;
    const b = document.createElement('button'); b.className='nav'; b.dataset.app='news'; b.title='News'; b.innerHTML='<b>▤</b><span>News</span>'; aside.appendChild(b);
  }

  async function getNews(url) {
    const gateways = [
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    ];
    for (const gateway of gateways) {
      try {
        const r = await fetch(gateway,{cache:'no-store'}); if (!r.ok) continue;
        const text = await r.text();
        try { const j=JSON.parse(text); if (j.items) return j.items; } catch {}
        const xml = new DOMParser().parseFromString(text,'text/xml');
        const items=[...xml.querySelectorAll('item')].map(x=>({title:x.querySelector('title')?.textContent||'',link:x.querySelector('link')?.textContent||'',description:x.querySelector('description')?.textContent||'',pubDate:x.querySelector('pubDate')?.textContent||'',author:x.querySelector('source')?.textContent||'News'}));
        if(items.length)return items;
      } catch {}
    }
    throw new Error('Live news gateway unavailable');
  }

  async function renderNews(tab='india', query='') {
    const w=ws(); if(!w)return;
    w.innerHTML=`<div class="apphead"><div><p class="eyebrow">INTELLIGENCE / LIVE NEWS</p><h2>JARVIS News</h2><p class="sub">India, Odisha/local, world and technology headlines inside the command shell.</p></div><span class="badge">LIVE FEED</span></div>
      <div class="jarvis-final-tabs"><button data-news-tab="india">INDIA</button><button data-news-tab="local">ODISHA / LOCAL</button><button data-news-tab="world">WORLD</button><button data-news-tab="tech">TECH & AI</button><button id="newsRefresh">↻ REFRESH</button></div>
      <div class="request-row"><input id="newsQuery" placeholder="Search news…" value="${esc(query)}"><button class="primary" id="newsSearch">SEARCH NEWS</button></div>
      <div id="newsStatus" class="jarvis-final-status">Loading live headlines…</div><div id="newsGrid" class="jarvis-final-grid"></div>`;
    document.querySelectorAll('[data-news-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.newsTab===tab);b.onclick=()=>renderNews(b.dataset.newsTab)});
    document.querySelector('#newsRefresh').onclick=()=>renderNews(tab,query);
    document.querySelector('#newsSearch').onclick=()=>renderNews(tab,document.querySelector('#newsQuery').value.trim());
    const url=query?`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`:newsFeeds[tab];
    try{
      const items=await getNews(url), grid=document.querySelector('#newsGrid'), status=document.querySelector('#newsStatus');
      if(status)status.textContent=`${items.length} stories loaded`;
      if(grid)grid.innerHTML=items.slice(0,18).map(x=>`<article class="jarvis-final-card"><h3>${esc(x.title)}</h3><p>${esc(String(x.description||'').replace(/<[^>]+>/g,'').slice(0,220))}</p><div class="jarvis-final-meta">${esc(x.author||'News')} · ${esc(x.pubDate||'')}</div><button class="primary" data-news-open="${esc(x.link)}">READ STORY</button></article>`).join('')||'<div class="jarvis-final-status">No stories found.</div>';
      grid?.querySelectorAll('[data-news-open]').forEach(b=>b.onclick=()=>window.open(b.dataset.newsOpen,'_blank','noopener,noreferrer'));
    }catch(e){const s=document.querySelector('#newsStatus');if(s)s.textContent='News is temporarily unavailable. JARVIS will retry when you press Refresh.';}
  }

  function youtubeId(raw) {
    const v=String(raw||'').trim(); if(/^[A-Za-z0-9_-]{11}$/.test(v))return v;
    try{const u=new URL(v),host=u.hostname.toLowerCase();if(host==='youtu.be')return u.pathname.split('/').filter(Boolean)[0]||null;if(host.endsWith('youtube.com')){const q=u.searchParams.get('v');if(q)return q;const p=u.pathname.split('/').filter(Boolean),i=p.findIndex(x=>['shorts','embed','live'].includes(x));return i>=0?p[i+1]||null:null;}}catch{} return null;
  }
  function playVideo(raw,title='JARVIS Player') {
    const id=youtubeId(raw), p=document.querySelector('#jarvisFinalPlayer'); if(!p)return;
    if(id){p.innerHTML=`<div class="jarvis-final-status">${esc(title)}</div><iframe title="${esc(title)}" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1&enablejsapi=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;return;}
    if(/^https?:\/\//i.test(String(raw||''))){p.innerHTML=`<video controls playsinline preload="metadata" src="${esc(raw)}"></video>`;return;}
    p.innerHTML='<div class="jarvis-final-status">Paste a YouTube watch URL, m.youtube.com URL, youtu.be link, Shorts URL, or direct MP4 URL.</div>';
  }
  async function searchVideos(q) {
    const status=document.querySelector('#videoStatus'),grid=document.querySelector('#videoResults'); if(!grid||!q)return;
    status.textContent='Searching video index…';grid.innerHTML='';
    for(const base of videoApis){
      try{const r=await fetch(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video`,{cache:'no-store',signal:AbortSignal.timeout(6000)});if(!r.ok)continue;const a=await r.json();if(!Array.isArray(a)||!a.length)continue;
        status.textContent=`${Math.min(a.length,12)} videos found`;grid.innerHTML=a.slice(0,12).map(v=>{const id=v.videoId||youtubeId(v.url);return id?`<button class="jarvis-final-card jarvis-video-result" data-video-id="${esc(id)}"><img src="${esc(v.videoThumbnails?.find(x=>x.quality==='medium')?.url||v.thumbnail||`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)}" alt=""><div><strong>${esc(v.title||'Untitled video')}</strong><small>${esc(v.author||'YouTube')} · ${esc(v.viewCount||'')}</small></div></button>`:''}).join('');grid.querySelectorAll('[data-video-id]').forEach(b=>b.onclick=()=>playVideo(b.dataset.videoId,b.querySelector('strong')?.textContent||'JARVIS Player'));return;
      }catch{}
    }
    status.textContent='Video search is unavailable right now. Direct YouTube playback remains available below.';
  }
  function renderMedia() {
    const w=ws();if(!w)return;
    w.innerHTML=`<div class="apphead"><div><p class="eyebrow">MEDIA / VIDEO</p><h2>JARVIS Player</h2><p class="sub">Search and play YouTube videos without leaving JARVIS.</p></div><span class="badge">IN-SHELL</span></div>
      <section class="search-card"><div class="request-row"><input id="jarvisVideoQuery" placeholder="Search videos…"><button class="primary" id="jarvisVideoSearch">SEARCH VIDEOS</button></div>
      <div id="videoStatus" class="jarvis-final-status">Search results appear here. No new tab is required.</div><div id="videoResults" class="jarvis-video-results"></div>
      <div class="request-row" style="margin-top:14px"><input id="jarvisVideoUrl" placeholder="Paste YouTube URL or direct .mp4 URL"><button class="primary" id="jarvisVideoPlay">PLAY</button></div><div id="jarvisFinalPlayer" class="jarvis-final-player"><div class="jarvis-final-status">Ready for a video.</div></div></section>`;
    const q=document.querySelector('#jarvisVideoQuery');q.addEventListener('keydown',e=>{if(e.key==='Enter')searchVideos(q.value.trim())});document.querySelector('#jarvisVideoSearch').onclick=()=>searchVideos(q.value.trim());document.querySelector('#jarvisVideoPlay').onclick=()=>playVideo(document.querySelector('#jarvisVideoUrl').value.trim());
  }

  function cleanBrowser() {
    document.querySelectorAll('[data-provider]').forEach(b=>{if(b.dataset.provider!=='bing')b.remove()});
    const select=document.querySelector('#searchEngine'); if(select){[...select.options].forEach(o=>{if(o.value!=='bing')o.remove()});select.value='bing';}
  }

  function conversationalReply(q) {
    const x=q.trim().toLowerCase();
    if(/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(x))return 'Good to hear from you. JARVIS is online and ready.';
    if(/\bwho are you\b|\bwhat are you\b/.test(x))return 'I am JARVIS, your browser-native command layer. I can control the shell, search, open modules, read news, play media and run diagnostics.';
    if(/\bhow are you\b/.test(x))return 'All primary systems are nominal. I am ready for your next command.';
    if(/\bwhat can you do\b|\bhelp me\b/.test(x))return 'Try: open news, latest AI news, open maps, play a YouTube link, search the web for something, open media, or run a system check.';
    if(/\b(system|core|diagnostic|status)\b/.test(x))return `Core is nominal. Network is ${navigator.onLine?'online':'offline'}, with ${navigator.hardwareConcurrency||'unknown'} logical processors exposed by the browser.`;
    return null;
  }
  function speakReply(text){
    if(!('speechSynthesis' in window))return;const voices=window.speechSynthesis.getVoices();const preferred=['Daniel','Arthur','George','Oliver','James','Alex','Fred'];const v=voices.find(x=>preferred.some(n=>x.name.toLowerCase().includes(n.toLowerCase()))&&/^en-GB/i.test(x.lang))||voices.find(x=>/^en-GB/i.test(x.lang))||voices.find(x=>/^en-IN/i.test(x.lang))||voices[0];const u=new SpeechSynthesisUtterance(text);u.voice=v||null;u.lang=v?.lang||'en-GB';u.rate=.82;u.pitch=.52;u.volume=.98;window.speechSynthesis.cancel();window.speechSynthesis.speak(u);
  }
  function chatPanel(){
    const w=ws();if(!w||document.querySelector('#jarvisChat'))return;
    const c=document.createElement('section');c.id='jarvisChat';c.className='jarvis-chat';c.innerHTML='<div class="jarvis-chat-log" id="jarvisChatLog"><div class="jarvis-chat-msg jarvis"><small>JARVIS</small><div>Voice and text command channel ready.</div></div></div><div class="jarvis-chat-input"><input id="jarvisChatInput" placeholder="Talk to JARVIS…"><button class="primary" id="jarvisChatSend">SEND</button><button id="jarvisChatVoice">VOICE</button></div>';w.appendChild(c);
    const send=()=>{const i=document.querySelector('#jarvisChatInput'),q=i.value.trim();if(!q)return;const log=document.querySelector('#jarvisChatLog');log.insertAdjacentHTML('beforeend',`<div class="jarvis-chat-msg user"><small>YOU</small><div>${esc(q)}</div></div>`);i.value='';const reply=conversationalReply(q)||'I can handle that as a JARVIS command. Try asking me to open a module, search the web, show news, play a video, or report system status.';log.insertAdjacentHTML('beforeend',`<div class="jarvis-chat-msg jarvis"><small>JARVIS</small><div>${esc(reply)}</div></div>`);log.scrollTop=log.scrollHeight;speakReply(reply)};document.querySelector('#jarvisChatSend').onclick=send;document.querySelector('#jarvisChatInput').addEventListener('keydown',e=>{if(e.key==='Enter')send()});document.querySelector('#jarvisChatVoice').onclick=()=>document.querySelector('#voiceBtn')?.click();
  }
  function enhance(){style();addNewsNav();cleanBrowser();if(document.querySelector('.command-center'))chatPanel();}
  document.addEventListener('click',e=>{const b=e.target.closest?.('.nav[data-app]');if(!b)return;if(b.dataset.app==='news'){e.preventDefault();e.stopImmediatePropagation();renderNews()}else if(b.dataset.app==='media'){e.preventDefault();e.stopImmediatePropagation();renderMedia()}},true);
  document.addEventListener('submit',e=>{const f=e.target.closest?.('#commandForm');if(!f)return;const i=f.querySelector('#commandInput'),q=i?.value?.trim()||'',reply=conversationalReply(q);if(reply){e.preventDefault();e.stopImmediatePropagation();const r=document.querySelector('#jarvisReply');if(r){r.textContent=reply;r.style.display='block'}speakReply(reply)}},true);
  window.addEventListener('jarvis:news',e=>renderNews('india',String(e.detail?.query||'').replace(/\b(open|show|read|give me|latest)?\s*(the\s+)?news\b/i,'').trim()));
  new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true}); enhance();
})();
