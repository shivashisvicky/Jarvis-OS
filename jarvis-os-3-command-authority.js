(() => {
  'use strict';

  const directionPattern = /\b(?:give\s+me\s+)?(?:directions?|route|navigate|way)\s+(?:to|for)\s+(.+)/i;
  const mapPattern = /\b(?:open\s+)?maps?\b.*\b(?:find|search|locate|where\s+is)\b\s+(.+)/i;

  const run = raw => {
    const text = String(raw || '').trim();
    if (!text) return false;

    const direction = text.match(directionPattern);
    if (direction?.[1]?.trim()) {
      const destination = direction[1].trim();
      window.dispatchEvent(new CustomEvent('jarvis:navigate-map', { detail: { destination } }));
      return true;
    }

    const map = text.match(mapPattern);
    if (map?.[1]?.trim()) {
      window.dispatchEvent(new CustomEvent('jarvis:navigate-map', { detail: { destination: map[1].trim() } }));
      return true;
    }

    return false;
  };

  const wire = () => {
    const form = document.querySelector('#commandForm');
    if (!form || form.dataset.v3Command) return;
    form.dataset.v3Command = '1';

    form.addEventListener('submit', event => {
      const input = form.querySelector('#commandInput');
      const handled = run(input?.value);

      // Never allow native form submission to reload the SPA.
      // Unhandled commands continue to the existing JARVIS command handler.
      event.preventDefault();
      if (handled) event.stopImmediatePropagation();
    }, true);
  };

  wire();
  new MutationObserver(wire).observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('jarvis:voice-command', event => {
    if (run(event.detail?.text)) event.preventDefault();
  });

  window.jarvisV3Command = { run };
})();
