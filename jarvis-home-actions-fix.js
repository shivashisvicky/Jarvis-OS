(() => {
  'use strict';
  if (window.__JARVIS_HOME_ACTIONS_FIX_V5__) return;
  window.__JARVIS_HOME_ACTIONS_FIX_V5__ = true;

  const runCommand = text => {
    const input = document.querySelector('#commandInput');
    const form = document.querySelector('#commandForm');
    if (!input || !form) return false;
    input.value = text;
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else form.dispatchEvent(new Event('submit', {bubbles:true,cancelable:true}));
    return true;
  };

  const openApp = id => {
    const nav = document.querySelector(`button.nav[data-app="${id}"]`);
    if (!nav) return false;
    nav.click();
    return true;
  };

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));

  function renderBriefFromNews() {
    const quick = document.querySelector('#jhuQuick');
    if (!quick) return false;
    const cards = [...document.querySelectorAll('#newsCards .news-dense-item')];
    if (!cards.length) return false;
    document.querySelector('#jhuDirectBrief')?.remove();
    const box = document.createElement('section');
    box.id = 'jhuDirectBrief';
    box.className = 'jhu-brief visible';
    const items = cards.slice(0, 5).map((card, i) => {
      const link = card.getAttribute('href') || '#';
      const title = card.querySelector('.news-title')?.textContent?.trim() || 'Untitled story';
      const source = card.querySelector('.news-source')?.textContent?.trim() || 'LIVE NEWS';
      return `<div class="jhu-brief-item"><span class="jhu-brief-num">${String(i + 1).padStart(2,'0')}</span><span><a href="${esc(link)}" target="_blank" rel="noreferrer">${esc(title)}</a><small>${esc(source)}</small></span></div>`;
    }).join('');
    box.innerHTML = `<div class="jhu-brief-head"><strong>TODAY'S INTELLIGENCE BRIEF</strong><span>${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · LIVE</span></div><div class="jhu-brief-list">${items}</div><div class="jhu-brief-foot"><button type="button" id="jhuDirectOpenNews">OPEN FULL NEWS DESK →</button></div>`;
    quick.insertAdjacentElement('afterend', box);
    box.querySelector('#jhuDirectOpenNews')?.addEventListener('click', () => document.querySelector('#newsDesk')?.scrollIntoView({behavior:'smooth',block:'start'}));
    box.scrollIntoView({behavior:'smooth',block:'nearest'});
    return true;
  }

  let lastBriefAt = 0;
  const openBrief = () => {
    const now = Date.now();
    if (now - lastBriefAt < 500) return;
    lastBriefAt = now;
    if (renderBriefFromNews()) return;
    if (typeof window.JARVIS_OPEN_DAILY_BRIEF === 'function') {
      window.JARVIS_OPEN_DAILY_BRIEF();
      return;
    }
    window.dispatchEvent(new CustomEvent('jarvis:open-daily-brief'));
  };

  function bindButton(button) {
    if (!(button instanceof HTMLButtonElement) || button.dataset.touchBound === 'v5') return;
    button.dataset.touchBound = 'v5';
    const activate = event => {
      event.preventDefault();
      event.stopPropagation();
      if (event.type === 'click') event.stopImmediatePropagation();
      if ((button.textContent || '').includes("TODAY'S BRIEF")) openBrief();
      else {
        const command = button.getAttribute('data-cmd');
        const app = button.getAttribute('data-app');
        if (command) runCommand(command);
        else if (app) openApp(app);
      }
    };
    button.addEventListener('pointerdown', activate, {capture:true});
    button.addEventListener('touchstart', activate, {capture:true, passive:false});
    button.addEventListener('click', activate, {capture:true});
  }

  const bind = () => document.querySelectorAll('#jhuQuick button').forEach(bindButton);
  bind();
  new MutationObserver(bind).observe(document.documentElement, {childList:true,subtree:true});
})();
