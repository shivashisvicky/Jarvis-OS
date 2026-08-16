(() => {
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const log=(feature,message,data={})=>window.jarvisLog?.(feature,message,data);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const fetchJ=async(url,ms=4500)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,cache:'no-store'});if(!r.ok)throw new Error(String(r.status));return await r.json()}finally{clearTimeout(t)}};

  async function search(q,target){
    q=String(q||'').trim();if(!q)return;target=target||$('#jarvisReply')||$('#jlfCentralResult')||$('.search-workspace');if(!target)return;
    target.innerHTML='<p>JARVIS CENTRAL SEARCH · RESOLVING…</p>';log('search','transaction',{query:q});
    try{const d=await fetchJ(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&no_redirect=1&skip_disambig=1`);if(d.AbstractText||d.Answer||d.Definition){target.innerHTML=`<h3>${esc(q)}</h3><p>${esc(d.AbstractText||d.Answer||d.Definition)}</p><small>JARVIS knowledge layer</small><div class="jlf-actions"><button type="button" id="jlfSearchInternet">SEARCH INTERNET</button></div>`;return}}catch(e){log('search','knowledge provider failed',{error:String(e)})}
    try{const d=await fetchJ(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*&srlimit=6`);const hits=d?.query?.search||[];if(hits.length){target.innerHTML=`<h3>JARVIS RESULTS</h3><div class="jlf-results">${hits.map(x=>`<a class="jlf-result" href="https://en.wikipedia.org/wiki/${encodeURIComponent(String(x.title).replace(/ /g,'_'))}" target="_blank" rel="noopener noreferrer"><strong>${esc(x.title)}</strong><p>${esc(String(x.snippet||'').replace(/<[^>]+>/g,' '))}</p></a>`).join('')}</div><div class="jlf-actions"><button type="button" id="jlfSearchInternet">SEARCH INTERNET</button></div>`;return}}catch(e){log('search','index provider failed',{error:String(e)})}
    target.innerHTML=`<h3>NO INTERNAL RESULT</h3><p>JARVIS found no internal result. Nothing was redirected.</p><div class="jlf-actions"><button type="button" id="jlfSearchInternet">SEARCH INTERNET</button></div>`;
  }

  async function media(q){
    q=String(q||'').trim();if(!q)return;const r=$('#videoResults'),s=$('#jvcStatus')||$('#mediaState');if(!r)return;r.innerHTML='<div class="empty">JARVIS VIDEO CORE · SEARCHING…</div>';if(s)s.textContent='SEARCHING · JARVIS VIDEO INDEX';log('media','transaction',{query:q});
    const providers=['https://pipedapi.kavin.rocks','https://pipedapi.tokhmi.xyz','https://pipedapi.moomoo.me','https://pipedapi.syncpundit.io','https://api-piped.mha.fi'];
    const out=[];const seen=new Set();
    const one=async base=>{try{const d=await fetchJ(`${base}/search?q=${encodeURIComponent(q)}&filter=videos&region=IN`,3500);const arr=Array.isArray(d)?d:d?.items||[];for(const v of arr){const id=String(v?.videoId||v?.id||'').match(/^[A-Za-z0-9_-]{11}$/)?.[0];if(id&&!seen.has(id)){seen.add(id);out.push({id,title:v.title||'Untitled video',author:v.author||v.uploader||'YouTube',thumb:v.videoThumbnails?.[0]?.url||`https://i.ytimg.com/vi/${id}/hqdefault.jpg`})}}}catch(e){log('media','provider failed',{base,error:String(e)})}};
    await Promise.all(providers.map(one));
    if(!out.length){r.innerHTML='<div class="jlf-fallback">No public video index responded with results. JARVIS will not redirect you.</div>';if(s)s.textContent='VIDEO INDEX DEGRADED · NO REDIRECT';return}
    r.innerHTML=out.slice(0,10).map(v=>`<button type="button" class="jvc-card" data-tx-video="${v.id}"><strong>${esc(v.title)}</strong><small>${esc(v.author)}</small></button>`).join('');if(s)s.textContent=`${Math.min(out.length,10)} RESULTS · STAYING INSIDE JARVIS`;
  }
  function play(id){const p=$('#jarvisPlayer'),s=$('#jvcStatus')||$('#mediaState');if(!p)return;p.innerHTML=`<iframe title="JARVIS video" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;if(s)s.textContent='PLAYING · JARVIS EMBED';log('media','player mounted',{id})}
  function map(q){q=String(q||'').trim();const res=$('#mapResults'),frame=$('#mapFrame');if(!res||!frame)return;const a=[[/maa\s+enclave/i,'Maa Enclave','Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',20.2923,85.8638],[/jagannath\s+nagar/i,'Jagannath Nagar','Jharapada, Bhubaneswar, Odisha 751010',20.2923,85.8638],[/ggp\s+colony/i,'GGP Colony','Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',20.2934,85.8659],[/jharapada|jharpada/i,'Jharapada','Bhubaneswar, Odisha',20.291,85.868]];const x=a.find(v=>v[0].test(q));if(x){res.innerHTML=`<div class="jlf-result"><strong>${x[1]}</strong><p>${x[2]}</p></div>`;frame.innerHTML=`<div class="jlf-map"><iframe title="${x[1]} map" src="https://www.openstreetmap.org/export/embed.html?bbox=${x[4]-.018},${x[3]-.014},${x[4]+.018},${x[3]+.014}&layer=mapnik&marker=${x[3]},${x[4]}"></iframe></div>`;log('maps','alias resolved',{query:q,name:x[1]});return}res.innerHTML='<div class="empty">SEARCHING OPENSTREETMAP…</div>'}

  window.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof Element)||!f.matches('#commandForm'))return;e.preventDefault();e.stopImmediatePropagation();search($('#commandInput')?.value,$('#jarvisReply'))},true);
  window.addEventListener('keydown',e=>{const t=e.target;if(!(t instanceof HTMLInputElement)||e.key!=='Enter')return;if(t.id==='webQuery'){e.preventDefault();e.stopImmediatePropagation();search(t.value)}else if(t.id==='mapQuery'){e.preventDefault();e.stopImmediatePropagation();map(t.value)}else if(t.id==='videoQuery'){e.preventDefault();e.stopImmediatePropagation();media(t.value)}},true);
  window.addEventListener('click',e=>{const t=e.target instanceof Element?e.target:null;if(!t)return;
    const id=t.closest('#webSearch');if(id){e.preventDefault();e.stopImmediatePropagation();search($('#webQuery')?.value,$('#jv3SearchAnswer')||$('#jlfCentralResult'));return}
    const mb=t.closest('#mapSearch');if(mb){e.preventDefault();e.stopImmediatePropagation();map($('#mapQuery')?.value);return}
    const vb=t.closest('#videoSearch');if(vb){e.preventDefault();e.stopImmediatePropagation();media($('#videoQuery')?.value);return}
    const card=t.closest('[data-tx-video]');if(card){e.preventDefault();e.stopImmediatePropagation();play(card.dataset.txVideo);return}
    const mission=t.closest('.jmc-action');if(mission){e.preventDefault();e.stopImmediatePropagation();const intent=mission.dataset.jv3Intent;if(intent==='media'){document.querySelector('button.nav[data-app="media"]')?.click();setTimeout(()=>{const i=$('#videoQuery');if(i){i.value='trending videos India';media(i.value)}},300)}else if(intent==='research'){document.querySelector('button.nav[data-app="web"]')?.click()}else if(intent==='api'){document.querySelector('button.nav[data-app="api"]')?.click()}return}
  },true);
})();
