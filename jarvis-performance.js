/* J.A.R.V.I.S. Performance Monitoring */
(() => {
  'use strict';
  if (window.__JARVIS_PERF__) return;
  window.__JARVIS_PERF__ = true;

  const metrics = {};

  window.jarvisMetrics = {
    mark: (name) => {
      metrics[name] = performance.now();
    },
    measure: (name, from, to) => {
      if (!metrics[from] || !metrics[to]) return 0;
      const duration = metrics[to] - metrics[from];
      console.log(`[PERF] ${name}: ${Math.round(duration)}ms`);
      return duration;
    }
  };
})();
