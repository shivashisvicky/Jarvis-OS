(() => {
  'use strict';
  if (window.__JARVIS_HOME_SEARCH__) return;
  window.__JARVIS_HOME_SEARCH__ = true;

  function addHomeSearchShortcut() {
    const home = document.querySelector('#workspace .module-grid');
    if (!home || document.querySelector('#jarvis-home-search-card')) return;
    const card = document.createElement('button');
    card.type = 'button';
    card.id = 'jarvis-home-search-card';
    card.className = 'module-card';
    card.setAttribute('aria-label', 'Open Search Hub');
    card.innerHTML = '<span class="module-icon">⌕</span><div><small>INTELLIGENCE</small><strong>Search Hub</strong><p>Open live web search</p></div><b>›</b>';
    card.addEventListener('click', () => {
      const nav = document.querySelector('.nav[data-app="web"]');
      if (nav instanceof HTMLElement) nav.click();
    });
    home.prepend(card);
  }

  const boot = () => addHomeSearchShortcut();
  new MutationObserver(boot).observe(document.documentElement, { childList: true, subtree: true });
  boot();
})();
