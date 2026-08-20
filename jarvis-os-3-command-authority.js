(() => {
  'use strict';

  const routes = [
    {
      test: /(direction|directions|route|navigate|way)\s+(?:to|for)\s+(.+)/i,
      run: async (_, destination) => {
        const q = destination.trim();
        if (!q) return false;
        const params = new URLSearchParams({ q, layer: 'map' });
        window.dispatchEvent(new CustomEvent('jarvis:navigate-map', { detail: { destination: q, url: `?${params}` } }));
        const mapTab = document.querySelector('[data-app="maps"], [data-route="maps"], [data-nav="maps"]');
        if (mapTab instanceof HTMLElement) mapTab.click();
        return true;
      }
    },
    {
      test: /\b(map|maps|location|where is|find)\b.*\b(.+)/i,
      run: async (_, query) => {
        const q = String(query || '').trim();
        if (!q) return false;
        window.dispatchEvent(new CustomEvent('jarvis:navigate-map', { detail: { destination: q } }));
        return true;
      }
    }
  ];

  const run = async raw => {
    const text = String(raw || '').trim();
    for (const route of routes) {
      const match = text.match(route.test);
      if (!match) continue;
      try { return await route.run(...match); } catch { return false; }
    }
    return false;
  };

  const wire = () => {
    const form = document.querySelector('#commandForm');
    if (!form || form.dataset.v3Command) return;
    form.dataset.v3Command = '1';
    form.addEventListener('submit', async event => {
      const input = form.querySelector('#commandInput');
      if (!(await run(input?.value))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  };

  wire();
  new MutationObserver(wire).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('jarvis:voice-command', event => run(event.detail?.text));
  window.jarvisV3Command = { run };
})();
