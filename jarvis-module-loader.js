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
    games: { scripts: ['jarvis-games-v2.js', 'jarvis-games-mobile-fix.js'] },
  };

  const loaded = new Map();
  const pending = new Map();
  const assetUrl = name => `./${name}?v=20260823-voice-preload-${name.replace(/[^a-z0-9]/gi, '')}`;

  const loadScript = src => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-jarvis-feature-src="${src}"]`);
    if (existing) return resolve();
    const script = document.createElement('script');
    script.src = src; script.defer = true; script.dataset.jarvisFeatureSrc = src;
    script.onload = () => resolve(); script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

  const loadCss = href => new Promise((resolve, reject) => {
    const existing = document.querySelector(`link[data-jarvis-feature-href="${href}"]`);
    if (existing) return resolve();
    const link = document.createElement('link'); link.rel='stylesheet'; link.href=href; link.dataset.jarvisFeatureHref=href;
    link.onload=()=>resolve(); link.onerror=()=>reject(new Error(`Failed to load ${href}`)); document.head.appendChild(link);
  });

  const loadFeature = async name => {
    if (!features[name]) return;
    if (loaded.has(name)) return loaded.get(name);
    if (pending.has(name)) return pending.get(name);
    const task = Promise.all([
      ...features[name].scripts.map(script => loadScript(assetUrl(script))),
      ...features[name].css.map(css => loadCss(assetUrl(css))),
    ]).then(() => { loaded.set(name, true); pending.delete(name); }).catch(error => { pending.delete(name); throw error; });
    pending.set(name, task);
    return task;
  };

  window.jarvisLoadFeature = loadFeature;

  // Voice must be ready before the first iOS microphone gesture. Previously the
  // first typed command happened to load this feature, which is why voice began
  // working only after a written command was submitted.
  window.setTimeout(() => {
    void loadFeature('voice').catch(error => console.warn('[JARVIS voice preload]', error));
  }, 0);
})();
