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
    const days = Math.round(hours / 24);
    return `${days}D AGO`;
  };
  const enhance = () => {
    const host = document.querySelector('#newsCards');
    if (!host) return;
    const cards = [...host.querySelectorAll('.news-card')];
    if (!cards.length) return;
    host.classList.add('jarvis-news-grid');
    cards.forEach((card, index) => {
      card.classList.toggle('jarvis-news-lead', index === 0);
      const link = card.querySelector('a');
      const title = card.querySelector('strong');
      const meta = card.querySelector('small');
      if (!link || !title || !meta) return;
      const raw = meta.textContent || '';
      const parts = raw.split(' · ');
      const source = parts[0] || 'LIVE NEWS';
      const date = parts.slice(1).join(' · ');
      meta.innerHTML = `<span class="${SOURCE_CLASS}">${source}</span><span class="jarvis-news-time">${relTime(date)}</span>`;
      link.setAttribute('aria-label', `${title.textContent || 'News story'} from ${source}`);
    });
    if (!host.dataset.premiumObserver) {
      host.dataset.premiumObserver = '1';
      new MutationObserver(() => requestAnimationFrame(enhance)).observe(host, { childList: true, subtree: true });
    }
  };
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = './jarvis-news-premium.css?v=20260821-1';
  document.head.appendChild(style);
  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  enhance();
})();
