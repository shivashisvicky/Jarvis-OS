(() => {
  'use strict';
  if (window.__JARVIS_ENGINEERING_BAY_CLICK_FIX_V2__) return;
  window.__JARVIS_ENGINEERING_BAY_CLICK_FIX_V2__ = true;

  const scriptSrc='./jarvis-engineering-bay-v1.js?v=20260912-engineering-bay-v2';
  const openBay=()=>{
    const direct=window.jarvisOpenEngineeringBay;
    if(typeof direct==='function'){direct();return;}
    const load=window.jarvisLoadFeature;
    if(typeof load==='function'){
      Promise.resolve(load('engineeringBay')).then(()=>{
        const ready=window.jarvisOpenEngineeringBay;
        if(typeof ready==='function')ready();
        else window.dispatchEvent(new CustomEvent('jarvis:open-engineering-bay'));
      }).catch(error=>console.warn('[JARVIS Engineering Bay click fix]',error));
      return;
    }
    const existing=document.querySelector(`script[src^="${scriptSrc.split('?')[0]}"]`);
    if(existing){
      existing.addEventListener('load',()=>{
        const ready=window.jarvisOpenEngineeringBay;
        if(typeof ready==='function')ready();
        else window.dispatchEvent(new CustomEvent('jarvis:open-engineering-bay'));
      },{once:true});
      return;
    }
    const script=document.createElement('script');
    script.src=scriptSrc;
    script.onload=()=>{
      const ready=window.jarvisOpenEngineeringBay;
      if(typeof ready==='function')ready();
      else window.dispatchEvent(new CustomEvent('jarvis:open-engineering-bay'));
    };
    script.onerror=()=>console.warn('[JARVIS Engineering Bay click fix] bay script load failed');
    document.head.appendChild(script);
  };

  const resolveTarget=event=>event.target instanceof Element?event.target.closest('[data-engineering-bay]'):null;
  const handle=event=>{
    const target=resolveTarget(event);
    if(!target)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openBay();
  };

  const bind=()=>{
    if(!document.documentElement||document.documentElement.dataset.engineeringBayClickFix)return;
    document.documentElement.dataset.engineeringBayClickFix='2';
    document.addEventListener('pointerup',handle,true);
    document.addEventListener('click',handle,true);
    document.addEventListener('touchend',handle,{capture:true,passive:false});
  };
  bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();