(() => {
  'use strict';

  const ensure = () => {
    const input = document.querySelector('#webQuery');
    const btn = document.querySelector('#webSearch');
    if (!input || !btn) return null;

    let status = document.querySelector('#jwsStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'jwsStatus';
      status.className = 'jws-runtime-status';
      status.textContent = 'READY · EXTERNAL SEARCH';
      btn.parentElement?.after(status);
    }
    return { input, btn, status };
  };

  const update = () => {
    const x = ensure();
    if (x) x.status.textContent = 'READY · EXTERNAL SEARCH';
  };

  const style = () => {
    if (document.querySelector('#jws-runtime-style')) return;
    const s = document.createElement('style');
    s.id = 'jws-runtime-style';
    s.textContent = `
      #jwsStatus.jws-runtime-status {
        margin:10px 0 8px;
        padding:8px 10px;
        border:1px solid rgba(100,220,255,.16);
        background:rgba(2,10,15,.5);
        color:#73d9ee;
        font-size:8px;
        letter-spacing:.14em;
      }
    `;
    document.head.appendChild(s);
  };

  // Do not proxy or scrape search-engine HTML from the browser. That path was
  // dependent on r.jina.ai + DuckDuckGo and frequently degraded. The main
  // Search Hub runtime owns execution and opens the selected provider directly.
  style();
  update();
  new MutationObserver(() => {
    style();
    update();
  }).observe(document.documentElement, { childList:true, subtree:true });
})();
