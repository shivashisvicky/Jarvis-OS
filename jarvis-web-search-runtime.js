(() => {
  'use strict';

  const escapeHtml = s => String(s).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  const getProviderUrl = (provider, query) => {
    const q = encodeURIComponent(String(query || '').trim());
    if (provider === 'bing') return `https://www.bing.com/search?q=${q}`;
    if (provider === 'youtube') return `https://www.youtube.com/results?search_query=${q}`;
    if (provider === 'news') return `https://www.google.com/search?tbm=nws&q=${q}`;
    return `https://search.brave.com/search?q=${q}`;
  };

  const ensure = () => {
    const input = document.querySelector('#webQuery');
    const button = document.querySelector('#webSearch');
    if (!input || !button) return null;

    let status = document.querySelector('#jwsStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'jwsStatus';
      status.className = 'jws-runtime-status';
      button.parentElement?.after(status);
    }

    return { input, button, status };
  };

  const provider = () => document.querySelector('#webProvider')?.value || 'brave';

  const openSearch = (query, engine) => {
    const text = String(query || '').trim();
    const x = ensure();
    if (!text || !x) return false;

    const url = getProviderUrl(engine || provider(), text);
    x.status.textContent = `OPENING ${String(engine || provider()).toUpperCase()} SEARCH`;

    try {
      const tab = window.open(url, '_blank', 'noopener,noreferrer');
      if (!tab) {
        // Popup blockers must not be allowed to kill the SPA.
        x.status.textContent = 'POPUP BLOCKED · ALLOW NEW TABS TO OPEN SEARCH';
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'OPEN SEARCH';
        a.className = 'jws-fallback-link';
        x.status.appendChild(document.createTextNode(' · '));
        x.status.appendChild(a);
      }
    } catch (error) {
      console.error('JARVIS Search Hub failed to open provider', error);
      x.status.textContent = 'SEARCH OPEN FAILED · JARVIS REMAINS ONLINE';
    }

    return true;
  };

  const interceptClick = event => {
    const target = event.target?.closest?.('#webSearch, [data-provider]');
    if (!target) return;

    const x = ensure();
    if (!x) return;

    const query = x.input.value.trim();
    const engine = target.dataset.provider || provider();
    if (!query) {
      x.status.textContent = 'ENTER A SEARCH QUERY';
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    // Capture the event before the module-level setupWeb listener. That
    // listener re-renders the SPA after opening a provider, which caused the
    // Search Hub to disappear/reset on some Chromium builds.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openSearch(query, engine);
  };

  const interceptEnter = event => {
    if (event.key !== 'Enter' || event.target?.id !== 'webQuery') return;
    const x = ensure();
    if (!x) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openSearch(x.input.value, provider());
  };

  const style = () => {
    if (document.querySelector('#jws-runtime-style')) return;
    const s = document.createElement('style');
    s.id = 'jws-runtime-style';
    s.textContent = `
      #jwsStatus.jws-runtime-status{margin:10px 0 8px;padding:8px 10px;border:1px solid rgba(100,220,255,.16);background:rgba(2,10,15,.5);color:#73d9ee;font-size:8px;letter-spacing:.14em}
      #jwsStatus .jws-fallback-link{color:#73d9ee;text-decoration:underline;cursor:pointer}
    `;
    document.head.appendChild(s);
  };

  style();
  document.addEventListener('click', interceptClick, true);
  document.addEventListener('keydown', interceptEnter, true);
  new MutationObserver(() => { style(); ensure(); }).observe(document.documentElement, { childList:true, subtree:true });
})();
