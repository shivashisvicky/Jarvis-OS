(() => {
  'use strict';
  if (window.__JARVIS_IOS_NAV__) return;
  window.__JARVIS_IOS_NAV__ = true;

  const isMobile = () => window.matchMedia?.('(max-width:760px)').matches || window.innerWidth <= 760;
  const preferred = ['home', 'web', 'maps', 'media', 'calculator', 'snake'];

  const inject = () => {
    if (document.querySelector('#jarvis-ios-nav-style')) return;
    const style = document.createElement('style');
    style.id = 'jarvis-ios-nav-style';
    style.textContent = `
      @media (max-width:760px){
        html,body,#app{width:100%;max-width:100%;min-width:0}
        body{overscroll-behavior-x:none;-webkit-text-size-adjust:100%;}
        .os{height:100dvh;min-height:100dvh;grid-template-rows:58px minmax(0,1fr);overflow:hidden}
        .topbar{height:58px;padding:0 12px;grid-template-columns:1fr}
        .top-center{display:none}
        .os-main{display:block;height:calc(100dvh - 58px);min-height:0}
        .rail{position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:120;height:68px;padding:7px;display:flex;flex-direction:row;gap:5px;overflow-x:auto;overflow-y:hidden;border:1px solid var(--line-strong);border-radius:16px;background:rgba(2,7,10,.96);box-shadow:0 12px 40px rgba(0,0,0,.55);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);touch-action:pan-x;overscroll-behavior-x:contain;scrollbar-width:none}
        .rail::-webkit-scrollbar{display:none}
        .nav-group{display:flex;flex:1 0 auto;min-width:100%;gap:5px;margin:0}
        .nav{display:none;flex:0 0 82px;width:82px;min-width:82px;height:52px;min-height:52px;padding:5px 2px;justify-items:center;align-content:center;gap:3px;border-radius:10px}
        .nav b{font-size:17px;line-height:1}.nav span{font-size:6px;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70px}
        .nav[data-app="home"],.nav[data-app="web"],.nav[data-app="maps"],.nav[data-app="media"],.nav[data-app="calculator"],.nav[data-app="snake"]{display:grid}
        .workspace{height:100%;min-height:0;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:24px 11px calc(96px + env(safe-area-inset-bottom));overscroll-behavior-y:contain;touch-action:pan-y}
        .statusbar{display:none}
        .command-surface form{grid-template-columns:auto minmax(0,1fr) auto}
        .command-surface .voice{width:46px;height:46px;min-width:46px}
        .command-surface .execute{display:none}
        .module-grid{grid-template-columns:1fr}
        .page-head{margin-bottom:18px}.page-head h1{font-size:clamp(38px,11vw,52px);line-height:.95}.sub{font-size:14px;line-height:1.5}
        .search-row{display:flex;flex-wrap:wrap;gap:7px}.search-row>*{min-width:0;flex:1 1 150px}
        .primary,.secondary{min-height:44px;font-size:12px}
      }
    `;
    document.head.appendChild(style);
  };

  const sync = () => {
    if (!isMobile()) return;
    const rail = document.querySelector('.rail');
    if (!rail) return;
    const group = rail.querySelector('.nav-group');
    if (!group) return;
    for (const id of preferred) {
      const nav = group.querySelector(`.nav[data-app="${id}"]`);
      if (nav) group.appendChild(nav);
    }
    rail.querySelectorAll('.jarvis-ios-more,.jarvis-ios-drawer').forEach(el => el.remove());
  };

  inject();
  new MutationObserver(() => requestAnimationFrame(sync)).observe(document.documentElement, { childList:true, subtree:true });
  sync();
  window.addEventListener('resize', () => requestAnimationFrame(sync), { passive:true });
})();
