(() => {
  const PROVIDERS = [
    { id: 'brave', label: 'BRAVE' },
    { id: 'bing', label: 'BING' },
  ];

  function mount() {
    const select = document.querySelector('#webProvider');
    if (!select) return;
    const host = select.parentElement;
    if (!host || host.querySelector('.jarvis-provider-buttons')) return;

    const wrap = document.createElement('div');
    wrap.className = 'jarvis-provider-buttons';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Search providers');

    PROVIDERS.forEach(({ id, label }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'provider-button';
      button.dataset.provider = id;
      button.textContent = label;
      button.addEventListener('click', () => {
        select.value = id;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        wrap.querySelectorAll('button').forEach((b) => b.classList.toggle('selected', b === button));
      });
      wrap.appendChild(button);
    });

    select.insertAdjacentElement('afterend', wrap);
    const sync = () => wrap.querySelectorAll('button').forEach((b) => b.classList.toggle('selected', b.dataset.provider === select.value));
    select.addEventListener('change', sync);
    sync();
  }

  const observer = new MutationObserver(mount);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
