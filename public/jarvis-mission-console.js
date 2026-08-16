(() => {
  const ACTIONS = [
    ['SIGNAL', 'Today\'s Signal', 'Build a concise intelligence brief'],
    ['MEDIA', 'Find Video', 'Search and launch media from keywords'],
    ['RESEARCH', 'Research', 'Open a focused web research workspace'],
    ['ENGINEER', 'Engineering', 'Open the API engineering workspace'],
  ];

  function styles() {
    if (document.getElementById('jmc-style')) return;
    const s = document.createElement('style');
    s.id = 'jmc-style';
    s.textContent = `.jarvis-mission-console{position:relative;overflow:hidden;margin:0 0 22px;padding:22px;border:1px solid rgba(126,205,255,.16);background:linear-gradient(135deg,rgba(12,25,38,.88),rgba(4,10,16,.94));box-shadow:inset 0 1px rgba(255,255,255,.04),0 18px 60px rgba(0,0,0,.18)}.jarvis-mission-console:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(111,213,255,.04) 50%,transparent 100%);pointer-events:none}.jmc-head{position:relative;display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px}.jmc-head h2{margin:2px 0 4px;letter-spacing:.08em}.jmc-prompt{margin:0;color:var(--muted,#8da0b2);font-size:14px}.jmc-status{display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.12em}.jmc-status i{width:7px;height:7px;border-radius:50%;background:#65f0b5;box-shadow:0 0 12px #65f0b5}.jmc-status small{color:var(--muted,#8da0b2)}.jmc-actions{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.jmc-action{min-height:76px;text-align:left;display:grid;grid-template-columns:30px 1fr 16px;align-items:center;gap:10px;padding:12px 13px;border:1px solid rgba(126,205,255,.12);border-radius:10px;background:rgba(255,255,255,.025);color:inherit;cursor:pointer;transition:.18s ease}.jmc-action:hover{transform:translateY(-2px);border-color:rgba(126,205,255,.38);background:rgba(126,205,255,.07);box-shadow:0 8px 28px rgba(0,0,0,.18)}.jmc-index{font:600 11px ui-monospace,monospace;color:#68d7ff}.jmc-action b{display:block;font-size:12px;letter-spacing:.08em}.jmc-action small{display:block;margin-top:4px;color:var(--muted,#8da0b2);font-size:10px;line-height:1.35}.jmc-action>strong{font-size:16px;color:#6fd7ff}.jmc-footer{position:relative;display:flex;justify-content:space-between;margin-top:14px;padding-top:10px;border-top:1px solid rgba(126,205,255,.08);font:500 9px ui-monospace,monospace;letter-spacing:.12em;color:#6d8193}@media(max-width:850px){.jmc-actions{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.jmc-actions{grid-template-columns:1fr}.jmc-head{display:block}.jmc-status{margin-top:12px}}`;
    document.head.appendChild(s);
  }

  function clickApp(id) {
    document.querySelector(`[data-app="${id}"]`)?.dispatchEvent(new MouseEvent('click', {bubbles:true}));
  }

  function runMediaSearch() {
    clickApp('media');
    const q = 'trending videos India';
    const finish = () => {
      if (typeof window.jarvisVideoSearch === 'function') {
        window.jarvisVideoSearch(q);
        return true;
      }
      const input = document.querySelector('#videoQuery');
      if (!input) return false;
      input.value = q;
      document.querySelector('#videoSearch')?.click();
      return true;
    };
    let tries = 0;
    const timer = setInterval(() => {
      if (finish() || ++tries > 40) clearInterval(timer);
    }, 100);
  }

  function mount() {
    styles();
    const workspace = document.querySelector('.workspace');
    if (!workspace || document.querySelector('.jarvis-mission-console')) return;
    const home = workspace.querySelector('.command-center');
    if (!home) return;
    const el = document.createElement('section');
    el.className = 'jarvis-mission-console panel';
    el.setAttribute('aria-label', 'JARVIS intelligence core');
    el.innerHTML = `<div class="jmc-head"><div><p class="eyebrow">JARVIS / ORCHESTRATION</p><h2>JARVIS INTELLIGENCE CORE</h2><p class="jmc-prompt">What should JARVIS work on?</p></div><div class="jmc-status"><i></i><span>READY</span><small>LOCAL-FIRST</small></div></div><div class="jmc-actions">${ACTIONS.map(([k,t,d], i) => `<button class="jmc-action" data-jmc-index="${i}" type="button"><span class="jmc-index">0${i + 1}</span><span><b>${t}</b><small>${d}</small></span><strong>↗</strong></button>`).join('')}</div><div class="jmc-footer"><span>INTENT ROUTER</span><span>● READY FOR COMMAND</span></div>`;
    const anchor = home.querySelector('.command-surface');
    home.insertBefore(el, anchor || home.firstChild);
    el.querySelectorAll('.jmc-action').forEach(btn => btn.addEventListener('click', () => {
      const i = Number(btn.getAttribute('data-jmc-index'));
      if (i === 1) { runMediaSearch(); return; }
      const commands = ['Search the web for today\'s most important AI and technology news and summarize it','Find trending videos','Open web research','Open API Lab'];
      const input = document.querySelector('#commandInput');
      const form = document.querySelector('#commandForm');
      if (input && form) { input.value = commands[i] || ''; form.dispatchEvent(new Event('submit', {bubbles:true,cancelable:true})); }
      else if (i === 3) clickApp('api');
    }));
  }
  const observer = new MutationObserver(mount);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})();
