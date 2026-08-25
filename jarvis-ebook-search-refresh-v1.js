(() => {
  'use strict';
  if (window.__JARVIS_EBOOK_SEARCH_REFRESH_V1__) return;
  window.__JARVIS_EBOOK_SEARCH_REFRESH_V1__ = true;

  const run = (event, button, input) => {
    if (!button || !input || button.dataset.jarvisRefreshing === '1') return;
    const panel = button.closest('#jbe6Panel');
    const results = panel?.querySelector('#jbe6Results');
    const status = panel?.querySelector('#jbe6StatusLine');
    const original = button.onclick;
    if (!results || !status || typeof original !== 'function') return;

    event.preventDefault();
    event.stopImmediatePropagation();
    button.dataset.jarvisRefreshing = '1';
    button.disabled = true;
    button.textContent = 'REFRESHING…';
    results.innerHTML = '';
    status.textContent = 'SEARCHING…';

    let attempt = 0;
    const execute = () => {
      attempt += 1;
      results.innerHTML = '';
      try { original.call(button, event); }
      catch (error) { console.warn('[JARVIS ebook refresh]', error); }

      const started = Date.now();
      const poll = () => {
        const text = status.textContent.trim().toUpperCase();
        const resultText = results.textContent.toUpperCase();
        const hasResult = results.children.length > 0;
        const settled = hasResult || /^\d+ BOOKS$/.test(text) || /NO MATCHING BOOKS/.test(resultText) || /RESULTS · GUTENBERG/.test(text);
        const failed = text === 'OFFLINE' || text === 'SEARCH ERROR';

        if (settled || (failed && attempt >= 3)) {
          button.dataset.jarvisRefreshing = '0';
          button.disabled = false;
          button.textContent = 'BROWSE';
          return;
        }
        if (failed) {
          status.textContent = 'RETRYING…';
          window.setTimeout(execute, 700);
          return;
        }
        if (Date.now() - started < 22000) {
          window.setTimeout(poll, 120);
          return;
        }

        status.textContent = 'SEARCH ERROR';
        results.innerHTML = '<div class="jbe6-status">The public catalogue did not respond. Tap BROWSE to retry.</div>';
        button.dataset.jarvisRefreshing = '0';
        button.disabled = false;
        button.textContent = 'BROWSE';
      };
      window.setTimeout(poll, 120);
    };

    execute();
  };

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('#jbe6Search');
    if (!button) return;
    const input = button.closest('#jbe6Panel')?.querySelector('#jbe6Query');
    run(event, button, input);
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const input = event.target?.closest?.('#jbe6Query');
    if (!input) return;
    const button = input.closest('#jbe6Panel')?.querySelector('#jbe6Search');
    run(event, button, input);
  }, true);
})();
