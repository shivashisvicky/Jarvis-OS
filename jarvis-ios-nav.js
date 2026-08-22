(() => {
  'use strict';
  if (window.__JARVIS_IOS_NAV__) return;
  window.__JARVIS_IOS_NAV__ = true;

  const isMobile = () => window.matchMedia?.('(max-width:760px)').matches || window.innerWidth <= 760;
  const preferred = ['home', 'web', 'maps', 'media', 'calculator', 'snake'];
  const extras = ['files', 'notes', 'settings', 'api', 'remote'];

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
        .rail{position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:120;height:68px;padding:7px;display:flex;flex-direction:row;gap:5px;overflow:hidden;border:1px solid var(--line-strong);border-radius:16px;background:rgba(2,7,10,.96);box-shadow:0 12px 40px rgba(0,0,0,.55);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);touch-action:pan-x;overscroll-behavior-x:contain}
        .nav-group{display:flex;flex:1 1 auto;min-width:0;gap:4px;margin:0}
        .nav{display:none;flex:1 1 0;width:auto;min-width:0;height:52px;min-height:52px;padding:5px 2px;justify-items:center;align-content:center;gap:3px;border-radius:10px}
        .nav b{font-size:17px;line-height:1}.nav span{font-size:6px;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60px}
        .nav[data-app="home"],.nav[data-app="web"],.nav[data-app="maps"],.nav[data-app="media"],.nav[data-app="calculator"],.nav[data-app="snake"]{display:grid}
        .jarvis-ios-more{flex:0 0 52px;width:52px;height:52px;border:1px solid var(--line);background:rgba(5,16,22,.8);color:var(--muted);border-radius:10px;display:grid;justify-items:center;align-content:center;gap:3px;cursor:pointer;touch-action:manipulation}
        .jarvis-ios-more b{font-size:18px;line-height:1}.jarvis-ios-more span{font-size:6px;line-height:1}
        .jarvis-ios-drawer{position:fixed;left:10px;right:10px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:130;padding:10px;display:none;grid-template-columns:repeat(3,1fr);gap:7px;border:1px solid var(--line-strong);border-radius:14px;background:rgba(2,8,12,.98);box-shadow:0 18px 50px rgba(0,0,0,.62);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}
        .jarvis-ios-drawer.open{display:grid}
        .jarvis-ios-drawer button{min-height:58px;border:1px solid var(--line);background:rgba(7,18,24,.92);color:var(--muted);border-radius:10px;display:grid;justify-items:center;align-content:center;gap:4px;touch-action:manipulation}
        .jarvis-ios-drawer button b{font-size:18px}.jarvis-ios-drawer button span{font-size:7px;white-space:nowrap}.jarvis-ios-drawer button.selected{color:var(--cyan2);border-color:var(--cyan)}
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
    let more = rail.querySelector('.jarvis-ios-more');
    if (!more) {
      more = document.createElement('button');
      more.type = 'button';
      more.className = 'jarvis-ios-more';
      more.innerHTML = '<b>⋯</b><span>MORE</span>';
      rail.appendChild(more);
      more.addEventListener('click', () => document.querySelector('.jarvis-ios-drawer')?.classList.toggle('open'));
    }
    let drawer = document.querySelector('.jarvis-ios-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.className = 'jarvis-ios-drawer';
      document.body.appendChild(drawer);
    }
    const buttons = extras.map(id => {
      const nav = group.querySelector(`.nav[data-app="${id}"]`);
      if (!nav) return '';
      const icon = nav.querySelector('b')?.textContent || '•';
      const label = nav.querySelector('span')?.textContent || id;
      return `<button type="button" data-target="${id}"><b>${icon}</b><span>${label}</span></button>`;
    }).join('');
    drawer.innerHTML = buttons;
    drawer.querySelectorAll('button[data-target]').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-target');
        group.querySelector(`.nav[data-app="${CSS.escape(id || '')}"]`)?.click();
        drawer.classList.remove('open');
      });
    });
  };

  inject();
  new MutationObserver(() => requestAnimationFrame(sync)).observe(document.documentElement, { childList:true, subtree:true });
  sync();
  window.addEventListener('resize', () => requestAnimationFrame(sync), { passive:true });
})();
