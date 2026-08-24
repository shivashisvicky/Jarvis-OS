(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__JARVIS_ANDROID_HOME_TOUCH_STABILITY_V1__) return;
  window.__JARVIS_ANDROID_HOME_TOUCH_STABILITY_V1__ = true;
  if (!/Android/i.test(navigator.userAgent || '')) return;

  const style = document.createElement('style');
  style.id = 'jarvis-android-home-touch-stability-v1-style';
  style.textContent = `
    @media (max-width:760px){
      html,body{overscroll-behavior-x:none;overscroll-behavior-y:auto}
      .workspace{touch-action:auto!important;overscroll-behavior-x:none!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch!important;scroll-padding-bottom:120px!important;padding-bottom:calc(120px + env(safe-area-inset-bottom))!important}
      .rail{bottom:calc(6px + env(safe-area-inset-bottom))!important;height:62px!important;z-index:120!important}
      .jarvis-mobile-drawer{max-height:min(58vh,430px);overflow:auto;overscroll-behavior:contain;z-index:130!important}
      .jarvis-mobile-drawer:not(.open){pointer-events:none!important}
      .jarvis-mobile-drawer.open{pointer-events:auto!important}
      .jarvis-mobile-voice-status{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .jhu-hero,.jhu-quick,.jhu-brief,.jhu-section,.jhu-pulse,.command-surface,#newsDesk,.module-grid{position:relative;z-index:1}
    }
  `;
  document.head.appendChild(style);

  const closeDrawer = event => {
    const drawer = document.querySelector('.jarvis-mobile-drawer');
    const more = document.querySelector('.jarvis-mobile-more');
    if (!drawer?.classList.contains('open')) return;
    if (event.target instanceof Element && (event.target.closest('.jarvis-mobile-drawer') || event.target.closest('.jarvis-mobile-more'))) return;
    drawer.classList.remove('open');
    more?.classList.remove('active');
  };
  document.addEventListener('pointerdown', closeDrawer, true);
  document.addEventListener('touchstart', closeDrawer, {capture:true,passive:true});
})();
