(() => {
  'use strict';
  if (window.__JARVIS_SEARCH_PROVIDER_FIDELITY_V1__) return;
  window.__JARVIS_SEARCH_PROVIDER_FIDELITY_V1__ = true;

  // The selected provider is authoritative for the Search Hub UI. Some backend
  // result records carry an internal/source label from a fallback engine.
  // Never let that leak into the user-facing provider label.
  const syncProviderLabels = () => {
    const provider = document.querySelector('#webProvider')?.value === 'brave' ? 'BRAVE' : 'BING';
    const status = document.querySelector('#jwsStatus');
    if (status && /RESULTS\s·/i.test(status.textContent || '')) {
      status.textContent = status.textContent.replace(/RESULTS\s·\s*\w+/i, `RESULTS · ${provider}`);
    }
    document.querySelectorAll('#jwsResults .web-result small').forEach(node => {
      const text = node.textContent || '';
      const dot = text.indexOf(' · ');
      const snippet = dot >= 0 ? text.slice(dot) : '';
      if (text && !text.startsWith(provider)) node.textContent = provider + snippet;
    });
  };

  new MutationObserver(syncProviderLabels).observe(document.body, { subtree: true, childList: true, characterData: true });
  document.addEventListener('change', event => {
    if (event.target?.id === 'webProvider') syncProviderLabels();
  }, true);
})();
