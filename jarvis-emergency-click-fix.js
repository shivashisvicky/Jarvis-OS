(() => {
  'use strict';
  if (window.__JARVIS_EMERGENCY_CLICK_FIX__) return;
  window.__JARVIS_EMERGENCY_CLICK_FIX__ = true;
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
