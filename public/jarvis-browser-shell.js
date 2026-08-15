(() => {
  const providers = {
    bing: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    brave: q => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
    google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    duck: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`
  };

  const escapeHtml = value => String(value).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  function browserMarkup() {
    return `
      <div class="apphead jarvis-browser-head">
        <div>
          <p class="eyebrow">JARVIS / SPATIAL WEB RUNTIME</p>
          <h2>JARVIS Browser</h2>
          <p class="sub">A browser surface inside the command shell. Navigation stays in this workspace.</p>
        </div>
        <span class="badge">IN-SHELL</span>
      </div>
      <section class="jarvis-browser">
        <div class="browser-toolbar">
          <button id="browserBack" title="Back">‹</button>
          <button id="browserForward" title="Forward">›</button>
          <button id="browserReload" title="Reload">↻</button>
          <input id="browserAddress" autocomplete="off" spellcheck="false" placeholder="Search or enter a web address…" value="https://example.com">
          <button id="browserGo" class="primary">GO</button>
        </div>
        <div class="browser-providers">
          <button data-provider="bing">BING</button>
          <button data-provider="brave">BRAVE</button>
          <button data-provider="google">GOOGLE</button>
          <button data-provider="duck">DUCKDUCKGO</button>
          <span id="browserStatus">JARVIS WEB CHANNEL READY</span>
        </div>
        <div class="browser-frame-wrap">
          <div class="browser-grid"></div>
          <iframe id="browserFrame" title="JARVIS Browser viewport" src="https://example.com" loading="eager" referrerpolicy="no-referrer"></iframe>
        </div>
      </section>`;
  }

  function upgrade() {
    const workspace = document.querySelector('.workspace');
    if (!workspace || workspace.dataset.browserShell === '1') return;
    const heading = workspace.querySelector('h2');
    if (!heading || heading.textContent?.trim() !== 'Web Console') return;

    workspace.dataset.browserShell = '1';
    workspace.innerHTML = browserMarkup();
    wire();
  }

  function wire() {
    const frame = document.querySelector('#browserFrame');
    const address = document.querySelector('#browserAddress');
    const status = document.querySelector('#browserStatus');
    if (!(frame instanceof HTMLIFrameElement) || !(address instanceof HTMLInputElement)) return;

    const history = ['https://example.com'];
    let position = 0;

    const setStatus = text => { if (status) status.textContent = text; };
    const normalize = raw => {
      const value = raw.trim();
      if (!value) return 'https://example.com';
      if (/^https?:\/\//i.test(value)) return value;
      if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(value)) return `https://${value}`;
      return providers.brave(value);
    };
    const navigate = (url, record = true) => {
      try {
        const target = new URL(url, location.href).toString();
        address.value = target;
        frame.src = target;
        if (record) {
          history.splice(position + 1);
          history.push(target);
          position = history.length - 1;
        }
        setStatus(`WEB CHANNEL // ${new URL(target).host}`);
      } catch {
        setStatus('INVALID WEB ADDRESS');
      }
    };

    document.querySelector('#browserGo')?.addEventListener('click', () => navigate(normalize(address.value)));
    address.addEventListener('keydown', event => {
      if (event.key === 'Enter') navigate(normalize(address.value));
    });
    document.querySelector('#browserBack')?.addEventListener('click', () => {
      if (position > 0) { position--; navigate(history[position], false); }
    });
    document.querySelector('#browserForward')?.addEventListener('click', () => {
      if (position < history.length - 1) { position++; navigate(history[position], false); }
    });
    document.querySelector('#browserReload')?.addEventListener('click', () => {
      frame.contentWindow?.location.reload();
      setStatus('RELOADING WEB CHANNEL…');
    });
    frame.addEventListener('load', () => {
      setStatus(`WEB CHANNEL // ${(() => { try { return new URL(address.value).host; } catch { return 'READY'; } })()}`);
    });
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('[data-provider]') : null;
    if (!target || !document.querySelector('#browserFrame')) return;
    const provider = target.getAttribute('data-provider');
    if (!provider || !providers[provider]) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const address = document.querySelector('#browserAddress');
    const frame = document.querySelector('#browserFrame');
    const status = document.querySelector('#browserStatus');
    if (!(address instanceof HTMLInputElement) || !(frame instanceof HTMLIFrameElement)) return;
    const query = address.value.trim();
    const url = providers[provider](query || 'JARVIS OS');
    address.value = url;
    frame.src = url;
    if (status) status.textContent = `${provider.toUpperCase()} SEARCH // IN-SHELL`;
  }, true);

  const observer = new MutationObserver(upgrade);
  observer.observe(document.documentElement, {childList: true, subtree: true});
  upgrade();
})();
