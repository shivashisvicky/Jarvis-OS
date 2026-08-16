(() => {
  'use strict';
  const nativeSetInterval = window.setInterval.bind(window);
  window.setInterval = function(fn, delay, ...args) {
    const source = typeof fn === 'function' ? Function.prototype.toString.call(fn) : String(fn);
    if (delay === 15000 && /active\s*===\s*['"]home['"]/.test(source) && /render\s*\(/.test(source)) {
      console.info('[JARVIS:stability] blocked periodic home render to prevent operation interruption');
      return 0;
    }
    return nativeSetInterval(fn, delay, ...args);
  };
  const nativeAdd = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (this === window && (type === 'online' || type === 'offline') && typeof listener === 'function') {
      const source = Function.prototype.toString.call(listener);
      if (/render\s*\(/.test(source)) {
        console.info(`[JARVIS:stability] suppressed ${type} render listener`);
        return;
      }
    }
    return nativeAdd.call(this, type, listener, options);
  };
})();
