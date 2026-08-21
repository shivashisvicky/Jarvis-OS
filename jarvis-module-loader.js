(() => {
  'use strict';
  if (window.__JARVIS_MODULE_LOADER__) return;
  window.__JARVIS_MODULE_LOADER__ = true;

  const features = {
    web: { scripts: ['jarvis-web-search.js'], css: ['jarvis-web-polish.css'] },
    media: { scripts: ['jarvis-live-media.js'], css: ['jarvis-media-layout.css', 'jarvis-video-search-v3.css'] },
    voice: { scripts: ['jarvis-voice-settings.js', 'jarvis-speech-authority.js', 'jarvis-voice-authority.js'] },
    mobile: { scripts: ['jarvis-mobile-unified.js'] },
    engineering: { scripts: ['jarvis-engineering.js'] },
    notes: { scripts: ['jarvis-notes.js'] },
    games: { scripts: ['jarvis-games-v2.js'] },
  };

  const loaded = new Map();
  const assetUrl = name => `./${name}?v=20260821-phase0-${name.replace(/[^a-z0-9]/gi, '')}`;

  const loadScript = src => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-jarvis-module="${CSS.escape(src)}"]`);
    if (existing) return resolve();
    const script = document.createElement('script');
    script.src = assetUrl(src);
    script.dataset.jarvisModule = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

  const loadCss = href => new Promise((resolve, reject) => {
    const existing = document.querySelector(`link[data-jarvis-module-css="${CSS.escape(href)}"]`);
    if (existing) return resolve();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = assetUrl(href);
    link.dataset.jarvisModuleCss = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load ${href}`));
    document.head.appendChild(link);
  });

  async function loadFeature(name) {
    if (loaded.has(name)) return loaded.get(name);
    const feature = features[name];
    if (!feature) return;
    const promise = (async () => {
      for (const css of feature.css || []) await loadCss(css);
      for (const script of feature.scripts || []) await loadScript(script);
    })();
    loaded.set(name, promise);
    try { await promise; } catch (error) { loaded.delete(name); throw error; }
  }

  window.jarvisLoadFeature = loadFeature;
  window.jarvisFeatureLoaded = name => loaded.has(name);

  // Do not boot heavy modules on page load. A first command interaction is a
  // safe point to warm voice without delaying the initial paint.
  let warmed = false;
  const warmVoice = event => {
    if (warmed) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('#commandInput, #commandForm .execute, #voiceBtn, #testVoice')) return;
    warmed = true;
    void loadFeature('voice').catch(() => {});
    document.removeEventListener('pointerdown', warmVoice, true);
    document.removeEventListener('touchstart', warmVoice, true);
  };
  document.addEventListener('pointerdown', warmVoice, true);
  document.addEventListener('touchstart', warmVoice, true);
})();
