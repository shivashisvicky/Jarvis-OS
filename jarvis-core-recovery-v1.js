(() => {
  'use strict';
  if (window.__JARVIS_CORE_RECOVERY_V2__) return;
  window.__JARVIS_CORE_RECOVERY_V2__ = true;

  const isMobile=()=>window.matchMedia?.('(max-width:760px)').matches||window.innerWidth<=760;
  const injectCss=()=>{if(document.querySelector('#jarvis-core-recovery-style'))return;const s=document.createElement('style');s.id='jarvis-core-recovery-style';s.textContent=`
    .jarvis-recovery-more{position:fixed;left:10px;right:10px;bottom:calc(82px + env(safe-area-inset-bottom));z-index:130;padding:10px;display:none;grid-template-columns:repeat(3,1fr);gap:8px;border:1px solid var(--line-strong,#17303a);border-radius:14px;background:rgba(2,8,12,.98);box-shadow:0 18px 50px rgba(0,0,0,.62);backdrop-filter:blur(20px)}
    .jarvis-recovery-more.open{display:grid}.jarvis-recovery-more button{min-height:58px;border:1px solid var(--line,#17303a);background:rgba(7,18,24,.92);color:var(--muted,#8ca6ae);border-radius:10px;display:grid;justify-items:center;align-content:center;gap:4px;font:inherit}.jarvis-recovery-more button b{font-size:18px}.jarvis-recovery-more button span{font-size:8px;letter-spacing:.05em}.jarvis-recovery-more-toggle{display:none!important}
    @media(max-width:760px){.jarvis-recovery-more-toggle{display:grid!important;flex:1 1 0;min-width:0;min-height:50px;height:50px;padding:5px 2px;border:1px solid var(--line,#17303a);background:rgba(5,16,22,.75);color:var(--muted,#8ca6ae);border-radius:10px;justify-items:center;align-content:center;gap:3px;font:inherit}.jarvis-recovery-more-toggle b{font-size:17px;line-height:1}.jarvis-recovery-more-toggle span{font-size:6px;line-height:1}.jarvis-recovery-more{grid-template-columns:repeat(2,1fr)}}
  `;document.head.appendChild(s);};

  const ensureEngineeringNavigation=()=>{const rail=document.querySelector('.rail');if(!rail)return;[['api','⇄','API Lab'],['remote','↔','SFTP']].forEach(([id,icon,label])=>{if(rail.querySelector(`.nav[data-app="${id}"]`))return;const b=document.createElement('button');b.type='button';b.className='nav';b.dataset.app=id;b.innerHTML=`<b>${icon}</b><span>${label}</span>`;rail.appendChild(b);});};
  const ensureHomeEngineeringCards=()=>{const grid=document.querySelector('.module-grid');if(!grid)return;const existing=new Set([...grid.querySelectorAll('[data-app]')].map(x=>x.getAttribute('data-app')));[['api','⇄','ENGINEERING','API Lab','REST request client'],['remote','↔','ENGINEERING','SFTP','Secure transfer workspace']].forEach(([id,icon,group,name,desc])=>{if(existing.has(id))return;const b=document.createElement('button');b.className='module-card';b.type='button';b.dataset.app=id;b.innerHTML=`<span class="module-icon">${icon}</span><div><small>${group}</small><strong>${name}</strong><p>Open ${desc}</p></div><b>›</b>`;grid.appendChild(b);});};

  const ensureMobileMore=()=>{
    document.querySelector('.jarvis-mobile-more')?.remove();
    if(!isMobile()){document.querySelector('#jarvis-recovery-more')?.remove();document.querySelector('.jarvis-recovery-more-toggle')?.remove();document.querySelectorAll('.nav.jarvis-recovery-hidden').forEach(n=>n.classList.remove('jarvis-recovery-hidden'));return;}
    const rail=document.querySelector('.rail');if(!rail)return;const navs=[...rail.querySelectorAll('.nav[data-app]')];if(!navs.length)return;const keep=6;navs.forEach((nav,i)=>nav.classList.toggle('jarvis-recovery-hidden',i>=keep));
    let toggle=rail.querySelector('.jarvis-recovery-more-toggle');if(!toggle){toggle=document.createElement('button');toggle.type='button';toggle.className='jarvis-recovery-more-toggle';toggle.innerHTML='<b>⋯</b><span>MORE</span>';rail.appendChild(toggle);}
    let drawer=document.querySelector('#jarvis-recovery-more');if(!drawer){drawer=document.createElement('div');drawer.id='jarvis-recovery-more';drawer.className='jarvis-recovery-more';document.body.appendChild(drawer);}
    const html=navs.slice(keep).map(nav=>`<button type="button" data-recovery-target="${nav.dataset.app||''}"><b>${nav.querySelector('b')?.textContent||'•'}</b><span>${nav.querySelector('span')?.textContent||nav.dataset.app||''}</span></button>`).join('');
    if(drawer.innerHTML!==html){drawer.innerHTML=html;drawer.querySelectorAll('[data-recovery-target]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.getAttribute('data-recovery-target');const nav=rail.querySelector(`.nav[data-app="${CSS.escape(id||'')}"]`);nav?.click();drawer.classList.remove('open');}));}
    toggle.onclick=()=>drawer.classList.toggle('open');
  };

  const setupCalculator=()=>{const display=document.querySelector('#calcDisplay'),keys=document.querySelector('.calc .keys');if(!display||!keys||keys.dataset.recoveryBound)return;keys.dataset.recoveryBound='1';let expression='';const refresh=v=>{display.value=v||'0';};const calculate=()=>{if(!expression)return;if(!/^[0-9+\-*/().\s]+$/.test(expression)){refresh('ERROR');return;}try{const result=Function(`"use strict";return (${expression})`)();if(!Number.isFinite(result))throw new Error('non-finite');expression=String(Number(result.toPrecision(12)));refresh(expression);}catch{expression='';refresh('ERROR');}};keys.querySelectorAll('button[data-key]').forEach(button=>button.addEventListener('click',()=>{const key=button.getAttribute('data-key')||'';if(key==='=')return calculate();if(display.value==='ERROR')expression='';expression+=key;refresh(expression);}));display.addEventListener('input',()=>{expression=display.value.replace(/[^0-9+\-*/().\s]/g,'');});display.addEventListener('keydown',e=>{if(e.key==='Enter')calculate();});};

  // Map search is intentionally NOT implemented here. The canonical map authority owns:
  // manual search, Command Center navigation, and voice navigation.
  const boot=()=>{injectCss();ensureEngineeringNavigation();ensureHomeEngineeringCards();ensureMobileMore();setupCalculator();};
  new MutationObserver(()=>boot()).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',boot,{passive:true});window.setTimeout(boot,0);window.setTimeout(boot,500);window.setTimeout(boot,1500);
})();
