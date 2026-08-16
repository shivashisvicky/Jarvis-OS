(() => {
  'use strict';
  window.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('#jvcYoutube,#jvcBing') : null;
    if (!target || !Array.isArray(window.__jarvisOpenedUrls)) return;
    const query = encodeURIComponent(document.querySelector('#videoQuery')?.value?.trim() || 'videos');
    const url = target.id === 'jvcBing'
      ? `https://www.bing.com/videos/search?q=${query}`
      : `https://www.youtube.com/results?search_query=${query}`;
    window.__jarvisOpenedUrls.push(url);
  }, true);
})();
