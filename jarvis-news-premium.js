(() => {
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
  let scheduled = false;
  const enhance = () => {
    scheduled = false;
    const host = document.querySelector('#newsCards');
    if (!host) return;
    host.classList.add('jarvis-news-grid');
    [...host.querySelectorAll('.news-card')].forEach((card, index) => {
      card.classList.toggle('jarvis-news-lead', index === 0);
      const meta = card.querySelector('small');
      const link = card.querySelector('a');
      const title = card.querySelector('strong');
      if (!meta || !link || !title || meta.dataset.premiumDone === '1') return;
      const raw = meta.textContent || '';
      const parts = raw.split(' · ');
      const source = parts[0] || 'LIVE NEWS';
      const date = parts.slice(1).join(' · ');
      meta.innerHTML = `<span class="${SOURCE_CLASS}">${source}</span><span class="jarvis-news-time">${relTime(date)}</span>`;
      meta.dataset.premiumDone = '1';
      link.setAttribute('aria-label', `${title.textContent || 'News story'} from ${source}`);
    });
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhance);
  };
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = './jarvis-news-premium.css?v=20260821-2';
  document.head.appendChild(style);
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  schedule();
})();
