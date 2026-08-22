(() => {
  'use strict';
  if (window.__JARVIS_HOME_ACTIONS_FIX__) return;
  window.__JARVIS_HOME_ACTIONS_FIX__ = true;

  const runCommand = text => {
    const input = document.querySelector('#commandInput');
    const submit = document.querySelector('#commandForm button[type="submit"]');
    if (!input || !submit) return false;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    submit.click();
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
    let desk = document.querySelector('#newsDesk');
    const anchors = [...(desk || document).querySelectorAll('a[href]')]
      .map(a => ({ title: (a.textContent || '').replace(/\s+/g, ' ').trim(), link: a.href }))
      .filter(x => x.title && x.title.length > 25 && /^https?:/i.test(x.link))
      .filter((x, i, arr) => arr.findIndex(y => y.title.toLowerCase() === x.title.toLowerCase()) === i)
      .slice(0, 5);
    if (!anchors.length) return false;
    document.querySelector('#jhuDirectBrief')?.remove();
    const box = document.createElement('section');
    box.id = 'jhuDirectBrief';
    box.className = 'jhu-brief';
    box.innerHTML = `<div class="jhu-brief-head"><strong>TODAY'S INTELLIGENCE BRIEF</strong><span>${esc(new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}</span></div><div class="jhu-brief-list">${anchors.map((x,i) => `<div class="jhu-brief-item"><span class="jhu-brief-num">${String(i+1).padStart(2,'0')}</span><span><a href="${esc(x.link)}" target="_blank" rel="noreferrer">${esc(x.title)}</a><small>LIVE NEWS</small></span></div>`).join('')}</div><div class="jhu-brief-foot"><button type="button" id="jhuDirectOpenNews">OPEN FULL NEWS DESK →</button></div>`;
    quick.insertAdjacentElement('afterend', box);
    box.querySelector('#jhuDirectOpenNews')?.addEventListener('click', () => document.querySelector('#newsDesk')?.scrollIntoView({behavior:'smooth',block:'start'}));
    box.scrollIntoView({behavior:'smooth',block:'nearest'});
    return true;
  }

  const openBrief = () => {
    if (renderBriefFromNews()) return;
    if (typeof window.JARVIS_OPEN_DAILY_BRIEF === 'function') {
      window.JARVIS_OPEN_DAILY_BRIEF();
      return;
    }
    window.dispatchEvent(new CustomEvent('jarvis:open-daily-brief'));
  };

  const handle = event => {
    const target = event.target instanceof Element ? event.target.closest('#jhuQuick button') : null;
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if ((target.textContent || '').includes("TODAY'S BRIEF")) {
      openBrief();
      return;
    }
    const command = target.getAttribute('data-cmd');
    const app = target.getAttribute('data-app');
    if (command) runCommand(command);
    else if (app) openApp(app);
  };

  document.addEventListener('click', handle, true);
  document.addEventListener('pointerup', handle, true);

  const style = document.createElement('style');
  style.textContent = '#jhuQuick{position:relative;z-index:20;pointer-events:auto}#jhuQuick button{position:relative;z-index:21;pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:rgba(88,217,255,.18)}.jhu-brief{margin:0 0 14px;padding:15px;border:1px solid rgba(77,210,255,.28);border-radius:15px;background:rgba(3,16,23,.94);box-shadow:0 0 28px rgba(0,180,255,.07)}.jhu-brief-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.jhu-brief-head strong{font-size:10px;letter-spacing:.18em;color:#63dcff}.jhu-brief-head span{font-size:9px;color:#557783}.jhu-brief-list{display:grid;gap:7px}.jhu-brief-item{display:grid;grid-template-columns:24px 1fr;gap:8px;padding:8px 0;border-top:1px solid rgba(72,142,166,.14)}.jhu-brief-item:first-child{border-top:0}.jhu-brief-num{color:#54d9ff;font-size:10px;font-weight:800}.jhu-brief-item a{color:#d9f7ff;text-decoration:none;font-size:12px;font-weight:700;line-height:1.35}.jhu-brief-item small{display:block;color:#607f8a;font-size:9px;margin-top:3px}.jhu-brief-foot{display:flex;justify-content:flex-end;margin-top:10px}.jhu-brief-foot button{border:1px solid rgba(74,179,211,.3);border-radius:999px;background:rgba(5,21,29,.9);color:#9bc5d1;padding:7px 10px;font:700 9px/1 inherit;letter-spacing:.08em}';
  document.head.appendChild(style);
})();
