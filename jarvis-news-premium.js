(() => {
  'use strict';
  const SOURCE_CLASS = 'jarvis-news-source';
  const relTime = value => {
    const t = Date.parse(value);
    if (!Number.isFinite(t)) return value || 'LIVE';
    const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (mins < 1) return 'JUST NOW';
    if (mins < 60) return `${mins}M AGO`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}H AGO`;
    return `${Math.round(hours / 24)}D AGO`;
  };
  let frame = 0;
  const enhance = () => {
    frame = 0;
    const host = document.querySelector('#newsCards');
    if (!host) return;
    host.classList.add('jarvis-news-grid');
    [...host.querySelectorAll('.news-card')].forEach((card, index) => {
      card.classList.toggle('jarvis-news-lead', index === 0);
      const link = card.matches('a') ? card : card.querySelector('a');
      const meta = card.querySelector('small');
      const title = card.querySelector('strong');
      if (!link || !meta || !title || meta.dataset.premiumDone === '1') return;
      const raw = meta.textContent || '';
      const parts = raw.split(' · ');
      const fallbackSource = card.querySelector('.news-source')?.textContent?.trim() || 'LIVE NEWS';
      const source = parts[0] || fallbackSource;
      const date = parts.length > 1 ? parts.slice(1).join(' · ') : raw;
      meta.replaceChildren();
      const sourceEl = document.createElement('span');
      sourceEl.className = SOURCE_CLASS;
      sourceEl.textContent = source;
      const timeEl = document.createElement('span');
      timeEl.className = 'jarvis-news-time';
      timeEl.textContent = relTime(date);
      meta.append(sourceEl, timeEl);
      meta.dataset.premiumDone = '1';
      link.setAttribute('aria-label', `${title.textContent || 'News story'} from ${source}`);
    });
  };
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(enhance);
  };
  window.addEventListener('jarvis:news-updated', schedule);
  // Observe only the news container, not the entire document.
  const boot = () => {
    const host = document.querySelector('#newsCards');
    if (host) new MutationObserver(schedule).observe(host, { childList: true, subtree: true });
    schedule();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
