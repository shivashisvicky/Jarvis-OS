(() => {
  'use strict';
  const original = window.open;
  window.open = function(url, ...args) {
    if (url && Array.isArray(window.__jarvisOpenedUrls)) window.__jarvisOpenedUrls.push(String(url));
    return original.call(window, url, ...args);
  };
})();
