(() => {
  'use strict';
  window.addEventListener('jarvis:orchestrated-command', event => {
    const command = String(event.detail?.command || '').toLowerCase();
    if (!/\bfind\s+videos?\b/.test(command)) return;
    const nav = document.querySelector('button.nav[data-app="media"]');
    if (nav) nav.click();
  });
})();
