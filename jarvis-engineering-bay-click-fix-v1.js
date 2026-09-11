(() => {
  'use strict';
  if (window.__JARVIS_ENGINEERING_BAY_CLICK_FIX_V1__) return;
  window.__JARVIS_ENGINEERING_BAY_CLICK_FIX_V1__ = true;

  const openBay = () => {
    const direct = window.jarvisOpenEngineeringBay;
    if (typeof direct === 'function') { direct(); return; }
    const load = window.jarvisLoadFeature;
    if (typeof load !== 'function') return;
    load('engineeringBay').then(() => {
      const ready = window.jarvisOpenEngineeringBay;
      if (typeof ready === 'function') ready();
      else window.dispatchEvent(new CustomEvent('jarvis:open-engineering-bay'));
    }).catch(error => console.warn('[JARVIS Engineering Bay click fix]', error));
  };

  const bind = () => {
    if (!document.documentElement || document.documentElement.dataset.engineeringBayClickFix) return;
    document.documentElement.dataset.engineeringBayClickFix = '1';
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest('[data-engineering-bay]') : null;
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openBay();
    }, true);
    document.addEventListener('touchend', event => {
      const target = event.target instanceof Element ? event.target.closest('[data-engineering-bay]') : null;
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openBay();
    }, {capture:true, passive:false});
  };

  bind();
  new MutationObserver(bind).observe(document.documentElement, {childList:true, subtree:true});
})();