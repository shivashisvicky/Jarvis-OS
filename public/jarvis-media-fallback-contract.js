(() => {
  'use strict';
  const sync = () => {
    const query = encodeURIComponent(document.querySelector('#videoQuery')?.value?.trim() || 'videos');
    const youtube = document.querySelector('#jvcYoutube');
    const bing = document.querySelector('#jvcBing');
    if (youtube) youtube.setAttribute('data-search-url', `https://www.youtube.com/results?search_query=${query}`);
    if (bing) bing.setAttribute('data-search-url', `https://www.bing.com/videos/search?q=${query}`);
  };
  new MutationObserver(sync).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });
  document.addEventListener('input', event => { if (event.target instanceof Element && event.target.id === 'videoQuery') sync(); }, true);
  setInterval(sync, 250);
})();
