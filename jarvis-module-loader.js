(() => {
  'use strict';
  if (window.__JARVIS_MODULE_LOADER__) return;
  window.__JARVIS_MODULE_LOADER__ = true;

  try { sessionStorage.removeItem('jarvis-session-context-v2'); } catch {}

  const features = {
    web: { scripts: ['jarvis-web-search.js'], css: ['jarvis-web-polish.css'] },
    media: { scripts: ['jarvis-live-media.js'], css: ['jarvis-media-layout.css', 'jarvis-video-search-v3.css'] },
    voice: { scripts: ['jarvis-voice-settings.js', 'jarvis-speech-authority.js', 'jarvis-voice-authority.js'], css: [] },
    mobile: { scripts: ['jarvis-mobile-unified.js'], css: [] },
    engineering: { scripts: ['jarvis-engineering.js'], css: [] },
    notes: { scripts: ['jarvis-notes.js'], css: [] },
    games: { scripts: ['jarvis-games-v2.js', 'jarvis-games-mobile-fix.js'], css: [] },
  };

  const loaded = new Map();
  const pending = new Map();
  const scriptPromises = new Map();
  const cssPromises = new Map();
  const assetUrl = name => {
    const version = /voice/i.test(name) ? '20260824-ios-voice-authority-v5' : /mobile/i.test(name) ? '20260824-android-mobile-v2' : '20260824-media-play-v2';
    return `./${name}?v=${version}-${name.replace(/[^a-z0-9]/gi, '')}`;
  };

  const findExistingScript = src => {
    const exact = document.querySelector(`script[data-jarvis-feature-src="${src}"]`);
    if (exact) return exact;
    const base = src.split('?')[0].replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    return document.querySelector(`script[src^="${base}"]`);
  };

  const loadScript = src => {
    if (scriptPromises.has(src)) return scriptPromises.get(src);
    const existing = findExistingScript(src);
    if (existing) {
      const ready = Promise.resolve();
      scriptPromises.set(src, ready);
      return ready;
    }
    const task = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.dataset.jarvisFeatureSrc = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
    scriptPromises.set(src, task);
    return task;
  };

  const loadCss = href => {
    if (cssPromises.has(href)) return cssPromises.get(href);
    const existing = document.querySelector(`link[data-jarvis-feature-href="${href}"]`) || document.querySelector(`link[href^="${href.split('?')[0]}"]`);
    if (existing) {
      const ready = Promise.resolve();
      cssPromises.set(href, ready);
      return ready;
    }
    const task = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.jarvisFeatureHref = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load ${href}`));
      document.head.appendChild(link);
    });
    cssPromises.set(href, task);
    return task;
  };

  const loadFeature = async name => {
    if (!features[name]) return;
    if (loaded.has(name)) return loaded.get(name);
    if (pending.has(name)) return pending.get(name);
    const task = Promise.all([
      ...features[name].scripts.map(script => loadScript(assetUrl(script))),
      ...features[name].css.map(css => loadCss(assetUrl(css))),
    ]).then(() => {
      loaded.set(name, true);
      pending.delete(name);
    }).catch(error => {
      pending.delete(name);
      throw error;
    });
    pending.set(name, task);
    return task;
  };

  window.jarvisLoadFeature = loadFeature;
  void loadFeature('voice').catch(error => console.warn('JARVIS voice feature preload failed', error));
})();