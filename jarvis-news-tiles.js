(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  let lastSignature = '';
  const render = cards => {
    const items = [...cards.querySelectorAll('a.news-dense-item')];
    if (!items.length) return;
    const signature = items.map(a => a.href + '|' + a.textContent).join('||');
    if (signature === lastSignature && cards.querySelector('.jarvis-news-grid')) return;
    lastSignature = signature;
    cards.innerHTML = `<div class="jarvis-news-grid">${items.slice(0,5).map((a,i) => {
      const title = a.querySelector('.news-title')?.textContent?.trim() || a.textContent.trim();
      const source = a.querySelector('.news-source')?.textContent?.trim() || 'LIVE NEWS';
      const date = a.querySelector('.news-country')?.textContent?.trim() || '';
      return `<a class="news-card ${i===0?'jarvis-news-lead':''}" href="${esc(a.href)}" target="_blank" rel="noreferrer"><strong>${esc(title)}</strong><small><span class="jarvis-news-source">${esc(source)}</span>${date ? `<span class="jarvis-news-time">${esc(date)}</span>` : ''}</small></a>`;
    }).join('')}</div>`;
  };
  const hydrate = () => {
    const cards = document.querySelector('#newsCards');
    if (cards) render(cards);
  };
  const observe = () => {
    hydrate();
    const root = document.body;
    if (!root || root.dataset.jarvisNewsTilesObserver) return;
    root.dataset.jarvisNewsTilesObserver = '1';
    new MutationObserver(() => hydrate()).observe(root, {childList:true, subtree:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, {once:true}); else observe();
})();
