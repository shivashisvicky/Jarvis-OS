(() => {
  'use strict';
  if (window.__JARVIS_IMAGE_SHELL__) return;
  window.__JARVIS_IMAGE_SHELL__ = true;
  const CSS = './jarvis-image-studio.css?v=20260914-vision-v1';
  const JS = './jarvis-image-studio.js?v=20260914-vision-v1';
  let assets = null;
  const loadAssets = () => {
    if (assets) return assets;
    assets = Promise.all([
      new Promise((resolve, reject) => { if (document.querySelector('link[data-jarvis-vision-css]')) return resolve(); const l=document.createElement('link'); l.rel='stylesheet'; l.href=CSS; l.dataset.jarvisVisionCss='1'; l.onload=resolve; l.onerror=reject; document.head.appendChild(l); }),
      new Promise((resolve, reject) => { if (document.querySelector('script[data-jarvis-vision-js]')) return resolve(); const s=document.createElement('script'); s.src=JS; s.defer=true; s.dataset.jarvisVisionJs='1'; s.onload=resolve; s.onerror=reject; document.head.appendChild(s); })
    ]);
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
      if (!workspace) return;
      workspace.innerHTML = `<div class="page-head"><div><p class="eyebrow">INTELLIGENCE / VISION</p><h1>JARVIS Vision Lab</h1><p class="sub">Enhance a real image, edit it conversationally, or create a new visual from a prompt.</p></div></div><section class="panel" id="visionLab"></section>`;
      document.querySelectorAll('.rail .nav').forEach(el => el.classList.toggle('selected', el.hasAttribute('data-jarvis-image-open')));
      const init = window.jarvisInitImageStudio;
      if (typeof init === 'function') init();
    } catch (error) {
      const status = document.querySelector('#workspace');
      if (status) status.insertAdjacentHTML('beforeend', `<section class="panel info-card"><h3>Vision Lab unavailable</h3><p>${String(error?.message || 'Could not load Vision Lab.')}</p></section>`);
    }
  }
  const observer = new MutationObserver(install);
  const boot = () => { install(); observer.observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
