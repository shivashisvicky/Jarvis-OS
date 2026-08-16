(() => {
  'use strict';

  const PROVIDERS = [
    { id: 'brave', label: 'BRAVE' },
    { id: 'bing', label: 'BING' }
  ];

  function install() {
    const select = document.querySelector('#webProvider');
    if (!select) return false;

    const parent = select.parentElement;
    if (!parent) return false;

    let bar = parent.querySelector('.search-provider-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'search-provider-bar';
      bar.setAttribute('aria-label', 'Search providers');
      bar.innerHTML = PROVIDERS.map(p =>
        `<button type="button" class="provider-btn" data-provider="${p.id}" aria-label="${p.label} Search">${p.label}</button>`
      ).join('');
      parent.appendChild(bar);
    }

    const current = select.value || 'brave';
    if (!select.value) select.value = current;

    bar.querySelectorAll('button[data-provider]').forEach(button => {
      const provider = button.dataset.provider;
      button.classList.toggle('selected', provider === select.value);
      button.setAttribute('aria-pressed', provider === select.value ? 'true' : 'false');
      if (!button.dataset.bound) {
        button.dataset.bound = 'true';
        button.addEventListener('click', () => {
          if (!provider) return;
          select.value = provider;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          bar.querySelectorAll('button[data-provider]').forEach(b => {
            const selected = b.dataset.provider === provider;
            b.classList.toggle('selected', selected);
            b.setAttribute('aria-pressed', selected ? 'true' : 'false');
          });
        });
      }
    });

    return !!bar.querySelector('button[data-provider="brave"]') && !!bar.querySelector('button[data-provider="bing"]');
  }

  function boot() {
    if (install()) return;
    const observer = new MutationObserver(() => {
      if (install()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(install, 50);
    setTimeout(install, 250);
    setTimeout(install, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
