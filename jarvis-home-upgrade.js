(() => {
  'use strict';
  if (window.__JARVIS_HOME_UPGRADE__) return;
  window.__JARVIS_HOME_UPGRADE__ = true;

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[ch]));

  function installStyles() {
    if (document.querySelector('#jarvis-home-upgrade-style')) return;
    const style = document.createElement('style');
    style.id = 'jarvis-home-upgrade-style';
    style.textContent = `
      .jhu-hero{position:relative;overflow:hidden;margin:0 0 14px;padding:18px;border:1px solid rgba(77,210,255,.28);border-radius:16px;background:linear-gradient(135deg,rgba(7,27,38,.96),rgba(3,12,18,.92));box-shadow:0 0 32px rgba(0,180,255,.08),inset 0 1px rgba(255,255,255,.05)}
      .jhu-hero:before{content:"";position:absolute;inset:-60%;background:radial-gradient(circle at 70% 20%,rgba(56,211,255,.13),transparent 34%),radial-gradient(circle at 20% 100%,rgba(37,116,255,.08),transparent 30%);pointer-events:none}
      .jhu-hero-grid{position:relative;display:grid;grid-template-columns:1.45fr .85fr;gap:14px;align-items:stretch}
      .jhu-kicker{font-size:10px;letter-spacing:.22em;color:#63dcff;font-weight:800;margin-bottom:7px}
      .jhu-greeting{font-size:clamp(22px,4vw,34px);font-weight:800;letter-spacing:-.03em;color:#e9fbff;line-height:1.05;margin:0}
      .jhu-greeting span{color:#63dcff}
      .jhu-sub{margin:8px 0 0;color:#7898a5;font-size:12px;line-height:1.45;max-width:560px}
      .jhu-telemetry{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
      .jhu-stat{padding:10px 11px;border:1px solid rgba(72,142,166,.22);border-radius:11px;background:rgba(2,12,18,.62)}
      .jhu-stat small{display:block;color:#587783;font-size:9px;letter-spacing:.12em;margin-bottom:4px}
      .jhu-stat strong{display:block;color:#d7f5ff;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .jhu-stat i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#54e3a5;margin-right:5px;box-shadow:0 0 9px rgba(84,227,165,.65)}
      .jhu-quick{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px}
      .jhu-quick button{appearance:none;border:1px solid rgba(74,179,211,.25);border-radius:999px;background:rgba(5,21,29,.86);color:#9bc5d1;padding:8px 11px;font:700 10px/1 inherit;letter-spacing:.04em;cursor:pointer;transition:.16s ease;touch-action:manipulation}
      .jhu-quick button:hover,.jhu-quick button:active{border-color:#58d9ff;color:#e5fbff;background:rgba(10,35,47,.95);transform:translateY(-1px)}
      .jhu-section{display:flex;align-items:center;justify-content:space-between;margin:0 0 8px;padding:0 2px}
      .jhu-section strong{font-size:10px;letter-spacing:.17em;color:#6e9aa7}
      .jhu-section span{font-size:9px;color:#42606b}
      .jhu-pulse{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:0 0 14px}
      .jhu-pulse-card{min-height:72px;padding:11px;border:1px solid rgba(74,139,160,.2);border-radius:12px;background:rgba(4,16,23,.72)}
      .jhu-pulse-card small{display:block;font-size:9px;color:#55737e;letter-spacing:.12em;margin-bottom:8px}
      .jhu-pulse-card strong{display:block;color:#d9f7ff;font-size:13px;line-height:1.2}
      .jhu-pulse-card p{margin:4px 0 0;color:#6d8993;font-size:10px}
      .jhu-brief{display:none;margin:0 0 14px;padding:14px;border:1px solid rgba(77,210,255,.24);border-radius:14px;background:linear-gradient(145deg,rgba(5,23,32,.95),rgba(2,12,18,.92));box-shadow:0 0 24px rgba(0,180,255,.06)}
      .jhu-brief.visible{display:block}
      .jhu-brief-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}
      .jhu-brief-head strong{font-size:11px;letter-spacing:.17em;color:#63dcff}
      .jhu-brief-head span{font-size:9px;color:#557783}
      .jhu-brief-item{display:flex;gap:9px;padding:9px 0;border-top:1px solid rgba(72,142,166,.14);text-decoration:none}
      .jhu-brief-item:first-of-type{border-top:0}
      .jhu-brief-rank{min-width:22px;color:#4ed8ff;font-size:10px;font-weight:800;padding-top:2px}
      .jhu-brief-title{color:#dff8ff;font-size:12px;line-height:1.35;font-weight:700}
      .jhu-brief-source{display:block;color:#607f8a;font-size:9px;margin-top:3px}
      .jhu-brief-actions{display:flex;gap:8px;margin-top:10px}
      .jhu-brief-actions button{border:1px solid rgba(74,179,211,.25);border-radius:999px;background:rgba(5,21,29,.86);color:#8fc0cd;padding:7px 10px;font-size:9px;font-weight:800;letter-spacing:.08em;cursor:pointer;touch-action:manipulation}
      @media(max-width:760px){.jhu-hero{padding:15px}.jhu-hero-grid{grid-template-columns:1fr}.jhu-telemetry{grid-template-columns:repeat(4,1fr)}.jhu-stat{padding:8px 7px}.jhu-stat small{font-size:7px}.jhu-stat strong{font-size:10px}.jhu-pulse{grid-template-columns:1fr 1fr}.jhu-pulse-card:last-child{grid-column:1/-1}.jhu-quick{margin-bottom:12px}}
      @media(max-width:430px){.jhu-telemetry{grid-template-columns:repeat(2,1fr)}.jhu-greeting{font-size:25px}}
    `;
    document.head.appendChild(style);
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 5) return 'Still online. <span>Night mode.</span>';
    if (hour < 12) return 'Good morning. <span>Systems ready.</span>';
    if (hour < 18) return 'Good afternoon. <span>Systems ready.</span>';
    if (hour < 23) return 'Good evening. <span>Systems ready.</span>';
    return 'Still online. <span>Night mode.</span>';
  }

  function stat(label, value, live = false) {
    return `<div class="jhu-stat"><small>${label}</small><strong>${live ? '<i></i>' : ''}${esc(value)}</strong></div>`;
  }

  function runCommand(text) {
    const input = document.querySelector('#commandInput');
    const form = document.querySelector('#commandForm');
    if (!input || !form) return;
    input.value = text;
    form.requestSubmit();
  }

  function openApp(id) { document.querySelector(`.nav[data-app="${id}"]`)?.click(); }

  function briefFromExistingNews() {
    const cards = [...document.querySelectorAll('#newsCards .news-dense-item')];
    const brief = document.querySelector('#jhuBrief');
    if (!brief) return;
    if (!cards.length) {
      brief.innerHTML = '<div class="jhu-brief-head"><strong>TODAY\'S BRIEF</strong><span>FETCHING LIVE NEWS…</span></div><div class="jhu-pulse-card"><strong>Gathering the latest headlines.</strong><p>JARVIS is waiting for the live news feed.</p></div>';
      brief.classList.add('visible');
      document.querySelector('#refreshNews')?.click();
      window.setTimeout(briefFromExistingNews, 900);
      return;
    }
    const items = cards.slice(0, 5).map((card, index) => {
      const link = card.getAttribute('href') || '#';
      const title = card.querySelector('.news-title')?.textContent?.trim() || 'Untitled story';
      const source = card.querySelector('.news-source')?.textContent?.trim() || 'LIVE NEWS';
      return `<a class="jhu-brief-item" href="${esc(link)}" target="_blank" rel="noreferrer"><span class="jhu-brief-rank">${String(index + 1).padStart(2,'0')}</span><span><span class="jhu-brief-title">${esc(title)}</span><span class="jhu-brief-source">${esc(source)}</span></span></a>`;
    }).join('');
    brief.innerHTML = `<div class="jhu-brief-head"><strong>TODAY'S BRIEF</strong><span>${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · LIVE</span></div>${items}<div class="jhu-brief-actions"><button type="button" id="jhuFullNews">OPEN FULL NEWS</button></div>`;
    brief.classList.add('visible');
    document.querySelector('#jhuFullNews')?.addEventListener('click', () => document.querySelector('#newsDesk')?.scrollIntoView({behavior:'smooth',block:'start'}));
    brief.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function bindQuickActions(quick) {
    quick.querySelectorAll('[data-cmd]').forEach(button => {
      button.addEventListener('click', () => {
        if (button.getAttribute('data-cmd') === "Give me today's top news") {
          briefFromExistingNews();
          return;
        }
        runCommand(button.getAttribute('data-cmd') || '');
      });
    });
    quick.querySelectorAll('[data-app]').forEach(button => button.addEventListener('click', () => openApp(button.getAttribute('data-app') || '')));
  }

  function build() {
    const command = document.querySelector('#commandForm');
    const workspace = document.querySelector('#workspace');
    if (!command || !workspace || document.querySelector('#jhuHomeHero')) return;
    installStyles();
    const now = new Date();
    const online = navigator.onLine;
    const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A';
    const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : 'N/A';
    const hero = document.createElement('section');
    hero.id = 'jhuHomeHero';
    hero.className = 'jhu-hero';
    hero.innerHTML = `<div class="jhu-hero-grid"><div><div class="jhu-kicker">J.A.R.V.I.S / MISSION CONTROL</div><h2 class="jhu-greeting">${greeting()}</h2><p class="jhu-sub">Your command layer is awake. Search the web, navigate, run tools, launch media, or simply tell JARVIS what you need.</p></div><div class="jhu-telemetry">${stat('CORE', online ? 'NOMINAL' : 'DEGRADED', true)}${stat('LOCAL TIME', now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}${stat('CPU', cores)}${stat('MEMORY', memory)}</div></div>`;
    command.parentNode.insertBefore(hero, command);
    const quick = document.createElement('div');
    quick.id = 'jhuQuick'; quick.className = 'jhu-quick';
    quick.innerHTML = `<button type="button" data-cmd="Give me today's top news">TODAY'S BRIEF</button><button type="button" data-cmd="Search the web for the latest AI news">AI INTEL</button><button type="button" data-app="maps">OPEN MAPS</button><button type="button" data-app="media">OPEN MEDIA</button><button type="button" data-cmd="What can you do?">CAPABILITIES</button>`;
    hero.insertAdjacentElement('afterend', quick);
    bindQuickActions(quick);
    const brief = document.createElement('section');
    brief.id = 'jhuBrief'; brief.className = 'jhu-brief';
    quick.insertAdjacentElement('afterend', brief);
    const section = document.createElement('div'); section.className = 'jhu-section'; section.innerHTML = '<strong>LIVE SYSTEM PULSE</strong><span>LOCAL DEVICE TELEMETRY</span>';
    command.insertAdjacentElement('afterend', section);
    const pulse = document.createElement('div'); pulse.className = 'jhu-pulse';
    pulse.innerHTML = `<div class="jhu-pulse-card"><small>CONNECTION</small><strong>${online ? 'ONLINE' : 'OFFLINE'}</strong><p>${online ? 'Network available' : 'Local mode active'}</p></div><div class="jhu-pulse-card"><small>SESSION</small><strong>READY</strong><p>Command layer armed</p></div><div class="jhu-pulse-card"><small>TIME</small><strong>${esc(now.toLocaleDateString([], {weekday:'short',month:'short',day:'numeric'}))}</strong><p>${esc(now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}</p></div>`;
    section.insertAdjacentElement('afterend', pulse);
    const refresh = () => { const h=document.querySelector('#jhuHomeHero .jhu-greeting'); const t=document.querySelector('#jhuHomeHero .jhu-stat:nth-child(2) strong'); if(h)h.innerHTML=greeting(); if(t)t.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); };
    window.setInterval(refresh,30000);
  }

  const tryBuild = () => { if(document.querySelector('#commandForm')) build(); };
  tryBuild();
  new MutationObserver(tryBuild).observe(document.documentElement,{childList:true,subtree:true});
})();