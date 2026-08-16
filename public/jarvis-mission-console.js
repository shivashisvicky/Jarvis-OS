(() => {
  const ACTIONS = [
    ['SIGNAL', 'Today\'s Signal', 'Build a concise intelligence brief'],
    ['MEDIA', 'Find Video', 'Search and launch media from keywords'],
    ['RESEARCH', 'Research', 'Open a focused web research workspace'],
    ['ENGINEER', 'Engineering', 'Open the API engineering workspace'],
  ];

  function mount() {
    const workspace = document.querySelector('.workspace');
    if (!workspace || document.querySelector('.jarvis-mission-console')) return;
    const home = workspace.querySelector('.command-center');
    if (!home) return;

    const el = document.createElement('section');
    el.className = 'jarvis-mission-console panel';
    el.setAttribute('aria-label', 'JARVIS intelligence core');
    el.innerHTML = `
      <div class="jmc-head">
        <div>
          <p class="eyebrow">JARVIS / ORCHESTRATION</p>
          <h2>JARVIS INTELLIGENCE CORE</h2>
          <p class="jmc-prompt">What should JARVIS work on?</p>
        </div>
        <div class="jmc-status"><i></i><span>READY</span><small>LOCAL-FIRST</small></div>
      </div>
      <div class="jmc-actions">
        ${ACTIONS.map(([k,t,d], i) => `<button class="jmc-action" data-jmc-index="${i}" type="button"><span class="jmc-index">0${i + 1}</span><span><b>${t}</b><small>${d}</small></span><strong>↗</strong></button>`).join('')}
      </div>
      <div class="jmc-footer"><span>INTENT ROUTER</span><span>● READY FOR COMMAND</span></div>
    `;
    const anchor = home.querySelector('.command-surface');
    home.insertBefore(el, anchor || home.firstChild);

    el.querySelectorAll('.jmc-action').forEach(btn => btn.addEventListener('click', () => {
      const i = Number(btn.getAttribute('data-jmc-index'));
      const commands = [
        'Search the web for today\'s most important AI and technology news and summarize it',
        'Find trending videos',
        'Open web research',
        'Open API Lab',
      ];
      const input = document.querySelector('#commandInput');
      const form = document.querySelector('#commandForm');
      if (input && form) {
        input.value = commands[i] || '';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      } else if (i === 1) {
        document.querySelector('[data-app="media"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      } else if (i === 3) {
        document.querySelector('[data-app="api"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    }));
  }

  const observer = new MutationObserver(mount);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
