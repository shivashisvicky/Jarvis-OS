(() => {
  'use strict';
  if (window.__JARVIS_MOBILE_ENGINEERING_MAP_V2__) return;
  window.__JARVIS_MOBILE_ENGINEERING_MAP_V2__ = true;

  const mobile = () => window.matchMedia?.('(max-width:760px)').matches || window.innerWidth <= 760;
  const preferred = ['home','web','maps','media','calculator','snake'];

  const css = () => {
    if (document.querySelector('#jarvis-mobile-engineering-map-v2-style')) return;
    const s = document.createElement('style');
    s.id = 'jarvis-mobile-engineering-map-v2-style';
    s.textContent = `
      @media(max-width:760px){
        #app .rail .nav[data-app="home"],#app .rail .nav[data-app="web"],#app .rail .nav[data-app="maps"],#app .rail .nav[data-app="media"],#app .rail .nav[data-app="calculator"],#app .rail .nav[data-app="snake"]{display:grid!important}
        #app .rail .nav[data-app="home"],#app .rail .nav[data-app="web"],#app .rail .nav[data-app="maps"],#app .rail .nav[data-app="media"],#app .rail .nav[data-app="calculator"],#app .rail .nav[data-app="snake"]{flex:1 1 0;width:auto;min-width:0}
        #app .rail .nav.jarvis-final-hidden,#app .rail .nav.jarvis-recovery-hidden,#app .rail .nav.mobile-overflow-hidden{display:none!important}
        #app .rail .nav[data-app="home"].jarvis-final-hidden,#app .rail .nav[data-app="web"].jarvis-final-hidden,#app .rail .nav[data-app="maps"].jarvis-final-hidden,#app .rail .nav[data-app="media"].jarvis-final-hidden,#app .rail .nav[data-app="calculator"].jarvis-final-hidden,#app .rail .nav[data-app="snake"].jarvis-final-hidden{display:grid!important}
        .jarvis-v2-more{position:fixed;right:16px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:151;display:grid;place-items:center;width:42px;height:30px;border:1px solid var(--line-strong,#17303a);border-radius:9px;background:rgba(2,8,12,.96);color:var(--muted,#8ca6ae);font:700 10px/1 inherit;letter-spacing:.08em;box-shadow:0 8px 25px rgba(0,0,0,.45);cursor:pointer}
        .jarvis-v2-drawer{position:fixed;left:10px;right:10px;bottom:calc(120px + env(safe-area-inset-bottom));z-index:150;padding:12px;display:none;grid-template-columns:1fr 1fr;gap:9px;border:1px solid var(--line-strong,#17303a);border-radius:15px;background:rgba(2,8,12,.98);box-shadow:0 18px 50px rgba(0,0,0,.62);backdrop-filter:blur(20px)}
        .jarvis-v2-drawer.open{display:grid}
        .jarvis-v2-drawer button{min-height:58px;border:1px solid var(--line,#17303a);background:rgba(7,18,24,.94);color:var(--muted,#8ca6ae);border-radius:10px;display:grid;justify-items:center;align-content:center;gap:5px;font:inherit;cursor:pointer}
        .jarvis-v2-drawer button b{font-size:18px}.jarvis-v2-drawer button span{font-size:9px;letter-spacing:.06em}
      }
    `;
    document.head.appendChild(s);
  };

  const ensureEngineeringNav = (rail, id, icon, label) => {
    let nav = rail.querySelector(`.nav[data-app="${id}"]`);
    if (nav) return nav;
    const group = rail.querySelector('.nav-group');
    nav = document.createElement('button');
    nav.type = 'button'; nav.className = 'nav'; nav.dataset.app = id;
    nav.innerHTML = `<b>${icon}</b><span>${label}</span>`;
    (group || rail).appendChild(nav);
    return nav;
  };

  const setupMore = () => {
    const rail = document.querySelector('.rail');
    if (!rail) return;
    const api = ensureEngineeringNav(rail,'api','⇄','API Lab');
    const sftp = ensureEngineeringNav(rail,'remote','↔','SFTP');
    if (!mobile()) { document.querySelector('.jarvis-v2-more')?.remove(); document.querySelector('.jarvis-v2-drawer')?.remove(); return; }
    const more = document.querySelector('.jarvis-v2-more') || document.body.appendChild(Object.assign(document.createElement('button'),{className:'jarvis-v2-more',textContent:'MORE',type:'button'}));
    let drawer = document.querySelector('.jarvis-v2-drawer');
    if (!drawer) { drawer=document.createElement('div'); drawer.className='jarvis-v2-drawer'; document.body.appendChild(drawer); }
    if (drawer.dataset.bound !== '1') {
      drawer.innerHTML = '';
      [[api,'⇄','API LAB'],[sftp,'↔','SFTP']].forEach(([nav,icon,label]) => {
        const b=document.createElement('button'); b.type='button'; b.innerHTML=`<b>${icon}</b><span>${label}</span>`;
        b.onclick=()=>{ nav.click(); drawer.classList.remove('open'); };
        drawer.appendChild(b);
      });
      drawer.dataset.bound = '1';
    }
    if (more.dataset.bound !== '1') { more.onclick=()=>drawer.classList.toggle('open'); more.dataset.bound='1'; }
  };

  // Maps is intentionally owned by jarvis-map-final-authority.js.
  // The previous mobile map implementation registered a second geocoder/search
  // handler and could overwrite canonical local results after voice/manual search.
  const setupMaps = () => {};

  const arbitration=()=>{css();const rail=document.querySelector('.rail');if(!rail)return;const navs=[...rail.querySelectorAll('.nav[data-app]')];navs.forEach(n=>{if(preferred.includes(n.dataset.app||'')){n.classList.remove('jarvis-final-hidden','jarvis-recovery-hidden','mobile-overflow-hidden');}else if(mobile()){n.classList.add('jarvis-v2-engineering-hidden');}});setupMore();setupMaps();};
  new MutationObserver(()=>requestAnimationFrame(arbitration)).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',()=>requestAnimationFrame(arbitration),{passive:true});
  arbitration();
})();
