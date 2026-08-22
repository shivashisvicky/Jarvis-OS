(() => {
  'use strict';
  if (window.__JARVIS_HOME_MODULES_FIX__) return;
  window.__JARVIS_HOME_MODULES_FIX__ = true;

  const extras = [
    ['maps', '⌖', 'Maps', 'INTELLIGENCE', 'Open Maps'],
    ['media', '▶', 'Media', 'INTELLIGENCE', 'Open Media'],
    ['api', '⇄', 'API Lab', 'ENGINEERING', 'Open API Lab'],
    ['remote', '↔', 'SFTP', 'ENGINEERING', 'Open SFTP'],
  ];

  const sync = () => {
    const grid = document.querySelector('.module-grid');
    if (!grid) return;
    for (const [id, icon, name, group, action] of extras) {
      if (grid.querySelector(`[data-app="${id}"]`)) continue;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'module-card jarvis-home-extra-module';
      card.dataset.app = id;
      card.innerHTML = `<span class="module-icon">${icon}</span><div><small>${group}</small><strong>${name}</strong><p>${action}</p></div><b>›</b>`;
      card.addEventListener('click', () => {
        document.querySelector(`.nav[data-app="${id}"]`)?.click();
      });
      grid.appendChild(card);
    }
  };

  const boot = () => requestAnimationFrame(sync);
  new MutationObserver(boot).observe(document.documentElement, { childList: true, subtree: true });
  boot();
})();
