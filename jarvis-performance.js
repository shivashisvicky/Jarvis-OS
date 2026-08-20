/* J.A.R.V.I.S. lightweight performance markers. No global timer/DOM monkey-patching. */
(() => {
  'use strict';
  if (window.__JARVIS_PERF__) return;
  window.__JARVIS_PERF__ = true;
  const metrics = Object.create(null);
  window.jarvisMetrics = {
    mark(name) { metrics[name] = performance.now(); },
    measure(name, from, to) {
      if (metrics[from] == null || metrics[to] == null) return 0;
      return metrics[to] - metrics[from];
    }
  };
})();
