(() => {
  'use strict';
  const nativeSetInterval = window.setInterval.bind(window);
  window.setInterval = function(fn, delay, ...args) {
    if (delay === 15000) {
      console.info('[JARVIS:stability] blocked 15-second refresh timer');
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
