from pathlib import Path

p = Path('src/main.ts')
s = p.read_text()

hs = s.index('function home(){')
he = s.index('\nfunction moduleDescription', hs)
h = s[hs:he]
if 'id="newsDesk"' not in h:
    h = h.replace('</section><section class="telemetry-grid">', '</section>${newsDesk()}<section class="telemetry-grid">', 1)
s = s[:hs] + h + s[he:]

marker = '\nfunction calculator(){'
news = '''
function newsDesk(){return `<section class="news-desk panel" id="newsDesk"><div class="news-head"><div><p class="eyebrow">INTELLIGENCE / LIVE BRIEF</p><h2>World signal</h2><p class="sub">JARVIS reads the current news stream, clusters the headlines and gives you the short version.</p></div><div class="news-controls"><span class="news-live"><i></i> LIVE</span><select id="newsGenre"><option value="AI OR technology">AI / TECH</option><option value="business OR markets">BUSINESS</option><option value="science OR space">SCIENCE / SPACE</option><option value="India OR Indian">INDIA</option><option value="world OR geopolitics">WORLD</option></select><button class="ghost" id="refreshNews">REFRESH</button></div></div><div class="news-ticker"><div class="news-track" id="newsTicker"><span>JARVIS IS CONNECTING TO THE GLOBAL NEWS STREAM…</span></div></div><div class="news-grid" id="newsCards"><div class="news-loading"><span></span><span></span><span></span></div></div></section>`}
'''
if 'function newsDesk()' not in s:
    s = s.replace(marker, news + marker, 1)

ms = s.index('function media(){')
me = s.index('\nfunction openExternal', ms)
media = '''function media(){return `${pageHead('INTELLIGENCE / MEDIA','Media Center','JARVIS starts with a live video feed. Search by intent, select a result, and resolve a playable stream when the source permits it.')}<div class="media-workspace"><section class="panel media-main"><div class="search-bar"><input id="videoQuery" placeholder="Search videos, channels or topics…"><button class="primary" id="videoSearch">SEARCH</button></div><div class="media-search-links"><button data-video-provider="trending">TRENDING</button><button data-video-provider="youtube">YOUTUBE SEARCH</button><button data-video-provider="bing">BING VIDEO</button></div><div id="jarvisPlayer" class="player"><div class="player-empty"><span>▶</span><strong>JARVIS VIDEO CORE</strong><small>Loading a live feed. Pick a result to play it.</small></div></div><div class="request-line"><input id="videoUrl" placeholder="Optional: YouTube URL, video ID or direct MP4 URL"><button class="primary" id="playVideo">PLAY</button></div></section><aside class="panel media-side"><div class="panel-head"><span>VIDEO INTELLIGENCE</span><span class="live" id="mediaState">CONNECTING</span></div><div id="videoResults" class="video-results"><div class="empty">Loading trending videos…</div></div></aside></div>`}
'''
s = s[:ms] + media + s[me:]

sm = s.index('async function setupMedia(){')
se = s.index('\nasync function setupSettings', sm)
setup_media = '''async function setupMedia(){
 const input=document.querySelector<HTMLInputElement>('#videoQuery')!,results=document.querySelector('#videoResults')!,player=document.querySelector('#jarvisPlayer')!,state=document.querySelector('#mediaState')!;
 const instances=['https://pipedapi.kavin.rocks','https://pipedapi.adminforge.de','https://pipedapi-libre.kavin.rocks'];
 const api=async(path:string)=>{let last:unknown;for(const base of instances){try{const r=await fetch(base+path,{headers:{Accept:'application/json'}});if(r.ok)return await r.json();last=new Error(`${r.status}`)}catch(e){last=e}}throw last instanceof Error?last:new Error('Video service unavailable')};
 const renderResults=(items:Array<any>)=>{results.innerHTML=items.slice(0,8).map((v:any)=>{const id=String(v.url||'').match(/[?&]v=([^&]+)/)?.[1]||v.videoId||null;return `<button class="video-result" data-video-id="${attr(id||'')}" data-video-url="${attr(v.url||'')}"><img src="${attr(v.thumbnail||'')}" alt=""><span class="video-meta"><strong>${esc(v.title||'Untitled video')}</strong><small>${esc(v.uploader||'Unknown channel')} · ${esc(v.uploadedDate||'')}</small><small>${v.views?`${Number(v.views).toLocaleString()} views`:''}</small></span><b>▶</b></button>`}).join('')||'<div class="empty">No videos found.</div>';results.querySelectorAll<HTMLButtonElement>('.video-result').forEach(b=>b.onclick=()=>playId(b.dataset.videoId||''))};
 const playId=async(id:string)=>{if(!id)return;state.textContent='RESOLVING';player.innerHTML='<div class="player-empty"><span>◌</span><strong>RESOLVING STREAM</strong><small>JARVIS is negotiating a browser-playable source.</small></div>';try{const data=await api(`/streams/${encodeURIComponent(id)}`);const stream=(data.videoStreams||[]).filter((x:any)=>!x.videoOnly&&/^video\\/mp4/i.test(x.mimeType||'')).sort((a:any,b:any)=>(b.height||0)-(a.height||0))[0]||(data.videoStreams||[])[0];if(stream?.url){player.innerHTML=`<video controls autoplay playsinline poster="${attr(data.thumbnailUrl||'')}"><source src="${attr(stream.url)}" type="${attr(stream.mimeType||'video/mp4')}"></video>`;state.textContent=`PLAYING · ${stream.quality||'AUTO'}`;return}loadYouTube(id);state.textContent='YOUTUBE FALLBACK'}catch{loadYouTube(id);state.textContent='YOUTUBE FALLBACK'}};
 const trending=async()=>{state.textContent='LOADING';try{const data=await api('/trending?region=IN');renderResults(data);state.textContent='TRENDING'}catch{results.innerHTML='<div class="empty">Video index unavailable. Try YouTube search.</div>';state.textContent='DEGRADED'}};
 const search=async(kind:string)=>{const q=input.value.trim();if(kind==='trending'||!q){await trending();return}state.textContent='SEARCHING';results.innerHTML='<div class="empty">SEARCHING VIDEO INDEX…</div>';try{const data=await api(`/search?q=${encodeURIComponent(q)}&filter=videos`);renderResults(data.items||[]);state.textContent=`${(data.items||[]).length} RESULTS`}catch{state.textContent='SEARCH FAILED';results.innerHTML=`<div class="video-context"><strong>${esc(q)}</strong><p>JARVIS could not reach the video index. Open a browser search instead.</p><button class="secondary" id="videoExternalFallback">OPEN YOUTUBE SEARCH</button></div>`;document.querySelector('#videoExternalFallback')?.addEventListener('click',()=>openExternal(youtubeSearch(q),`YouTube: ${q}`))}};
 document.querySelector('#videoSearch')?.addEventListener('click',()=>search('search'));input.addEventListener('keydown',e=>{if(e.key==='Enter')search('search')});document.querySelectorAll<HTMLButtonElement>('[data-video-provider]').forEach(b=>b.onclick=()=>search(b.dataset.videoProvider!));document.querySelector('#playVideo')?.addEventListener('click',()=>{const raw=(document.querySelector('#videoUrl') as HTMLInputElement).value.trim();const id=videoId(raw);if(id)playId(id);else if(/^https?:\\/\\//.test(raw))player.innerHTML=`<video controls autoplay playsinline src="${attr(raw)}"></video>`;else if(raw)player.innerHTML='<div class="player-empty"><span>!</span><strong>UNSUPPORTED INPUT</strong><small>Use a YouTube URL, video ID or direct media URL.</small></div>';});
 await trending();
}
'''
s = s[:sm] + setup_media + s[se:]

