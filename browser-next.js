(() => {
  const STORAGE = 'jarvis.browser.session.v1';
  const MAX_TABS = 8;
  const MAX_HISTORY = 40;
  const DEFAULT_URL = 'https://search.brave.com';
  let enhanced = new WeakSet();

  const read = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE) || '{}'); } catch { return {}; }
  };
  const write = (state) => {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch {}
  };
  const esc = (value) => String(value).replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));
  const titleFor = (url) => {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, '') || 'New tab';
    } catch { return 'New tab'; }
  };

  function injectStyles() {
    if (document.getElementById('jarvis-browser-next-css')) return;
    const style = document.createElement('style');
    style.id = 'jarvis-browser-next-css';
    style.textContent = `
      .browser-next-tools{display:flex;align-items:center;gap:6px;margin-left:auto}
      .browser-next-tools button{border:1px solid #21414c;background:#08151c;color:#9bc5cf;border-radius:6px;padding:6px 9px;cursor:pointer;font-size:10px}
      .browser-next-tools button.active{color:#55d6ff;border-color:#55d6ff}
      .browser-tab{display:inline-flex;align-items:center;gap:7px;max-width:190px}
      .browser-tab .tab-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .browser-tab .tab-close{border:0;background:transparent;color:#66818a;padding:0 2px;cursor:pointer}
      .browser-tab.active{border-color:#55d6ff;background:#0d2731}
      .browser-history-panel{position:absolute;z-index:20;right:12px;top:88px;width:min(390px,calc(100% - 24px));max-height:330px;overflow:auto;background:#07151c;border:1px solid #21414c;border-radius:9px;box-shadow:0 20px 50px #000b;padding:8px}
      .browser-history-panel[hidden]{display:none}
      .browser-history-item{display:flex;width:100%;gap:10px;align-items:center;border:0;border-bottom:1px solid #142b33;background:transparent;color:#c9f5ff;text-align:left;padding:9px;cursor:pointer}
      .browser-history-item:last-child{border-bottom:0}
      .browser-history-item small{display:block;color:#58737d;font-size:9px;margin-top:2px}
      .browser-shell{position:relative}
      .browser-bookmark{color:#55d6ff!important}
    `;
    document.head.appendChild(style);
  }

  function saveHistory(url) {
    const state = read();
    state.history = Array.isArray(state.history) ? state.history : [];
    state.history = [{url, title:titleFor(url), time:Date.now()}, ...state.history.filter(x => x.url !== url)].slice(0, MAX_HISTORY);
    write(state);
  }

  function toggleBookmark(url, button) {
    const state = read();
    state.bookmarks = Array.isArray(state.bookmarks) ? state.bookmarks : [];
    const index = state.bookmarks.findIndex(x => x.url === url);
    if (index >= 0) state.bookmarks.splice(index, 1);
    else state.bookmarks.unshift({url, title:titleFor(url)});
    state.bookmarks = state.bookmarks.slice(0, MAX_HISTORY);
    write(state);
    button.classList.toggle('active', index < 0);
    button.textContent = index < 0 ? '★' : '☆';
    button.title = index < 0 ? 'Remove bookmark' : 'Bookmark this page';
  }

  function currentUrl(shell) {
    return shell.querySelector('#browserAddress')?.value?.trim() || DEFAULT_URL;
  }

  function navigate(shell, url) {
    const address = shell.querySelector('#browserAddress');
    const go = shell.querySelector('#browserGo');
    if (!address || !go) return;
    address.value = url;
    go.click();
    saveHistory(url);
  }

  function setupTabs(shell) {
    const tabStrip = shell.querySelector('.browser-tabs');
    if (!tabStrip || tabStrip.dataset.jarvisNext === '1') return;
    tabStrip.dataset.jarvisNext = '1';
    const state = read();
    state.tabs = Array.isArray(state.tabs) && state.tabs.length ? state.tabs : [{url:currentUrl(shell), title:'JARVIS'}];
    state.activeTab = Math.min(Number(state.activeTab) || 0, state.tabs.length - 1);
    write(state);

    const engine = tabStrip.querySelector('.browser-engine');
    tabStrip.querySelectorAll('.browser-tab').forEach(el => el.remove());
    const renderTabs = () => {
      tabStrip.querySelectorAll('.browser-tab').forEach(el => el.remove());
      state.tabs.forEach((tab, index) => {
        const button = document.createElement('button');
        button.className = 'browser-tab' + (index === state.activeTab ? ' active' : '');
        button.title = tab.url;
        button.innerHTML = `<span class="tab-title">${esc(tab.title || titleFor(tab.url))}</span><span class="tab-close" aria-label="Close tab">×</span>`;
        button.addEventListener('click', event => {
          if (event.target instanceof HTMLElement && event.target.classList.contains('tab-close')) {
            event.stopPropagation();
            if (state.tabs.length === 1) state.tabs[0] = {url:DEFAULT_URL,title:'New tab'};
            else state.tabs.splice(index, 1);
            state.activeTab = Math.max(0, Math.min(state.activeTab, state.tabs.length - 1));
            write(state);
            renderTabs();
            navigate(shell, state.tabs[state.activeTab].url);
            return;
          }
          state.activeTab = index;
          write(state);
          renderTabs();
          navigate(shell, state.tabs[index].url);
        });
        tabStrip.insertBefore(button, engine || null);
      });
      const add = document.createElement('button');
      add.className = 'browser-tab';
      add.textContent = '+ New tab';
      add.title = 'Open a new JARVIS tab';
      add.addEventListener('click', () => {
        if (state.tabs.length >= MAX_TABS) state.tabs.shift();
        state.tabs.push({url:DEFAULT_URL,title:'New tab'});
        state.activeTab = state.tabs.length - 1;
        write(state);
        renderTabs();
        navigate(shell, DEFAULT_URL);
      });
      tabStrip.insertBefore(add, engine || null);
    };
    renderTabs();

    const toolbar = shell.querySelector('.browser-toolbar');
    if (!toolbar || toolbar.querySelector('.browser-next-tools')) return;
    const tools = document.createElement('div');
    tools.className = 'browser-next-tools';
    tools.innerHTML = '<button class="browser-bookmark" id="browserBookmark" title="Bookmark this page">☆</button><button id="browserHistory" title="History">HISTORY</button>';
    toolbar.appendChild(tools);

    const bookmark = tools.querySelector('#browserBookmark');
    const refreshBookmark = () => {
      const url = currentUrl(shell), s = read(), list = Array.isArray(s.bookmarks) ? s.bookmarks : [];
      const active = list.some(x => x.url === url);
      bookmark.classList.toggle('active', active);
      bookmark.textContent = active ? '★' : '☆';
      bookmark.title = active ? 'Remove bookmark' : 'Bookmark this page';
    };
    bookmark.addEventListener('click', () => { toggleBookmark(currentUrl(shell), bookmark); });

    const historyButton = tools.querySelector('#browserHistory');
    historyButton.addEventListener('click', () => {
      let panel = shell.querySelector('.browser-history-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'browser-history-panel';
        shell.appendChild(panel);
      }
      const s = read();
      const items = [...(s.bookmarks || []).map(x => ({...x, kind:'BOOKMARK'})), ...(s.history || []).map(x => ({...x, kind:'HISTORY'}))].slice(0, 30);
      panel.innerHTML = items.length ? items.map(x => `<button class="browser-history-item" data-url="${esc(x.url)}"><span>●</span><div><strong>${esc(x.title || titleFor(x.url))}</strong><small>${esc(x.kind)} · ${esc(x.url)}</small></div></button>`).join('') : '<div class="empty">No browser history yet.</div>';
      panel.querySelectorAll('.browser-history-item').forEach(item => item.addEventListener('click', () => {
        navigate(shell, item.getAttribute('data-url') || DEFAULT_URL);
        panel.hidden = true;
      }));
      panel.hidden = !panel.hidden;
      refreshBookmark();
    });

    const address = shell.querySelector('#browserAddress');
    address?.addEventListener('change', refreshBookmark);
    address?.addEventListener('input', refreshBookmark);
    shell.querySelector('#browserFrame')?.addEventListener('load', () => {
      const url = currentUrl(shell);
      saveHistory(url);
      const index = state.activeTab;
      if (state.tabs[index]) {
        state.tabs[index] = {url, title:titleFor(url)};
        write(state);
        renderTabs();
      }
      refreshBookmark();
    });
    refreshBookmark();
  }

  function enhance() {
    injectStyles();
    document.querySelectorAll('.browser-shell').forEach(shell => {
      if (!(shell instanceof HTMLElement) || enhanced.has(shell)) return;
      enhanced.add(shell);
      setupTabs(shell);
    });
  }

  new MutationObserver(enhance).observe(document.documentElement, {subtree:true, childList:true});
  window.addEventListener('load', enhance);
  enhance();
})();
