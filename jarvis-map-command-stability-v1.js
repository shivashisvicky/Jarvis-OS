(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__JARVIS_MAP_COMMAND_STABILITY_V1__) return;
  window.__JARVIS_MAP_COMMAND_STABILITY_V1__ = true;

  let lastIntent = '';
  let applying = false;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  const restore = () => {
    if (!lastIntent || applying) return;
    const heading = document.querySelector('.page-head h1');
    const input = document.querySelector('#mapQuery');
    if (!(input instanceof HTMLInputElement) || heading?.textContent?.trim() !== 'Maps') return;
    if (input.value.trim()) return;

    applying = true;
    input.value = lastIntent;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const search = document.querySelector('#mapSearch');
    if (search instanceof HTMLButtonElement) search.click();
    window.setTimeout(() => { applying = false; }, 250);
  };

  window.addEventListener('jarvis:map-intent', event => {
    const value = clean(event.detail?.place || event.detail?.query);
    if (!value) return;
    lastIntent = value;
    window.setTimeout(restore, 100);
    window.setTimeout(restore, 600);
    window.setTimeout(restore, 1800);
  }, true);

  new MutationObserver(() => window.setTimeout(restore, 0)).observe(document.documentElement, {childList:true,subtree:true});
})();
