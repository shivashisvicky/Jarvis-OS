(() => {
  'use strict';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const ytId = value => {
    try {
      const u = new URL(String(value).trim());
      const host = u.hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
      if (['youtube.com','m.youtube.com'].includes(host)) {
        if (u.pathname === '/watch') return u.searchParams.get('v');
        const parts = u.pathname.split('/').filter(Boolean);
        if (['embed','shorts','live'].includes(parts[0])) return parts[1] || null;
      }
    } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(String(value).trim()) ? String(value).trim() : null;
  };

  const getCurrent = () => document.querySelector('#jarvisPlayer')?.dataset.videoId || document.querySelector('#videoResults [data-jvc-id]')?.dataset.jvcId || null;

  const play = id => {
    const safe = ytId(id);
    const player = document.querySelector('#jarvisPlayer');
    if (!player || !safe) return false;
    player.dataset.videoId = safe;
    player.innerHTML = `
      <div class="jarvis-player-frame">
        <iframe src="https://www.youtube-nocookie.com/embed/${safe}?autoplay=1&controls=1&playsinline=1&rel=0" title="JARVIS video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>`;
    document.querySelectorAll('#videoResults [data-jvc-id]').forEach(card => card.classList.toggle('is-active', card.dataset.jvcId === safe));
    return true;
  };

  const render = (box, items) => {
    box.innerHTML = items.slice(0,12).map((item,index) => `
      <article class="jarvis-video-card ${index===0?'is-active':''}" data-jvc-id="${esc(item.id)}">
        <button type="button" class="jarvis-video-select" aria-label="Play ${esc(item.title)}">
          <span class="jarvis-video-thumb"><img src="${esc(item.thumb || `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`)}" alt="" loading="lazy"><span class="jarvis-video-badge">${index+1}</span></span>
          <span class="jarvis-video-copy"><strong>${esc(item.title || 'YouTube video')}</strong><small>${esc(item.channel || 'YouTube')}</small></span>
          <span class="jarvis-video-action" aria-hidden="true">▶</span>
        </button>
      </article>`).join('') || '<div class="empty">No videos found.</div>';

    box.querySelectorAll('.jarvis-video-select').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        play(button.closest('[data-jvc-id]')?.dataset.jvcId);
      });
    });
  };

  const style = () => {
    if (document.querySelector('#jarvis-v3-media-style')) return;
    const tag = document.createElement('style');
    tag.id = 'jarvis-v3-media-style';
    tag.textContent = `
      .media-workspace { grid-template-columns:minmax(0,1fr) minmax(280px,420px) !important; align-items:start; }
      .media-workspace > .media-side { display:block !important; grid-column:2; grid-row:3 / span 2; }
      .media-workspace > .media-main { display:block !important; grid-column:1; }
      .media-workspace > .media-main > #jarvisPlayer { grid-row:auto; }
      #videoResults { max-height:620px !important; }
      #videoResults.video-results { display:grid !important; grid-template-columns:1fr !important; gap:8px !important; padding:10px !important; }
      .jarvis-video-card { border:1px solid var(--line); border-radius:11px; overflow:hidden; background:rgba(3,10,14,.74); }
      .jarvis-video-card.is-active { border-color:var(--cyan); box-shadow:0 0 0 1px rgba(120,220,255,.12) inset; }
      .jarvis-video-select { width:100%; display:grid; grid-template-columns:104px minmax(0,1fr) 26px; gap:9px; align-items:center; border:0; padding:8px; background:transparent; color:var(--text); text-align:left; cursor:pointer; }
      .jarvis-video-thumb { position:relative; width:104px; aspect-ratio:16/9; border-radius:7px; overflow:hidden; background:#020508; }
      .jarvis-video-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
      .jarvis-video-badge { position:absolute; left:5px; top:5px; padding:3px 5px; border-radius:5px; background:rgba(0,0,0,.75); color:#d9fbff; font:700 8px/1 ui-monospace,monospace; }
      .jarvis-video-copy { min-width:0; display:grid; gap:5px; }
      .jarvis-video-copy strong { font-size:11px; line-height:1.28; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
      .jarvis-video-copy small { font-size:8px; color:#67838d; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .jarvis-video-action { width:24px; height:24px; border:1px solid var(--line); border-radius:50%; display:grid; place-items:center; color:var(--cyan); font-size:10px; }
      .jarvis-player-frame { width:100%; aspect-ratio:16/9; overflow:hidden; border-radius:8px; background:#000; }
      .jarvis-player-frame iframe { width:100%; height:100%; border:0; display:block; }
      @media(max-width:900px) { .media-workspace { grid-template-columns:1fr !important; } .media-workspace > .media-side { grid-column:1; grid-row:auto; } #videoResults { max-height:360px !important; } }
    `;
    document.head.appendChild(tag);
  };

  const wire = () => {
    const box = document.querySelector('#videoResults');
    if (!box || box.dataset.v3Media) return;
    box.dataset.v3Media = '1';
    style();
    const observer = new MutationObserver(() => {
      box.querySelectorAll('[data-jvc-id]:not([data-v3-bound])').forEach(card => {
        card.dataset.v3Bound = '1';
        card.addEventListener('dblclick', () => play(card.dataset.jvcId));
      });
    });
    observer.observe(box, {childList:true,subtree:true});
  };

  style(); wire(); new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('jarvis:media-play', event => play(event.detail?.id || event.detail?.url || getCurrent()));
  window.jarvisV3Media = { play, render };
})();
