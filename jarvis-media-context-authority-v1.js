(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_CONTEXT_AUTHORITY_V1__) return;
  window.__JARVIS_MEDIA_CONTEXT_AUTHORITY_V1__ = true;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const refPattern = /^(?:the\s+)?(?:first|1(?:st)?|one|second|2(?:nd)?|two|third|3(?:rd)?|three|last)(?:\s+(?:one|result|video))?$/i;
  const numberedPattern = /^(?:the\s+)?(?:result|number|no\.?)\s*\d+$/i;
  const playPattern = /^(?:please\s+)?(?:play|watch|open|show)\s+/i;

  const isReference = value => {
    const q = clean(value).replace(/[?.!]+$/, '');
    return refPattern.test(q) || numberedPattern.test(q);
  };

  const getMediaCards = () => [...document.querySelectorAll('#videoResults [data-jvc-id], #videoResults .jvc-card[data-video-id]')];

  const syncContext = () => {
    const cards = getMediaCards();
    if (!cards.length || !window.jarvisContextEngine?.set) return;
    const results = cards.map((card, index) => ({
      index,
      id: clean(card.getAttribute('data-jvc-id') || card.getAttribute('data-video-id')),
      title: clean(card.querySelector('strong')?.textContent || 'YouTube video'),
      link: clean(card.getAttribute('data-url') || ''),
      type: 'YOUTUBE_RESULT'
    })).filter(item => item.id);
    if (!results.length) return;
    const query = clean(document.querySelector('#videoQuery')?.value || '');
    window.jarvisContextEngine.set({ domain: 'MEDIA', intent: 'YOUTUBE', query, results, selected: null }, 'merge');
  };

  const resolve = target => {
    const ctx = window.jarvisContextEngine?.get?.();
    if (!ctx?.active || String(ctx.domain || '').toUpperCase() !== 'MEDIA' || !Array.isArray(ctx.results)) return null;
    const q = clean(target).toLowerCase().replace(/[?.!]+$/, '');
    let index = null;
    if (/^(?:the\s+)?(?:first|1st|one)(?:\s+(?:one|result|video))?$/.test(q)) index = 0;
    else if (/^(?:the\s+)?(?:second|2nd|two)(?:\s+(?:one|result|video))?$/.test(q)) index = 1;
    else if (/^(?:the\s+)?(?:third|3rd|three)(?:\s+(?:one|result|video))?$/.test(q)) index = 2;
    else if (/^(?:the\s+)?last(?:\s+(?:one|result|video))?$/.test(q)) index = ctx.results.length - 1;
    else {
      const m = /^(?:the\s+)?(?:result|number|no\.?)\s*(\d+)$/.exec(q);
      if (m) index = Number(m[1]) - 1;
    }
    if (!Number.isInteger(index) || !ctx.results[index]) return null;
    return { index, value: ctx.results[index], context: ctx };
  };

  const playResolved = hit => {
    const card = getMediaCards()[hit.index];
    if (card instanceof HTMLElement) {
      card.click();
      window.jarvisContextEngine?.set?.({ selected: hit.value }, 'merge');
      return true;
    }
    const id = hit.value?.id;
    if (id && typeof window.jarvisVideoPlay === 'function') {
      window.jarvisVideoPlay(id);
      window.jarvisContextEngine?.set?.({ selected: hit.value }, 'merge');
      return true;
    }
    return false;
  };

  const handleVoice = event => {
    const raw = clean(event.detail?.text);
    if (!raw || !playPattern.test(raw)) return;
    const target = clean(raw.replace(playPattern, ''));
    if (!isReference(target)) return;
    syncContext();
    const hit = resolve(target);
    if (!hit || !playResolved(hit)) return;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    const title = clean(hit.value?.title || 'the selected video');
    const reply = `Playing ${title}.`;
    const node = document.querySelector('#jarvisReply');
    if (node) { node.textContent = reply; node.classList.add('visible'); }
    try {
      const speak = window.jarvisVoiceAuthoritySpeak || window.jarvisCinematicSpeak || window.jarvisSpeak;
      if (typeof speak === 'function') speak(reply);
    } catch {}
  };

  window.addEventListener('jarvis:voice-command', handleVoice, true);
  document.addEventListener('click', event => {
    const card = event.target?.closest?.('#videoResults [data-jvc-id], #videoResults .jvc-card[data-video-id]');
    if (!card) return;
    const cards = getMediaCards();
    const index = cards.indexOf(card);
    if (index < 0) return;
    const ctx = window.jarvisContextEngine?.get?.();
    if (ctx?.domain === 'MEDIA' && Array.isArray(ctx.results) && ctx.results[index]) {
      window.jarvisContextEngine.set({ selected: ctx.results[index] }, 'merge');
    }
  }, true);

  const observer = new MutationObserver(() => syncContext());
  const boot = () => {
    if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });
    syncContext();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
