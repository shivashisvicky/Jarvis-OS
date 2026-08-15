(() => {
  'use strict';
  const sync = () => {
    const news = document.querySelector('#jarvisNewsNav');
    if (news) {
      news.dataset.app = 'news';
      news.title = 'News';
    }
    const inhouse = document.querySelector('#jarvisInhousePlayer');
    if (inhouse && !document.querySelector('#jarvisPlayer')) {
      const alias = document.createElement('div');
      alias.id = 'jarvisPlayer';
      alias.setAttribute('aria-hidden', 'true');
      alias.style.display = 'block';
      alias.style.minHeight = '1px';
      inhouse.parentElement?.insertBefore(alias, inhouse);
    }
  };
  new MutationObserver(sync).observe(document.documentElement, { childList: true, subtree: true });
  sync();
})();
