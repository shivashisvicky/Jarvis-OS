(() => {
  'use strict';

  const HOST = 'jarvis-intelligence.shivashisvicky112.workers.dev';
  const originalFetch = window.fetch.bind(window);
  const state = { active: 0, last: null, history: [] };
  window.__JARVIS_NEWS_DEBUG__ = state;

  function writeDiagnostic(message) {
    const status = document.querySelector('#newsStatus');
    const cards = document.querySelector('#newsCards');
    if (!status || !cards) return;
    status.textContent = 'DEGRADED';
    cards.innerHTML = `<div class="news-empty"><strong>News gateway diagnostic</strong><br>${String(message).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}</div>`;
  }

  window.fetch = async (input, init) => {
    const requestUrl = typeof input === 'string' ? input : input?.url;
    let url;
    try { url = new URL(requestUrl, location.href); } catch { return originalFetch(input, init); }
    if (url.hostname !== HOST || url.pathname !== '/api/search') return originalFetch(input, init);

    const query = url.searchParams.get('q') || '';
    const started = performance.now();
    const entry = { query, url: url.toString(), startedAt: new Date().toISOString(), status: null, elapsedMs: null, provider: null, resultCount: null, error: null };
    state.active += 1;
    state.history.push(entry);
    state.history = state.history.slice(-10);
    state.last = entry;
    console.info('[JARVIS NEWS] request', entry);

    const diagnosticTimer = window.setTimeout(() => {
      if (entry.elapsedMs == null) {
        const msg = `Request still pending after 8s<br><small>${entry.url}<br>Active requests: ${state.active}</small>`;
        console.warn('[JARVIS NEWS] pending', entry);
        writeDiagnostic(msg);
      }
    }, 8000);

    try {
      const response = await originalFetch(input, init);
      entry.status = response.status;
      entry.elapsedMs = Math.round(performance.now() - started);
      try {
        const data = await response.clone().json();
        entry.provider = data?.provider || null;
        entry.resultCount = Array.isArray(data?.results) ? data.results.length : 0;
        entry.error = data?.error || data?.code || null;
      } catch (error) {
        entry.error = `Invalid JSON: ${error?.message || error}`;
      }
      console.info('[JARVIS NEWS] response', entry);
      return response;
    } catch (error) {
      entry.elapsedMs = Math.round(performance.now() - started);
      entry.error = error?.message || String(error);
      console.error('[JARVIS NEWS] fetch failed', entry);
      writeDiagnostic(`HTTP n/a · ${entry.error}<br><small>${entry.url}<br>${entry.elapsedMs}ms</small>`);
      throw error;
    } finally {
      window.clearTimeout(diagnosticTimer);
      state.active = Math.max(0, state.active - 1);
    }
  };
})();
