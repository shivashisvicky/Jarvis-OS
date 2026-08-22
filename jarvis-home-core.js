(() => {
  'use strict';
  if (window.__JARVIS_HOME_CORE_V2__) return;
  window.__JARVIS_HOME_CORE_V2__ = true;

  const esc = (value) => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  function styles() {
    if (document.getElementById('jhc-style-v2')) return;
    const s = document.createElement('style');
    s.id = 'jhc-style-v2';
    s.textContent = `
      .jhc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px;position:relative;z-index:5}
      .jhc-actions button{appearance:none;-webkit-appearance:none;touch-action:manipulation;pointer-events:auto;position:relative;z-index:6;border:1px solid rgba(74,179,211,.28);border-radius:999px;background:rgba(5,21,29,.94);color:#9bc5d1;padding:9px 12px;font:700 10px/1 inherit;letter-spacing:.06em;cursor:pointer}
      .jhc-actions button:active{transform:translateY(1px);border-color:#58d9ff;color:#e5fbff}
      .jhc-brief{display:none;margin:0 0 14px;padding:13px;border:1px solid rgba(77,210,255,.24);border-radius:13px;background:rgba(3,15,22,.94)}
      .jhc-brief.visible{display:block}
      .jhc-head{display:flex;justify-content:space-between;gap:8px;margin-bottom:7px}
      .jhc-head strong{font-size:10px;letter-spacing:.16em;color:#63dcff}.jhc-head span{font-size:9px;color:#557783}
      .jhc-story{display:flex;gap:9px;padding:8px 0;border-top:1px solid rgba(72,142,166,.14);text-decoration:none}
      .jhc-story:first-of-type{border-top:0}.jhc-rank{min-width:20px;color:#4ed8ff;font-size:10px;font-weight:800}.jhc-title{color:#dff8ff;font-size:12px;line-height:1.35;font-weight:700}.jhc-source{display:block;color:#607f8a;font-size:9px;margin-top:3px}
      .jhc-full{margin-top:9px;border:1px solid rgba(74,179,211,.25);border-radius:999px;background:rgba(5,21,29,.9);color:#8fc0cd;padding:7px 10px;font-size:9px;font-weight:800;letter-spacing:.08em;cursor:pointer}
    `;
    document.head.appendChild(s);
  }

  function brief() {
    const workspace = document.getElementById('workspace');
    const command = document.getElementById('commandForm');
    if (!workspace || !command) return;
    let box = document.getElementById('jhcBrief');
    if (!box) { box = document.createElement('section'); box.id='jhcBrief'; box.className='jhc-brief'; command.insertAdjacentElement('afterend', box); }
    const cards = [...workspace.querySelectorAll('#newsCards .news-dense-item')];
    if (!cards.length) {
      box.innerHTML='<div class="jhc-head"><strong>TODAY\'S BRIEF</strong><span>FETCHING…</span></div><div class="jhc-title">Gathering the latest headlines.</div>';
      box.classList.add('visible');
      document.getElementById('refreshNews')?.click();
      return;
    }
    box.innerHTML = `<div class="jhc-head"><strong>TODAY'S BRIEF</strong><span>${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · LIVE</span></div>` + cards.slice(0,5).map((card,i) => {
      const title=card.querySelector('.news-title')?.textContent?.trim()||'Untitled story';
      const source=card.querySelector('.news-source')?.textContent?.trim()||'LIVE NEWS';
      const href=card.getAttribute('href')||'#';
      return `<a class="jhc-story" href="${esc(href)}" target="_blank" rel="noreferrer"><span class="jhc-rank">${String(i+1).padStart(2,'0')}</span><span><span class="jhc-title">${esc(title)}</span><span class="jhc-source">${esc(source)}</span></span></a>`;
    }).join('') + '<button type="button" class="jhc-full" data-jhc-full>OPEN FULL NEWS</button>';
    box.classList.add('visible');
    box.querySelector('[data-jhc-full]')?.addEventListener('click', () => document.getElementById('newsDesk')?.scrollIntoView({behavior:'smooth',block:'start'}), {once:true});
  }

  function run(text) {
    const input=document.getElementById('commandInput');
    const form=document.getElementById('commandForm');
    if(!input||!form)return;
    input.value=text;
    form.requestSubmit();
  }

  function enhance() {
    const command=document.getElementById('commandForm');
    const workspace=document.getElementById('workspace');
    if(!command||!workspace)return false;
    styles();
    let actions=document.getElementById('jhcActions');
    if(!actions) {
      actions=document.createElement('div');
      actions.id='jhcActions'; actions.className='jhc-actions';
      actions.innerHTML='<button type="button" data-jhc="brief">TODAY\'S BRIEF</button><button type="button" data-jhc="ai">AI INTEL</button><button type="button" data-jhc-app="maps">OPEN MAPS</button><button type="button" data-jhc-app="media">OPEN MEDIA</button><button type="button" data-jhc="cap">CAPABILITIES</button>';
      command.insertAdjacentElement('afterend',actions);
    }
    return true;
  }

  function wireRoot(root) {
    if (root.dataset.jhcWired === 'v2') return;
    root.dataset.jhcWired = 'v2';
    root.addEventListener('click', (event) => {
      const target = event.target;
      const button = target instanceof Element ? target.closest('[data-jhc],[data-jhc-app]') : null;
      if (!button || !root.contains(button)) return;
      const kind = button.getAttribute('data-jhc');
      const app = button.getAttribute('data-jhc-app');
      if (kind === 'brief') { event.preventDefault(); event.stopPropagation(); brief(); return; }
      if (kind === 'ai') { event.preventDefault(); event.stopPropagation(); run('Search the web for the latest AI news'); return; }
      if (kind === 'cap') { event.preventDefault(); event.stopPropagation(); run('What can you do?'); return; }
      if (app) { event.preventDefault(); event.stopPropagation(); root.querySelector(`.nav[data-app="${app}"]`)?.click(); }
    });
  }

  function boot() {
    const root=document.getElementById('app');
    if(!root) return false;
    wireRoot(root);
    return enhance();
  }

  function start() {
    if (boot()) return;
    let tries=0;
    const timer=window.setInterval(() => { if (boot() || ++tries >= 30) window.clearInterval(timer); }, 200);
  }

  start();
})();