news_setup = '''async function setupNews(){
 const ticker=document.querySelector('#newsTicker')!,cards=document.querySelector('#newsCards')!,genre=document.querySelector<HTMLSelectElement>('#newsGenre')!,refresh=document.querySelector('#refreshNews');
 const summarize=async(title:string)=>{try{const q=encodeURIComponent(title.split(/\s+/).slice(0,8).join(' '));const r=await fetch(`https://api.gdeltproject.org/api/v2/context/context?query=${q}&mode=artlist&format=json&maxrecords=1&timespan=24h`);if(r.ok){const d=await r.json();const a=d.articles?.[0];if(a?.context)return String(a.context).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}}catch{}return `JARVIS brief: ${title}. This is a concise headline-level briefing; open the source for the full report.`};
 const load=async()=>{ticker.innerHTML='<span>JARVIS IS SCANNING THE GLOBAL NEWS STREAM…</span>';cards.innerHTML='<div class="news-loading"><span></span><span></span><span></span></div>';try{const q=encodeURIComponent(genre.value);const r=await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=(${q})&mode=artlist&format=json&maxrecords=8&timespan=24h&sort=datedesc`);if(!r.ok)throw new Error('News service unavailable');const d=await r.json();const items=(d.articles||[]).slice(0,6);if(!items.length)throw new Error('No current stories');const summaries=await Promise.all(items.slice(0,4).map((a:any)=>summarize(a.title||'')));const enriched=items.map((a:any,i:number)=>({...a,summary:summaries[i]||`JARVIS brief: ${a.title}`}));ticker.innerHTML=[...enriched,...enriched].map((a:any)=>`<a href="${attr(a.url)}" target="_blank" rel="noopener noreferrer">● ${esc(a.title)}</a>`).join('');cards.innerHTML=enriched.slice(0,4).map((a:any)=>`<article class="news-card"><img loading="lazy" src="${attr(a.socialimage||'')}" alt=""><div class="news-card-body"><div class="news-meta"><span>${esc(a.domain||'NEWS')}</span><span>${esc(a.sourcecountry||'GLOBAL')}</span></div><h3><a href="${attr(a.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(a.title)}</strong></a></h3><p>${esc(a.summary)}</p><a class="news-read" href="${attr(a.url)}" target="_blank" rel="noopener noreferrer">READ SOURCE ↗</a></div></article>`).join('');}catch(e){ticker.innerHTML='<span>NEWS FEED DEGRADED · RETRY AVAILABLE</span>';cards.innerHTML=`<div class="empty">${esc(e instanceof Error?e.message:'News feed unavailable')}</div>`}};
 genre.addEventListener('change',load);refresh?.addEventListener('click',load);await load();
}

'''
if 'async function setupNews()' not in s:
    s = s.replace('async function setupNotes(){', news_setup + 'async function setupNotes(){', 1)
s = s.replace("if(active==='settings')await setupSettings()", "if(active==='settings')await setupSettings();if(active==='home')await setupNews()")
p.write_text(s)
