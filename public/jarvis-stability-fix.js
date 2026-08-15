(() => {
  'use strict';

  const stabilize = () => {
    const newsButtons = [...document.querySelectorAll('button.nav[data-app="news"]')];
    if (newsButtons.length > 1) {
      const preferred = document.querySelector('#jarvisNewsNav') || newsButtons[0];
      newsButtons.forEach(button => {
        if (button !== preferred) button.remove();
      });
    }

    const news = document.querySelector('#jarvisNewsNav');
    if (news) {
      news.dataset.app = 'news';
      news.title = 'News';
    }
  };

  new MutationObserver(stabilize).observe(document.documentElement, { childList: true, subtree: true });
  stabilize();
})();
