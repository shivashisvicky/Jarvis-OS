(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__JARVIS_MOBILE_UNIFIED__) return;
  window.__JARVIS_MOBILE_UNIFIED__ = true;

  const mobile = () => window.matchMedia?.('(max-width: 760px)').matches || window.innerWidth <= 760;

  const style = () => {
    if (document.querySelector('#jarvis-mobile-unified-style')) return;
    const s = document.createElement('style');
    s.id = 'jarvis-mobile-unified-style';
    s.textContent = `
      html,body,#app{width:100%;max-width:100%;min-width:0}
      body{-webkit-text-size-adjust:100%;text-size-adjust:100%;overscroll-behavior:none}
      button,input,select,textarea{font:inherit}
      button,a,[role="button"]{-webkit-tap-highlight-color:transparent;touch-action:manipulation}
      @media (max-width:760px){
        .os{height:100dvh;min-height:100dvh;grid-template-rows:58px minmax(0,1fr) 24px;overflow:hidden}
        .topbar{height:58px;padding:0 12px;grid-template-columns:1fr}.top-center{display:none}
        .brand strong{font-size:10px}.brand small{font-size:5px}.brand-orb{width:30px;height:30px}
        .os-main{display:block;min-height:0;height:calc(100dvh - 82px)}
        .rail{position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:120;height:66px;padding:7px;display:flex;flex-direction:row;gap:4px;overflow:hidden;border:1px solid var(--line-strong);border-radius:15px;background:rgba(2,7,10,.94);box-shadow:0 12px 40px rgba(0,0,0,.5);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
        .rail::-webkit-scrollbar{display:none}.nav{flex:1 1 0;width:auto;min-width:0;min-height:50px;height:50px;padding:5px 2px;display:grid;justify-items:center;align-content:center;gap:3px;border-radius:10px}
        .nav b{font-size:17px;line-height:1}.nav span{font-size:6px;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60px}.nav.mobile-overflow-hidden{display:none}
        .jarvis-mobile-more{flex:1 1 0;min-width:0;min-height:50px;height:50px;padding:5px 2px;border:1px solid var(--line);background:rgba(5,16,22,.75);color:var(--muted);border-radius:10px;display:grid;justify-items:center;align-content:center;gap:3px;cursor:pointer}
        .jarvis-mobile-more b{font-size:17px;line-height:1}.jarvis-mobile-more span{font-size:6px;line-height:1;white-space:nowrap}.jarvis-mobile-more.active{color:var(--cyan2);border-color:var(--cyan)}
        .jarvis-mobile-drawer{position:fixed;left:10px;right:10px;bottom:calc(82px + env(safe-area-inset-bottom));z-index:130;padding:10px;display:none;grid-template-columns:repeat(3,1fr);gap:7px;border:1px solid var(--line-strong);border-radius:14px;background:rgba(2,8,12,.97);box-shadow:0 18px 50px rgba(0,0,0,.62);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}
        .jarvis-mobile-drawer.open{display:grid}.jarvis-mobile-drawer button{min-height:58px;border:1px solid var(--line);background:rgba(7,18,24,.9);color:var(--muted);border-radius:10px;display:grid;justify-items:center;align-content:center;gap:4px}
        .jarvis-mobile-drawer button b{font-size:18px}.jarvis-mobile-drawer button span{font-size:7px;letter-spacing:.05em;white-space:nowrap}.jarvis-mobile-drawer button.selected{color:var(--cyan2);border-color:var(--cyan)}
        .workspace{height:100%;min-height:0;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:24px 12px calc(96px + env(safe-area-inset-bottom));overscroll-behavior-y:contain}
        .page-head{margin-bottom:18px;display:block}.page-head h1{font-size:clamp(38px,11vw,52px);line-height:.95}.sub{font-size:14px;line-height:1.5}
        .command-surface{padding:10px;border-radius:12px}.command-surface form{grid-template-columns:auto minmax(0,1fr) auto;gap:7px}.command-surface input{font-size:16px;min-width:0}.command-surface .voice{width:46px;height:46px;min-width:46px}.command-surface .execute{grid-column:1/-1;width:100%;height:46px;font-size:11px}.command-surface:before{display:none}
        .search-row{display:flex;flex-wrap:wrap;gap:7px}.search-row>*{min-width:0;flex:1 1 160px}.search-row select{flex:0 1 120px}.primary,.secondary{min-height:44px;font-size:12px;padding:10px 14px}.panel{border-radius:10px}.module-grid{grid-template-columns:1fr 1fr}.settings-card{grid-template-columns:1fr}.telemetry-grid{grid-template-columns:1fr 1fr}
        .maps-grid,.media-workspace,.api-workbench,.workspace-grid,.lower-grid{grid-template-columns:1fr}.map-frame{height:min(52vh,420px);min-height:280px}.map-frame iframe{min-height:280px;height:100%;width:100%}.media-side{min-height:0}.video-result{grid-template-columns:92px 1fr 18px}.video-result img{width:92px;height:54px}.api-response pre{min-height:240px}.form-grid{grid-template-columns:1fr}.dual-pane{grid-template-columns:1fr}.transfer-center{min-height:48px}.statusbar{display:none}#newsCards{overflow:hidden}.news-grid{grid-template-columns:1fr}.news-card{grid-template-columns:100px 1fr}.news-card img{width:100px;min-height:130px}
      }
      @media (max-width:430px){.workspace{padding-left:10px;padding-right:10px}.module-grid,.telemetry-grid{grid-template-columns:1fr}.command-surface .execute{display:block}.page-head h1{font-size:40px}.jarvis-mobile-drawer{grid-template-columns:repeat(2,1fr)}}
      .jarvis-mobile-voice-status{margin:6px 4px 0;min-height:16px;color:var(--faint);font-size:8px;letter-spacing:.08em}.voice.listening{color:var(--cyan2)!important;border-color:var(--cyan)!important;box-shadow:0 0 25px rgba(101,220,255,.2)!important}
    `;
    document.head.appendChild(s);
  };

  const voiceStatus = () => {
    const button = document.querySelector('#voiceBtn');
    if (!button || button.parentElement?.querySelector('.jarvis-mobile-voice-status')) return;
    const status = document.createElement('div'); status.className='jarvis-mobile-voice-status'; status.setAttribute('aria-live','polite'); status.textContent='VOICE READY'; button.parentElement?.appendChild(status);
  };

  const markMobileVoice = () => {
    const button = document.querySelector('#voiceBtn');
    if (!button || button.dataset.mobileVoiceBound) return;
    button.dataset.mobileVoiceBound='1'; button.setAttribute('aria-label','Activate JARVIS voice command'); button.setAttribute('title','Voice command');
    window.addEventListener('jarvis:voice-command', event => { const status=button.parentElement?.querySelector('.jarvis-mobile-voice-status'); if(status) status.textContent=`COMMAND: ${String(event.detail?.text||'').toUpperCase()}`; });
    window.addEventListener('jarvis:voice-state', event => { const status=button.parentElement?.querySelector('.jarvis-mobile-voice-status'); if(status) status.textContent=event.detail?.active?'LISTENING':'VOICE READY'; });
  };

  const ensureMoreDrawer = () => {
    if (!mobile()) return;
    const rail=document.querySelector('.rail'); if(!rail) return;
    const navs=[...rail.querySelectorAll('.nav[data-app]')]; if(!navs.length) return;
    navs.forEach((nav,index)=>nav.classList.toggle('mobile-overflow-hidden',index>=6));
    let more=rail.querySelector('.jarvis-mobile-more');
    if(!more){
      more=document.createElement('button'); more.type='button'; more.className='jarvis-mobile-more'; more.innerHTML='<b>⋯</b><span>MORE</span>'; rail.appendChild(more);
      more.addEventListener('click',()=>{const drawer=document.querySelector('.jarvis-mobile-drawer');if(!drawer)return;drawer.classList.toggle('open');more.classList.toggle('active',drawer.classList.contains('open'));});
    }
    let drawer=document.querySelector('.jarvis-mobile-drawer');
    if(!drawer){drawer=document.createElement('div');drawer.className='jarvis-mobile-drawer';document.body.appendChild(drawer);}
    const html=navs.slice(6).map(nav=>{const id=nav.dataset.app||'';const icon=nav.querySelector('b')?.textContent||'•';const label=nav.querySelector('span')?.textContent||id;return `<button type="button" data-mobile-target="${id}"><b>${icon}</b><span>${label}</span></button>`;}).join('');
    if(drawer.innerHTML!==html){
      drawer.innerHTML=html;
      drawer.querySelectorAll('button[data-mobile-target]').forEach(button=>button.addEventListener('click',()=>{const id=button.getAttribute('data-mobile-target');const target=rail.querySelector(`.nav[data-app="${CSS.escape(id||'')}"]`);target?.click();drawer.classList.remove('open');more?.classList.remove('active');}));
    }
  };

  const boot=()=>{style();if(mobile()){voiceStatus();ensureMoreDrawer();}else{document.querySelector('.jarvis-mobile-drawer')?.remove();document.querySelector('.jarvis-mobile-more')?.remove();document.querySelectorAll('.nav.mobile-overflow-hidden').forEach(el=>el.classList.remove('mobile-overflow-hidden'));}markMobileVoice();};
  new MutationObserver(boot).observe(document.documentElement,{childList:true,subtree:true});
  boot(); window.addEventListener('resize',boot,{passive:true});
})();
