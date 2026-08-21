(() => {
  'use strict';
  if (window.__JARVIS_SEARCH_GATEWAY__) return;
  window.__JARVIS_SEARCH_GATEWAY__ = true;
  const meta = () => document.querySelector('meta[name="jarvis-intelligence-endpoint"]')?.content || '';
  const base = () => meta().replace(/\/api\/(?:openai-intelligence|intelligence)\/?$/, '');
  const run = async (query, provider='brave') => {
    const r = await fetch(`${base()}/api/search`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,provider}),cache:'no-store'});
    if (!r.ok) throw new Error(`Search gateway HTTP ${r.status}`);
    return r.json();
  };
  window.jarvisSearchGateway = {run};
})();
