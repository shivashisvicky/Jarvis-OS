(() => {
  'use strict';
  if (window.__JARVIS_IMAGE_SHELL__) return;
  window.__JARVIS_IMAGE_SHELL__ = true;
  const CSS = './jarvis-image-studio.css?v=20260914-vision-v2';
  const JS = './jarvis-image-studio.js?v=20260914-vision-v2';
  let assets = null;
  const loadAssets = () => {
    if (window.jarvisInitImageStudio) return Promise.resolve();
    if (assets) return assets;
    assets = new Promise((resolve, reject) => {
      try {
        if (!document.querySelector('link[data-jarvis-vision-css]')) {
          const l = document.createElement('link');
          l.rel = 'stylesheet';
          l.href = CSS;
          l.dataset.jarvisVisionCss = '1';
          document.head.appendChild(l);
        }
        if (window.jarvisInitImageStudio) return resolve();
        const existing = document.querySelector('script[data-jarvis-vision-js]');
        if (existing) {
          if (window.jarvisInitImageStudio) return resolve();
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('Vision Studio script failed to load.')), { once: true });
          return;
        }
        const s = document.createElement('script');
        s.src = JS;
        s.async = false;
        s.dataset.jarvisVisionJs = '1';
        s.onload = () => window.jarvisInitImageStudio ? resolve() : reject(new Error('Vision Studio initialized without its entry point.'));
        s.onerror = () => reject(new Error('Vision Studio script failed to load.'));
        document.head.appendChild(s);
      } catch (error) {
        reject(error);
      }
    });
    return assets;
  };
  const navButton = () => `<button type="button" class="nav" data-jarvis-image-open><b>✦</b><span>Vision</span></button>`;
  const cardButton = () => `<button type="button" class="module-card" data-jarvis-image-open><span class="module-icon">✦</span><div><small>INTELLIGENCE</small><strong>Vision Lab</strong><p>Enhance or create images</p></div><b>›</b></button>`;
  function install() {
    const group = document.querySelector('.rail .nav-group');
    if (group && !group.querySelector('[data-jarvis-image-open]')) group.insertAdjacentHTML('beforeend', navButton());
    const grid = document.querySelector('.module-grid');
    if (grid && !grid.querySelector('[data-jarvis-image-open]')) grid.insertAdjacentHTML('beforeend', cardButton());
    document.querySelectorAll('[data-jarvis-image-open]').forEach(el => {
      if (el.dataset.visionBound) return;
      el.dataset.visionBound = '1';
      el.addEventListener('click', event => {
        event.preventDefault(); event.stopImmediatePropagation();
        void openVision();
      }, true);
    });
  }
  async function openVision() {
    try {
      await loadAssets();
      const workspace = document.querySelector('#workspace');
      if (!workspace) throw new Error('JARVIS workspace is unavailable.');
      workspace.innerHTML = `<div class="page-head"><div><p class="eyebrow">INTELLIGENCE / VISION</p><h1>JARVIS Vision Lab</h1><p class="sub">Enhance a real image, edit it conversationally, or create a new visual from a prompt.</p></div></div><section class="panel" id="visionLab"></section>`;
      document.querySelectorAll('.rail .nav').forEach(el => el.classList.toggle('selected', el.hasAttribute('data-jarvis-image-open')));
      const init = window.jarvisInitImageStudio;
      if (typeof init !== 'function') throw new Error('Vision Studio entry point is unavailable.');
      init();
    } catch (error) {
      const status = document.querySelector('#workspace');
      if (status) status.insertAdjacentHTML('beforeend', `<section class="panel info-card"><h3>Vision Lab unavailable</h3><p>${String(error?.message || 'Could not load Vision Lab.')}</p></section>`);
    }
  }
  const observer = new MutationObserver(install);
  const boot = () => { install(); observer.observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
