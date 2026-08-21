(() => {
  'use strict';
  if (window.__JARVIS_EMERGENCY_CLICK_FIX__) return;
  window.__JARVIS_EMERGENCY_CLICK_FIX__ = true;

  const labels = new Map([
    ['Command', 'home'],
    ['Calc', 'calculator'],
    ['Games', 'snake'],
    ['Files', 'files'],
    ['Notes', 'notes'],
    ['Settings', 'settings'],
    ['API Lab', 'api'],
    ['SFTP', 'remote'],
    ['Search', 'web'],
    ['Maps', 'maps'],
    ['Media', 'media']
  ]);

  // The shell's generated nav markup previously contained a malformed quote
  // around the selected class, which swallowed data-app into the class value.
  // Repair that DOM contract before browser tests/users need to interact with it.
  const repairNav = (root = document) => {
    root.querySelectorAll?.('button.nav').forEach((button) => {
      if (button.getAttribute('data-app')) return;
      const label = button.querySelector('span')?.textContent?.trim() || button.textContent?.trim() || '';
      const app = labels.get(label);
      if (app) button.setAttribute('data-app', app);
    });
  };

  const observer = new MutationObserver(() => repairNav());
  const start = () => {
    repairNav();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };
  if (document.documentElement) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });

  document.addEventListener('pointerdown', (event) => {
    const nav = event.target?.closest?.('button.nav[data-app]');
    if (!nav) return;
    const app = nav.getAttribute('data-app');
    if (!app) return;
    if (typeof window.jarvisEmergencyNavigate === 'function') {
      event.preventDefault();
      window.jarvisEmergencyNavigate(app);
    }
  }, { capture: true });
})();
