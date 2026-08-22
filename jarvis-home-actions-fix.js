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

  const handle = event => {
    const target = event.target instanceof Element ? event.target.closest('#jhuQuick button') : null;
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    // TODAY'S BRIEF is a Home intelligence action, not a normal command.
    // The previous generic command bridge intercepted it first and sent
    // "Give me today's top news" through the classifier, which produced the
    // old "Opening the live news desk" response. Route it directly to the
    // briefing engine instead.
    if ((target.textContent || '').includes("TODAY'S BRIEF")) {
      window.dispatchEvent(new CustomEvent('jarvis:open-daily-brief'));
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
  style.textContent = '#jhuQuick{position:relative;z-index:20;pointer-events:auto}#jhuQuick button{position:relative;z-index:21;pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:rgba(88,217,255,.18)}';
  document.head.appendChild(style);
})();
