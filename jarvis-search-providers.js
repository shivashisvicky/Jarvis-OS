(() => {
  'use strict';
  const PROVIDERS = [
    { id: 'brave', label: 'BRAVE' },
    { id: 'bing', label: 'BING' }
  ];
  let scheduled = false;

  function install() {
    const select = document.querySelector('#webProvider');
    if (!select || !select.parentElement) return false;
    const parent = select.parentElement;
    let bar = parent.querySelector('.search-provider-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'search-provider-bar';
      bar.setAttribute('aria-label', 'Search providers');
      bar.innerHTML = PROVIDERS.map(p => `<button type="button" class="provider-btn" data-provider="${p.id}" aria-label="${p.label} Search">${p.label}</button>`).join('');
      parent.appendChild(bar);
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
    return !!bar.querySelector('button[data-provider="brave"]') && !!bar.querySelector('button[data-provider="bing"]');
  }

  function scheduleInstall() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; install(); });
  }

  function boot() {
    install();
    // main.ts replaces workspace DOM on navigation, so this observer must remain alive.
    const observer = new MutationObserver(scheduleInstall);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(install, 50);
    setTimeout(install, 250);
    setTimeout(install, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
