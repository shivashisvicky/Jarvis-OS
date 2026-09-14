(() => {
  'use strict';
  const retireImageIntelligence = () => {
    const bay = document.querySelector('#jarvisEngineeringBay');
    if (!bay) return false;
    bay.querySelector('[data-jbay2="image"]')?.remove();
    bay.querySelector('[data-pane="image"]')?.remove();
    const sub = bay.querySelector('.jbay2-sub');
    if (sub) sub.textContent = 'JARVIS intelligence, developer and spatial workbench';
    return true;
  };
  if (retireImageIntelligence()) return;
  const observer = new MutationObserver(() => {
    if (retireImageIntelligence()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
