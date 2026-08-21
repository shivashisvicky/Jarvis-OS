(() => {
  'use strict';
  if (window.__jarvisNewsController) return;
  window.__jarvisNewsController = true;

  const refresh = () => {
    const button = document.querySelector('#refreshNews');
    if (button instanceof HTMLButtonElement) button.click();
  };

  const bind = () => {
    document.addEventListener('change', event => {
      const target = event.target;
      if (target instanceof HTMLSelectElement && target.id === 'newsGenre') {
        // Let the select value settle before invoking the existing News loader.
        window.setTimeout(refresh, 0);
      }
    });

    window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (document.querySelector('#newsDesk')) refresh();
    }, 10 * 60 * 1000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
