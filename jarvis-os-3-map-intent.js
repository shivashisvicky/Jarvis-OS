(() => {
  'use strict';

  const setNativeValue = (input, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const execute = destination => {
    const value = String(destination || '').trim();
    if (!value) return;

    const openMaps = () => {
      const tab = document.querySelector('[data-app="maps"], [data-route="maps"], [data-nav="maps"]');
      if (tab instanceof HTMLElement && !tab.classList.contains('selected')) tab.click();
    };

    openMaps();

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const input = document.querySelector('#mapQuery');
      const search = document.querySelector('#mapSearch');

      if (input instanceof HTMLInputElement && search instanceof HTMLElement) {
        clearInterval(timer);
        setNativeValue(input, value);
        search.click();
        return;
      }

      if (attempts >= 40) clearInterval(timer);
    }, 75);
  };

  window.addEventListener('jarvis:navigate-map', event => execute(event.detail?.destination));
  window.jarvisV3MapIntent = { execute };
})();
