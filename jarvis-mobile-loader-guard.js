(() => {
  'use strict';
  if (window.__JARVIS_MOBILE_LOADER_GUARD__) return;
  window.__JARVIS_MOBILE_LOADER_GUARD__ = true;

  const wrap = (loader) => {
    if (typeof loader !== 'function' || loader.__jarvisMobileGuard) return loader;
    const guarded = (feature) => feature === 'mobile' ? Promise.resolve(true) : loader(feature);
    guarded.__jarvisMobileGuard = true;
    return guarded;
  };

  let value;
  Object.defineProperty(window, 'jarvisLoadFeature', {
    configurable: true,
    get() { return value; },
    set(fn) { value = wrap(fn); },
  });
})();
