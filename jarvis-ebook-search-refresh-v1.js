(() => {
  'use strict';
  if (window.__JARVIS_EBOOK_SEARCH_REFRESH_V1__) return;
  window.__JARVIS_EBOOK_SEARCH_REFRESH_V1__ = true;

  const patched = new WeakSet();

  const patch = () => {
    const panel = document.querySelector('#jbe6Panel');
    if (!panel) return;
    const button = panel.querySelector('#jbe6Search');
    const query = panel.querySelector('#jbe6Query');
    const results = panel.querySelector('#jbe6Results');
    const status = panel.querySelector('#jbe6StatusLine');
    if (!button || !query || !results || !status || patched.has(button) || typeof button.onclick !== 'function') return;

    const original = button.onclick;
    patched.add(button);

    button.onclick = (event) => {
      if (button.dataset.jarvisRefreshing === '1') return;

      button.dataset.jarvisRefreshing = '1';
      button.disabled = true;
      button.textContent = 'REFRESHING…';
      results.innerHTML = '';
      status.textContent = 'SEARCHING…';

      let attempt = 0;
      const run = () => {
        attempt += 1;
        results.innerHTML = '';
        try { original.call(button, event); }
        catch (error) { console.warn('[JARVIS ebook refresh]', error); }

        const started = Date.now();
        const poll = () => {
          const text = status.textContent.trim().toUpperCase();
          const resultText = results.textContent.toUpperCase();
          const hasResult = results.children.length > 0;
          const settled = hasResult || /^\d+ BOOKS$/.test(text) || /NO MATCHING BOOKS/.test(resultText);
          const failed = text === 'OFFLINE' || text === 'SEARCH ERROR';

          if (settled || (failed && attempt >= 3)) {
            button.dataset.jarvisRefreshing = '0';
            button.disabled = false;
            button.textContent = 'BROWSE';
            return;
          }

          if (failed) {
            status.textContent = 'RETRYING…';
            window.setTimeout(run, 700);
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

      run();
    };
  };

  new MutationObserver(patch).observe(document.body, { childList: true, subtree: true });
  window.setInterval(patch, 500);
  patch();
})();
