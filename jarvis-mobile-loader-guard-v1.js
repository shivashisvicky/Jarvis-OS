(() => {
  'use strict';
  if (window.__JARVIS_MOBILE_LOADER_GUARD__) return;
  window.__JARVIS_MOBILE_LOADER_GUARD__ = true;

  // Android needs the unified mobile layer for touch/overlay behavior.
  // iOS remains on the already-stable path to avoid disturbing its voice fixes.
  const android = /Android/i.test(navigator.userAgent || '');
  const wrap = (loader) => {
    if (typeof loader !== 'function' || loader.__jarvisMobileGuard) return loader;
    const guarded = (feature) => feature === 'mobile' && !android ? Promise.resolve(true) : loader(feature);
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
