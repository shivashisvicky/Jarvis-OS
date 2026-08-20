(() => {
  'use strict';

  const scoreInput = input => {
    const text = [
      input.id,
      input.name,
      input.placeholder,
      input.getAttribute('aria-label'),
      input.closest('label')?.textContent,
      input.closest('.panel')?.textContent?.slice(0, 300)
    ].filter(Boolean).join(' ').toLowerCase();
    let score = 0;
    if (/map|destination|place|location|address|search/.test(text)) score += 5;
    if (/to|where|find/.test(text)) score += 2;
    if (/from|origin|start/.test(text)) score -= 3;
    if (input.offsetParent === null) score -= 20;
    return score;
  };

  const findMapInput = () => [...document.querySelectorAll('input:not([type="hidden"]):not([type="range"])')]
    .sort((a, b) => scoreInput(b) - scoreInput(a))[0] || null;

  const submitSearch = input => {
    if (!input) return false;
    input.focus();
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.dispatchEvent(new Event('change', { bubbles:true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', code:'Enter', bubbles:true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key:'Enter', code:'Enter', bubbles:true }));

    const scope = input.closest('.panel, .workspace, form') || document;
    const buttons = [...scope.querySelectorAll('button')];
    const button = buttons.find(b => /search|route|directions|go|navigate|find/i.test(b.textContent || '') && b.offsetParent !== null);
    if (button) {
      button.click();
      return true;
    }
    return true;
  };

  const execute = destination => {
    const value = String(destination || '').trim();
    if (!value) return;
    const maps = document.querySelector('[data-app="maps"], [data-route="maps"], [data-nav="maps"]');
    if (maps instanceof HTMLElement && !maps.classList.contains('selected')) maps.click();

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const input = findMapInput();
      if (input) {
        clearInterval(timer);
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        setter?.call(input, value);
        submitSearch(input);
      } else if (attempts >= 20) {
        clearInterval(timer);
      }
    }, 75);
  };

  window.addEventListener('jarvis:navigate-map', event => execute(event.detail?.destination));
  window.jarvisV3MapIntent = { execute };
})();
