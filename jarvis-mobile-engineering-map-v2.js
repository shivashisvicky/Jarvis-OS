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
        /* The iOS nav must always keep the six primary modules visible. */
        #app .rail .nav[data-app="home"],
        #app .rail .nav[data-app="web"],
        #app .rail .nav[data-app="maps"],
        #app .rail .nav[data-app="media"],
        #app .rail .nav[data-app="calculator"],
        #app .rail .nav[data-app="snake"]{display:grid!important}
        #app .rail .nav[data-app="home"],
        #app .rail .nav[data-app="web"],
        #app .rail .nav[data-app="maps"],
        #app .rail .nav[data-app="media"],
        #app .rail .nav[data-app="calculator"],
        #app .rail .nav[data-app="snake"]{flex:1 1 0;width:auto;min-width:0}
        #app .rail .nav.jarvis-final-hidden,
        #app .rail .nav.jarvis-recovery-hidden,
        #app .rail .nav.mobile-overflow-hidden{display:none!important}
        #app .rail .nav[data-app="home"].jarvis-final-hidden,
        #app .rail .nav[data-app="web"].jarvis-final-hidden,
        #app .rail .nav[data-app="maps"].jarvis-final-hidden,
        #app .rail .nav[data-app="media"].jarvis-final-hidden,
        #app .rail .nav[data-app="calculator"].jarvis-final-hidden,
        #app .rail .nav[data-app="snake"].jarvis-final-hidden{display:grid!important}
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
    if (!mobile()) {
      document.querySelector('.jarvis-v2-more')?.remove();
      document.querySelector('.jarvis-v2-drawer')?.remove();
      return;
    }
    const more = document.querySelector('.jarvis-v2-more') || document.body.appendChild(Object.assign(document.createElement('button'),{className:'jarvis-v2-more',textContent:'MORE',type:'button'}));
    let drawer = document.querySelector('.jarvis-v2-drawer');
    if (!drawer) { drawer=document.createElement('div'); drawer.className='jarvis-v2-drawer'; document.body.appendChild(drawer); }
    drawer.innerHTML = '';
    [[api,'⇄','API LAB'],[sftp,'↔','SFTP']].forEach(([nav,icon,label]) => {
      const b=document.createElement('button'); b.type='button'; b.innerHTML=`<b>${icon}</b><span>${label}</span>`;
      b.onclick=()=>{ nav.click(); drawer.classList.remove('open'); };
      drawer.appendChild(b);
    });
    more.onclick=()=>drawer.classList.toggle('open');
  };

  const normalizeQueries = raw => {
    const q=raw.trim(); if(!q) return [];
    const out=[q];
    if (/ggp\s*colony/i.test(q)) out.push('G.G.P. Colony, Rasulgarh, Bhubaneswar, Odisha, India','GGP Colony, Rasulgarh, Bhubaneswar, Odisha, India');
    if (!/bhubaneswar|odisha|india/i.test(q)) out.push(`${q}, Bhubaneswar, Odisha, India`);
    return [...new Set(out)];
  };

  const setupMaps = () => {
    const input=document.querySelector('#mapQuery'), button=document.querySelector('#mapSearch'), results=document.querySelector('#mapResults'), frame=document.querySelector('#mapFrame');
    if (!(input instanceof HTMLInputElement) || !(button instanceof HTMLButtonElement) || !results || !frame || button.dataset.mobileMapV2) return;
    const replacement=button.cloneNode(true); button.replaceWith(replacement); const searchButton=replacement;
    searchButton.dataset.mobileMapV2='1';
    let status=results.querySelector('.jarvis-v2-map-status');
    if(!status){status=document.createElement('div');status.className='jarvis-v2-map-status';status.style.cssText='margin:7px 2px;color:var(--muted,#78939c);font-size:11px';results.prepend(status);}
    const showMap=(lat,lon)=>{const d=.018,bbox=`${lon-d},${lat-d},${lon+d},${lat+d}`;frame.innerHTML=`<iframe title="OpenStreetMap result" loading="lazy" style="border:0;width:100%;height:100%;min-height:280px" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lon}`)}"></iframe>`;};
    const nominatim=async q=>{const u=new URL('https://nominatim.openstreetmap.org/search');u.searchParams.set('format','jsonv2');u.searchParams.set('q',q);u.searchParams.set('limit','8');u.searchParams.set('addressdetails','1');u.searchParams.set('accept-language','en');const r=await fetch(u,{cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`Nominatim ${r.status}`);return await r.json();};
    const photon=async q=>{const u=new URL('https://photon.komoot.io/api/');u.searchParams.set('q',q);u.searchParams.set('limit','8');const r=await fetch(u,{cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`Photon ${r.status}`);const d=await r.json();return (d.features||[]).map(f=>({name:f?.properties?.name||f?.properties?.city||'Location',display_name:[f?.properties?.name,f?.properties?.street,f?.properties?.district,f?.properties?.city,f?.properties?.state,f?.properties?.country].filter(Boolean).join(', '),lat:f?.geometry?.coordinates?.[1],lon:f?.geometry?.coordinates?.[0]}));};
    const search=async()=>{const qs=normalizeQueries(input.value);if(!qs.length){status.textContent='ENTER A PLACE TO SEARCH';return;}status.textContent='SEARCHING GLOBAL MAPS…';results.querySelectorAll('.jarvis-v2-map-result').forEach(x=>x.remove());frame.innerHTML='<div class="empty">Searching map services…</div>';let data=[];for(const q of qs){try{data=await nominatim(q);if(Array.isArray(data)&&data.length)break;}catch{}}if(!data.length){for(const q of qs){try{data=await photon(q);if(Array.isArray(data)&&data.length)break;}catch{}}}data=(Array.isArray(data)?data:[]).filter(p=>Number.isFinite(Number(p?.lat))&&Number.isFinite(Number(p?.lon)));if(!data.length){status.textContent='NO MATCHES FOUND';frame.innerHTML='<div class="empty">No map match found. Try a fuller place name or PIN code.</div>';return;}status.textContent=`${data.length} LOCATION${data.length===1?'':'S'} FOUND`;data.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='jarvis-v2-map-result';b.style.cssText='display:block;width:100%;box-sizing:border-box;text-align:left;padding:11px 13px;margin:6px 0;border:1px solid var(--line,#17303a);border-radius:10px;background:rgba(5,16,22,.78);color:var(--text,#dffaff);font:inherit;cursor:pointer';b.innerHTML=`<b>${i+1}. ${String(p.name||p.display_name?.split(',')[0]||'Location')}</b><small style="display:block;margin-top:4px;color:var(--muted,#78939c);font-size:10px;line-height:1.35">${String(p.display_name||'')}</small>`;b.onclick=()=>showMap(Number(p.lat),Number(p.lon));results.appendChild(b);if(i===0)showMap(Number(p.lat),Number(p.lon));});};
    searchButton.addEventListener('click',search);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
  };

  const arbitration=()=>{css();const rail=document.querySelector('.rail');if(!rail)return;const navs=[...rail.querySelectorAll('.nav[data-app]')];navs.forEach(n=>{if(preferred.includes(n.dataset.app||'')){n.classList.remove('jarvis-final-hidden','jarvis-recovery-hidden','mobile-overflow-hidden');}else if(mobile()){n.classList.add('jarvis-v2-engineering-hidden');}});setupMore();setupMaps();};
  new MutationObserver(()=>requestAnimationFrame(arbitration)).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',()=>requestAnimationFrame(arbitration),{passive:true});
  arbitration();
})();
