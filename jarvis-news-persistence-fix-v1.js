(()=>{
  'use strict';
  if(window.__JARVIS_NEWS_PERSISTENCE_FIX_V1__)return;
  window.__JARVIS_NEWS_PERSISTENCE_FIX_V1__=true;

  let homeSeen=false;
  let refreshTimer=0;
  let briefTimer=0;
  let lastCards=null;

  const isHome=()=>!!document.querySelector('#newsDesk #newsCards');
  const refreshNews=()=>{
    const button=document.querySelector('#refreshNews');
    const cards=document.querySelector('#newsCards');
    if(!(button instanceof HTMLButtonElement)||!cards)return;
    const hasRealCards=!!cards.querySelector('.news-dense-item');
    if(!hasRealCards){
      window.clearTimeout(refreshTimer);
      refreshTimer=window.setTimeout(()=>{
        const current=document.querySelector('#refreshNews');
        if(current instanceof HTMLButtonElement)current.click();
      },350);
    }
  };
  const notifyBrief=()=>{
    window.clearTimeout(briefTimer);
    briefTimer=window.setTimeout(()=>{
      if(!isHome())return;
      const cards=document.querySelectorAll('#newsCards .news-dense-item');
      if(cards.length)window.dispatchEvent(new CustomEvent('jarvis:news-updated',{detail:{reason:'navigation-return'}}));
    },180);
  };

  const observer=new MutationObserver(()=>{
    if(!isHome())return;
    const cards=document.querySelector('#newsCards');
    if(cards!==lastCards){
      lastCards=cards;
      if(homeSeen)refreshNews();
      homeSeen=true;
    }
    if(cards?.querySelector('.news-dense-item'))notifyBrief();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('jarvis:news-updated',()=>notifyBrief());
  window.setTimeout(()=>{
    if(isHome()){homeSeen=true;lastCards=document.querySelector('#newsCards');}
  },1200);
})();
