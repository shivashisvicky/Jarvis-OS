(() => {
  'use strict';

  const PROVIDERS = [
    { id: 'brave', label: 'BRAVE' },
    { id: 'bing', label: 'BING' }
  ];

  let lastSelect = null;
  let observerStarted = false;

  function makeBar(select) {
    if (!select || !select.isConnected) return false;

    let bar = select.parentElement?.querySelector('.search-provider-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'search-provider-bar';
      bar.setAttribute('aria-label', 'Search providers');
      bar.innerHTML = PROVIDERS.map(p =>
        `<button type="button" class="provider-btn" data-provider="${p.id}" aria-label="${p.label} Search">${p.label}</button>`
      ).join('');

      // Insert immediately beside the real provider control. Do not depend on
      // a particular wrapper surviving JARVIS workspace re-renders.
      select.insertAdjacentElement('afterend', bar);
    }

    const current = select.value || 'brave';
    if (!select.value) select.value = current;

    bar.querySelectorAll('button[data-provider]').forEach(button => {
      const provider = button.dataset.provider;
      const selected = provider === select.value;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');

      if (!button.dataset.bound) {
        button.dataset.bound = 'true';
        button.addEventListener('click', () => {
          if (!provider || !select.isConnected) return;
          select.value = provider;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          bar.querySelectorAll('button[data-provider]').forEach(b => {
            const on = b.dataset.provider === provider;
            b.classList.toggle('selected', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        });
      }
    });

    lastSelect = select;
    return Boolean(
      bar.querySelector('button[data-provider="brave"]') &&
      bar.querySelector('button[data-provider="bing"]')
    );
  }

  function install() {
    const select = document.querySelector('#webProvider');
    if (!select) return false;
    return makeBar(select);
  }

  function boot() {
    // Fast path plus aggressive short-lived polling. The shell is intentionally
    // rendered/re-rendered by main.ts, so a single DOMContentLoaded hook is not
    // a reliable integration point.
    install();

    let attempts = 0;
    const timer = window.setInterval(() => {
      install();
      if (++attempts >= 240) window.clearInterval(timer); // ~12 seconds
    }, 50);

    if (!observerStarted) {
      observerStarted = true;
      const observer = new MutationObserver(() => {
        const select = document.querySelector('#webProvider');
        if (select !== lastSelect || !select?.parentElement?.querySelector('.search-provider-bar')) {
          install();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
