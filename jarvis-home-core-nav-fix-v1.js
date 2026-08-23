(()=>{
  'use strict';
  if(window.__JARVIS_HOME_CORE_NAV_FIX_V1__)return;
  window.__JARVIS_HOME_CORE_NAV_FIX_V1__=true;

  const ACTIONS=[
    ['data-jhc','brief',"TODAY'S BRIEF"],
    ['data-jhc','ai','AI INTEL'],
    ['data-jhc-app','maps','OPEN MAPS'],
    ['data-jhc-app','media','OPEN MEDIA'],
    ['data-jhc','cap','CAPABILITIES']
  ];

  function ensure(){
    const command=document.getElementById('commandForm');
    if(!command)return;
    let actions=document.getElementById('jhcActions');
    if(actions && actions.previousElementSibling===command)return;
    if(actions)actions.remove();
    actions=document.createElement('div');
    actions.id='jhcActions';
    actions.className='jhc-actions';
    actions.innerHTML=ACTIONS.map(([attr,value,label])=>`<button type="button" ${attr}="${value}">${label}</button>`).join('');
    command.insertAdjacentElement('afterend',actions);
  }

  const observer=new MutationObserver(()=>ensure());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  ensure();
})();
