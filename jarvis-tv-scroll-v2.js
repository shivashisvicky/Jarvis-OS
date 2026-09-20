(() => {
  'use strict';

  if (window.__JARVIS_TV_SCROLL_V5__) return;

  const isTvBrowser = () => {
    const ua = String(navigator.userAgent || '');
    return /(jiobrowser|jiosphere|bravia|smart[- ]?tv|android tv|googletv|google tv|hbbtv|tizen tv|aft[abms]|netcast|web0s|viera)/i.test(ua);
  };

  if (!isTvBrowser()) return;
  window.__JARVIS_TV_SCROLL_V5__ = true;

  /*
   * TV ONLY.
   *
   * JioSphere has already been proven to scroll a plain native document.
   * The previous TV experiments made .workspace a nested scroll owner and
   * then tried to emulate scrolling through pointer gestures. That adds an
   * interaction layer JioSphere does not reliably provide.
   *
   * For TV, remove the nested scroll boundary and return scrolling to the
   * browser document itself. This deliberately mirrors tv-scroll-probe.html:
   *
   *   html/body/#app  -> native document height
   *   .os             -> content-sized shell
   *   .os-main        -> content-sized main area
   *   .workspace      -> normal flow, no nested scrolling
   *
   * Navigation/click behavior is otherwise untouched.
   */

  const applyNativeDocumentFlow = () => {
    const root = document.documentElement;
    const body = document.body;
    const app = document.querySelector('#app');
    const os = document.querySelector('.os');
    const main = document.querySelector('.os-main');
    const rail = document.querySelector('.rail');
    const workspace = document.querySelector('.workspace');

    if (!body || !os || !main || !workspace) return false;

    const autoFlow = [
      [root, 'height', 'auto'],
      [root, 'min-height', '100%'],
      [root, 'overflow-y', 'auto'],
      [root, 'overflow-x', 'hidden'],
      [body, 'height', 'auto'],
      [body, 'min-height', '100%'],
      [body, 'overflow-y', 'auto'],
      [body, 'overflow-x', 'hidden'],
      [app, 'height', 'auto'],
      [app, 'min-height', '100vh'],
      [app, 'overflow', 'visible'],
      [os, 'height', 'auto'],
      [os, 'min-height', '100vh'],
      [os, 'overflow', 'visible'],
      [os, 'grid-template-rows', '68px auto 28px'],
      [main, 'min-height', '0'],
      [main, 'height', 'auto'],
      [main, 'overflow', 'visible'],
      [rail, 'height', 'auto'],
      [rail, 'max-height', 'none'],
      [rail, 'overflow', 'visible'],
      [workspace, 'height', 'auto'],
      [workspace, 'max-height', 'none'],
      [workspace, 'min-height', '0'],
      [workspace, 'overflow', 'visible'],
      [workspace, 'overscroll-behavior', 'auto'],
      [workspace, 'scroll-behavior', 'auto']
    ];

    autoFlow.forEach(([el, property, value]) => {
      if (el instanceof HTMLElement || el === document.documentElement) {
        el.style.setProperty(property, value, 'important');
      }
    });

    workspace.dataset.jarvisTvScrollable = 'native-document';
    return true;
  };

  const update = () => {
    if (!applyNativeDocumentFlow()) return;

    const scrolling = document.scrollingElement || document.documentElement;
    const max = Math.max(0, scrolling.scrollHeight - window.innerHeight);
    document.documentElement.dataset.jarvisTvScrollable = max > 2 ? 'true' : 'false';
  };

  const start = () => {
    update();

    const observer = new MutationObserver(() => {
      // Keep this TV-only normalization after JARVIS re-renders the shell.
      update();
    });

    observer.observe(document.documentElement, {childList:true, subtree:true});
    window.addEventListener('resize', update, {passive:true});
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true});
  } else {
    start();
  }
})();
