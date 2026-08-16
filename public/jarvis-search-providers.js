(() => {
  'use strict';

  const PROVIDERS = [
    { id: 'brave', label: 'BRAVE' },
    { id: 'bing', label: 'BING' },
  ];

  function mount() {
    const select = document.querySelector('#webProvider');
    if (!(select instanceof HTMLSelectElement)) return;

    let wrap = select.parentElement?.querySelector('.jarvis-provider-buttons');
    if (!(wrap instanceof HTMLElement)) {
      wrap = document.createElement('div');
      wrap.className = 'jarvis-provider-buttons';
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-label', 'Search providers');
      select.insertAdjacentElement('afterend', wrap);
    }

    // Reconcile the DOM on every pass. Other JARVIS runtime layers are allowed
    // to re-render the workspace, so a one-time "already mounted" flag is not
    // sufficient. The invariant is: Brave + Bing buttons must exist whenever
    // #webProvider exists.
    for (const { id, label } of PROVIDERS) {
      let button = wrap.querySelector(`button[data-provider="${id}"]`);
      if (!(button instanceof HTMLButtonElement)) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'provider-button';
        button.dataset.provider = id;
        button.textContent = label;
        button.addEventListener('click', () => {
          if (!select.isConnected) return;
          select.value = id;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          sync();
        });
        wrap.appendChild(button);
      }
    }

    const sync = () => wrap.querySelectorAll('button[data-provider]').forEach((b) => {
      b.classList.toggle('selected', b.dataset.provider === select.value);
      b.setAttribute('aria-pressed', b.dataset.provider === select.value ? 'true' : 'false');
    });

    if (!select.dataset.jarvisProviderSync) {
      select.dataset.jarvisProviderSync = '1';
      select.addEventListener('change', sync);
    }
    sync();
  }

  const observer = new MutationObserver(() => mount());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
