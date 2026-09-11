(() => {
  'use strict';
  if (window.__JARVIS_ENGINEERING_BAY_ENTRY_V1__) return;
  window.__JARVIS_ENGINEERING_BAY_ENTRY_V1__ = true;

  const addHomeEntry = () => {
    const grid = document.querySelector('.module-grid');
    if (!grid || grid.querySelector('[data-app="engineering-bay"]')) return;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'module-card';
    card.dataset.app = 'engineering-bay';
    card.innerHTML = '<span class="module-icon">⚙</span><div><small>ENGINEERING</small><strong>Engineering Bay</strong><p>JSON, JWT, Diff & API tools</p></div><b>›</b>';
    card.addEventListener('click', () => {
      const api = document.querySelector('[data-app="api"]');
      if (api instanceof HTMLElement) api.click();
    });
    grid.appendChild(card);
  };

  const addHint = () => {
    const workspace = document.querySelector('#workspace');
    if (!workspace || !document.querySelector('#jarvisApiLab') || document.querySelector('#jbayEntryHint')) return;
    const hint = document.createElement('div');
    hint.id = 'jbayEntryHint';
    hint.className = 'eng-status';
    hint.textContent = 'Engineering Bay is the intelligence toolbox above. API Lab remains the request client below.';
    workspace.querySelector('#jarvisApiLab')?.before(hint);
  };

  const observe = () => { addHomeEntry(); addHint(); };
  new MutationObserver(observe).observe(document.documentElement, { childList:true, subtree:true });
  observe();
})();
