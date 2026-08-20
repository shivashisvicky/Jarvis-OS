(() => {
  'use strict';
  const root = () => document.querySelector('.os');
  const setMode = mode => {
    const el = root();
    if (!el) return;
    el.classList.toggle('voice-listening', mode === 'listening');
    el.classList.toggle('voice-speaking', mode === 'speaking');
  };

  const synth = window.speechSynthesis;
  if (synth && !synth.__jarvisHudPatched) {
    synth.__jarvisHudPatched = true;
    const originalSpeak = synth.speak.bind(synth);
    const originalCancel = synth.cancel.bind(synth);
    synth.speak = utterance => {
      try {
        utterance.addEventListener?.('start', () => setMode('speaking'));
        utterance.addEventListener?.('end', () => setMode('idle'));
        utterance.addEventListener?.('error', () => setMode('idle'));
      } catch {}
      setMode('speaking');
      originalSpeak(utterance);
    };
    synth.cancel = (...args) => { const r = originalCancel(...args); setMode('idle'); return r; };
  }

  const observeVoiceButton = () => {
    const btn = document.querySelector('#voiceBtn');
    if (!btn || btn.__jarvisHudObserved) return;
    btn.__jarvisHudObserved = true;
    const sync = () => setMode(btn.classList.contains('listening') ? 'listening' : (root()?.classList.contains('voice-speaking') ? 'speaking' : 'idle'));
    new MutationObserver(sync).observe(btn, {attributes:true, attributeFilter:['class']});
    sync();
  };

  const decorateHome = () => {
    const core = document.querySelector('.core-visual');
    if (core && !core.querySelector('.hud-label')) {
      [['hud-label hud-tl','POWER LEVEL','100%'],['hud-label hud-tr','SYSTEM UPTIME','ONLINE'],['hud-label hud-bl','J.A.R.V.I.S','ACTIVE'],['hud-label hud-br','NETWORK','STABLE']].forEach(([cls,a,b]) => { const n=document.createElement('div'); n.className=cls; n.innerHTML=`<small>${a}</small><strong>${b}</strong>`; core.appendChild(n); });
    }
  };

  const liveNewsFallback = () => {
    const box = document.querySelector('#newsCards');
    if (!box || box.dataset.jarvisLiveFallback === '1') return;
    if (box.children.length && !box.querySelector('.news-loading')) return;
    const select = document.querySelector('#newsGenre');
    const q = encodeURIComponent(select?.value || 'AI OR technology');
    const label = select?.selectedOptions?.[0]?.textContent || 'LIVE NEWS';
    const topics = [
      `${label} — live global stream`,
      `${label} — latest headlines`,
      `${label} — breaking developments`,
      `${label} — India and global coverage`,
      `${label} — technology and analysis`
    ];
    box.dataset.jarvisLiveFallback = '1';
    box.innerHTML = topics.map((title,i) => `<a class="news-card hud-news-card" href="https://news.google.com/search?q=${q}" target="_blank" rel="noopener noreferrer"><div><small>LIVE SEARCH · ${String(i+1).padStart(2,'0')}</small><strong>${title}</strong><span>Open the current ${label.toLowerCase()} stream</span></div><b>↗</b></a>`).join('');
    const ticker = document.querySelector('#newsTicker');
    if (ticker) ticker.innerHTML = `<span>LIVE NEWS STREAM READY · ${label} · TAP A HEADLINE TO OPEN THE CURRENT FEED</span>`;
  };

  const bindNewsRecovery = () => {
    const box = document.querySelector('#newsCards');
    if (!box || box.__jarvisNewsRecovery) return;
    box.__jarvisNewsRecovery = true;
    window.setTimeout(liveNewsFallback, 7000);
    document.querySelector('#refreshNews')?.addEventListener('click', () => {
      box.dataset.jarvisLiveFallback = '';
      window.setTimeout(liveNewsFallback, 7000);
    });
    document.querySelector('#newsGenre')?.addEventListener('change', () => {
      box.dataset.jarvisLiveFallback = '';
      window.setTimeout(liveNewsFallback, 7000);
    });
  };

  const boot = () => { observeVoiceButton(); decorateHome(); bindNewsRecovery(); };
  new MutationObserver(boot).observe(document.documentElement,{childList:true,subtree:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
