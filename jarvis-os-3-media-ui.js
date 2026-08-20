(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const ytId = value => {
    try { const u = new URL(String(value).trim()); const h = u.hostname.replace(/^www\./,'').toLowerCase(); if(h==='youtu.be') return u.pathname.split('/').filter(Boolean)[0]||null; if(['youtube.com','m.youtube.com'].includes(h)){if(u.pathname==='/watch') return u.searchParams.get('v'); const p=u.pathname.split('/').filter(Boolean); if(['embed','shorts','live'].includes(p[0])) return p[1]||null;} } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(String(value).trim()) ? String(value).trim() : null;
  };
  const player = () => document.querySelector('#jarvisPlayer');
  const play = id => {
    const safe = ytId(id), p = player(); if(!safe || !p) return false;
    p.dataset.videoId = safe;
    p.replaceChildren();
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(safe)}?autoplay=1&controls=1&playsinline=1&rel=0`;
    frame.title = 'JARVIS YouTube player'; frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; frame.allowFullscreen = true; frame.referrerPolicy = 'strict-origin-when-cross-origin';
    p.appendChild(frame);
    document.querySelectorAll('#videoResults [data-jvc-id]').forEach(c => c.classList.toggle('is-active', c.dataset.jvcId === safe));
    return true;
  };
  const render = (box, items) => {
    if(!box) return;
    box.innerHTML = items.slice(0,12).map((item,i)=>`<article class="jarvis-video-card ${i===0?'is-active':''}" data-jvc-id="${esc(item.id)}"><button type="button" class="jarvis-video-select" aria-label="Play ${esc(item.title)}"><span class="jarvis-video-thumb"><img src="${esc(item.thumb||`https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`)}" alt="" loading="lazy"><span class="jarvis-video-badge">${i+1}</span></span><span class="jarvis-video-copy"><strong>${esc(item.title||'YouTube video')}</strong><small>${esc(item.channel||'YouTube')}</small></span><span class="jarvis-video-action" aria-hidden="true">▶</span></button></article>`).join('') || '<div class="empty">No videos found.</div>';
    box.querySelectorAll('.jarvis-video-select').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();play(b.closest('[data-jvc-id]')?.dataset.jvcId);},true));
  };
  const style=()=>{if(document.querySelector('#jarvis-v3-media-style'))return;const s=document.createElement('style');s.id='jarvis-v3-media-style';s.textContent=`.media-workspace{grid-template-columns:minmax(0,1fr) minmax(280px,420px)!important;align-items:start}.media-workspace>.media-side{display:block!important;grid-column:2;grid-row:3/span 2}.media-workspace>.media-main{display:block!important;grid-column:1}.#videoResults{max-height:620px!important;overflow:auto}#videoResults.video-results{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;padding:10px!important}.jarvis-video-card{border:1px solid var(--line);border-radius:11px;overflow:hidden;background:rgba(3,10,14,.74)}.jarvis-video-card.is-active{border-color:var(--cyan)}.jarvis-video-select{width:100%;display:grid;grid-template-columns:104px minmax(0,1fr) 26px;gap:9px;align-items:center;border:0;padding:8px;background:transparent;color:var(--text);text-align:left;cursor:pointer}.jarvis-video-thumb{position:relative;width:104px;aspect-ratio:16/9;border-radius:7px;overflow:hidden;background:#020508}.jarvis-video-thumb img{width:100%;height:100%;object-fit:cover;display:block}.jarvis-video-copy{min-width:0;display:grid;gap:5px}.jarvis-video-copy strong{font-size:11px;line-height:1.28;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.jarvis-video-copy small{font-size:8px;color:#67838d;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.jarvis-video-action{width:24px;height:24px;border:1px solid var(--line);border-radius:50%;display:grid;place-items:center;color:var(--cyan);font-size:10px}.jarvis-player-frame{width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:8px;background:#000}.jarvis-player-frame iframe{width:100%;height:100%;border:0;display:block}@media(max-width:900px){.media-workspace{grid-template-columns:1fr!important}.media-workspace>.media-side{grid-column:1;grid-row:auto}#videoResults{max-height:360px!important}}`;document.head.appendChild(s)};
  style();
  window.jarvisV3Media={play,render};
})();
