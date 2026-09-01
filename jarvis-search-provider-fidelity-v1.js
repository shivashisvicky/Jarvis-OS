(()=>{'use strict';
if(window.__JARVIS_SEARCH_PROVIDER_FIDELITY_V3__)return;
window.__JARVIS_SEARCH_PROVIDER_FIDELITY_V3__=true;
window.__JARVIS_SEARCH_PROVIDER_FIDELITY_V2__=true;
window.__JARVIS_SEARCH_PROVIDER_FIDELITY_V1__=true;
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const termsFor=v=>clean(v).toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(t=>t.length>1);
const query=()=>clean(document.querySelector('#webQuery')?.value||'');
const cardMatches=(card,terms)=>{const hay=clean(card.textContent).toLowerCase();return terms.every(t=>hay.includes(t));};
const fallbackActive=()=>/BING\s+FALLBACK/i.test(document.querySelector('#jwsStatus')?.textContent||'');
const filterFallbackCards=()=>{
 const terms=termsFor(query()); if(!terms.length||!fallbackActive())return true;
 const cards=[...document.querySelectorAll('#jwsResults .web-result')]; if(!cards.length)return true;
 const good=cards.filter(c=>cardMatches(c,terms));
 if(good.length===cards.length)return true;
 if(!good.length)return false;
 cards.forEach(c=>{if(!cardMatches(c,terms))c.remove()});
 const status=document.querySelector('#jwsStatus'); if(status)status.textContent=`${good.length} RESULTS · BING FALLBACK`;
 return true;
};
const publishContext=()=>{
 const q=query(); const cards=[...document.querySelectorAll('#jwsResults .web-result')];
 if(!q||!cards.length)return false;
 const results=cards.map((card,index)=>{const a=card.querySelector('a[href]');return {index,title:clean(card.querySelector('strong')?.textContent||card.textContent||`Result ${index+1}`),link:String(a?.getAttribute('href')||'').trim(),source:clean(card.querySelector('small')?.textContent||'WEB')}}).filter(x=>x.title&&x.link);
 if(!results.length)return false;
 const snapshot={domain:'SEARCH',query:q,provider:'web',results,selected:null,updatedAt:Date.now()};
 window.__JARVIS_SEARCH_CONTEXT__=snapshot;
 try{sessionStorage.setItem('jarvis-search-context-v3',JSON.stringify(snapshot))}catch{}
 window.dispatchEvent(new CustomEvent('jarvis:search-context',{detail:snapshot}));
 window.jarvisContextEngine?.set?.({domain:'SEARCH',query:q,results,selected:null},'merge');
 return true;
};
const sync=()=>{const provider=document.querySelector('#webProvider')?.value==='brave'?'BRAVE':'BING';const status=document.querySelector('#jwsStatus');if(status&&/RESULTS\s·/i.test(status.textContent||'')&&!/BING\s+FALLBACK/i.test(status.textContent||''))status.textContent=status.textContent.replace(/RESULTS\s·\s*\w+(?:\s+FALLBACK)?/i,`RESULTS · ${provider}`);document.querySelectorAll('#jwsResults .web-result small').forEach(n=>{const t=n.textContent||'';if(t&&t!=='WEB'&&!t.startsWith(provider)){const d=t.indexOf(' · ');n.textContent=provider+(d>=0?t.slice(d):'')}});publishContext()};
let timer=0;const observe=()=>{clearTimeout(timer);timer=setTimeout(()=>{filterFallbackCards();sync()},80)};
new MutationObserver(observe).observe(document.body,{subtree:true,childList:true,characterData:true});
document.addEventListener('change',e=>{if(e.target?.id==='webProvider')sync()},true);
document.addEventListener('click',e=>{if(e.target?.closest?.('#webSearch'))window.setTimeout(()=>{filterFallbackCards();sync()},180)},true);
})();