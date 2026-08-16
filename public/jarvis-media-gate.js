(() => {
  'use strict';
  // Media is owned by the resilient video controller. A legacy bundled
  // experience layer still has a document-level capture handler, so this
  // window-level gate prevents that handler from hijacking real searches.
  window.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('#videoSearch') : null;
    if (!target) return;
    const search = window.jarvisVideoSearch;
    if (typeof search !== 'function') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void search();
  }, true);
})();
