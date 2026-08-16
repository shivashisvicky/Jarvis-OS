import { defineConfig, type Plugin } from 'vite';

const mediaRuntime = `
async function setupMedia(){
  const input=document.querySelector<HTMLInputElement>('#videoQuery')!;
  const results=document.querySelector<HTMLElement>('#videoResults')!;
  const player=document.querySelector<HTMLElement>('#jarvisPlayer')!;
  const state=document.querySelector<HTMLElement>('#mediaState')!;
  const invidious=['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com','https://invidious.tiekoetter.com'];
  const piped=['https://pipedapi.kavin.rocks','https://pipedapi.leptons.xyz','https://pipedapi.adminforge.de','https://api.piped.yt'];
  const json=async(url:string)=>{const r=await fetch(url,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error(String(r.status));return await r.json()};
  const normalize=(items:any[])=>items.filter(v=>v&&(v.videoId||v.url)).map(v=>({id:String(v.videoId||String(v.url||'').match(/[?&]v=([^&]+)/)?.[1]||''),title:String(v.title||'Untitled video'),author:String(v.author||v.uploader||'Unknown channel'),views:Number(v.viewCount||v.views||0),published:String(v.publishedText||v.uploadedDate||''),thumb:String(v.videoThumbnails?.find((x:any)=>x.quality==='medium')?.url||v.videoThumbnails?.[0]?.url||v.thumbnail||'')})).filter(v=>v.id);
  const render=(items:any[])=>{const cards=normalize(items).slice(0,8);results.innerHTML=cards.length?cards.map(v=>'<button class="jvc-card video-result" data-video-id="'+attr(v.id)+'"><img src="'+attr(v.thumb)+'" alt=""><span class="video-meta"><strong>'+esc(v.title)+'</strong><small>'+esc(v.author)+(v.published?' · '+esc(v.published):'')+'</small><small>'+(v.views?v.views.toLocaleString()+' views':'')+'</small></span><b>▶</b></button>').join(''):'<div class="empty">No videos found.</div>';results.querySelectorAll<HTMLButtonElement>('.jvc-card').forEach(card=>card.onclick=()=>play(card.dataset.videoId||''));return cards.length};
  const searchInvidious=async(q:string)=>{for(const base of invidious){try{const data=await json(base+'/api/v1/search?q='+encodeURIComponent(q)+'&type=video&page=1');const items=Array.isArray(data)?data.filter((x:any)=>x.type==='video'||x.videoId):[];if(items.length)return items}catch{}}throw new Error('No public video index responded with results')};
  const searchPiped=async(q:string)=>{for(const base of piped){try{const data=await json(base+'/search?q='+encodeURIComponent(q)+'&filter=videos');const items=Array.isArray(data)?data:(data.items||[]);if(items.length)return items}catch{}}throw new Error('No public video index responded with results')};
  const search=async(kind='search')=>{if(kind==='trending'&&!input.value.trim())input.value='trending videos India';const query=input.value.trim()||'trending videos India';state.id='jvcStatus';state.textContent='SEARCHING · JARVIS INDEX';results.innerHTML='<div class="empty">JARVIS is searching video indexes…</div>';try{let items:any[]=[];try{items=await searchInvidious(query)}catch{items=await searchPiped(query)}const count=render(items);state.textContent='RESULTS · '+count+' · IN-HOUSE';player.innerHTML='<div class="player-empty"><span>▶</span><strong>JARVIS VIDEO CORE</strong><small>Select a result. Playback stays inside JARVIS.</small></div>'}catch{state.textContent='NO REDIRECT';results.innerHTML='<div class="video-context"><strong>No public video index responded with results</strong><p>JARVIS will not redirect you. Try SEARCH again or paste a video URL.</p></div>';player.innerHTML='<div class="player-empty"><span>!</span><strong>VIDEO INDEX OFFLINE</strong><small>NO REDIRECT · JARVIS remains in the media console.</small></div>'}};
  const play=async(id:string)=>{if(!id)return;state.textContent='LOADING · JARVIS PLAYER';player.innerHTML='<iframe title="JARVIS video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?rel=0&playsinline=1"></iframe>';state.textContent='PLAYING · IN-HOUSE PLAYER'};
  document.querySelector('#videoSearch')?.addEventListener('click',()=>search('search'));input.addEventListener('keydown',e=>{if(e.key==='Enter')search('search')});document.querySelectorAll<HTMLButtonElement>('[data-video-provider]').forEach(b=>b.onclick=()=>search(b.dataset.videoProvider||'search'));document.querySelector('#playVideo')?.addEventListener('click',()=>{const raw=(document.querySelector('#videoUrl') as HTMLInputElement).value.trim();const id=videoId(raw);if(id)play(id);else if(raw)player.innerHTML='<div class="player-empty"><span>!</span><strong>UNSUPPORTED INPUT</strong><small>Use a YouTube URL or video ID.</small></div>'});state.id='jvcStatus';state.textContent='READY · IN-HOUSE VIDEO SEARCH';await search('trending');
}
`;

function mediaPlugin(): Plugin {
  return {
    name: 'jarvis-media-runtime',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.ts')) return null;
      const start = code.indexOf('async function setupMedia(){');
      const end = code.indexOf('\nasync function setupSettings', start);
      if (start < 0 || end < 0) return null;
      return code.slice(0, start) + mediaRuntime + code.slice(end + 1);
    }
  };
}

export default defineConfig({ base: './', plugins: [mediaPlugin()] });
