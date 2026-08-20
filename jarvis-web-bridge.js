(() => {
  if (typeof window === 'undefined') return;
  window.setupWeb = window.setupWeb || function setupWeb() {
    // The dedicated jarvis-web-search.js installer owns the actual search UI.
    // This bridge keeps the TypeScript shell compatible with that provider.
  };
})();
