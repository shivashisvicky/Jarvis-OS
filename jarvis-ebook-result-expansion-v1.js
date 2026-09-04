(()=>{
  'use strict';
  if(window.__JARVIS_EBOOK_RESULT_EXPANSION_V1__)return;
  window.__JARVIS_EBOOK_RESULT_EXPANSION_V1__=true;
  const baseFetch=window.fetch.bind(window);
  const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
  const norm=s=>clean(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const isSearch=url=>{try{const u=new URL(url,location.href);return u.hostname==='gutendex.com'&&u.pathname==='/books/'&&u.searchParams.has('search')}catch{return false}};
  const extra=async(query,seed)=>{
    const tokens=norm(query).split(' ').filter(Boolean);
    const urls=[];
    if(tokens.length===1)urls.push(`https://gutendex.com/books/?topic=${encodeURIComponent(tokens[0])}&languages=en&page=1`);
    for(const t of tokens)if(t.length>=4)urls.push(`https://gutendex.com/books/?search=${encodeURIComponent(t)}&languages=en&page=1`);
    const map=new Map((seed||[]).filter(b=>b?.id).map(b=>[String(b.id),b]));
    for(const url of urls){try{const r=await baseFetch(url,{cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)continue;const d=await r.json();for(const b of(d.results||[]))if(b?.id)map.set(String(b.id),b)}catch{}}
    try{console.info('[JARVIS:GUTENBERG_EXPANSION] expanded',{query,count:map.size,urls:urls.length})}catch{}
    return [...map.values()];
  };
  window.fetch=async(input,init={})=>{
    const url=typeof input==='string'?input:input?.url||'';
    if(!isSearch(url))return baseFetch(input,init);
    const r=await baseFetch(input,init);
    try{
      const d=await r.clone().json();
      if(!d||!Array.isArray(d.results)||d.results.length>=8)return r;
      const q=clean(new URL(url,location.href).searchParams.get('search')||'');
      if(!q)return r;
      const merged=await extra(q,d.results);
      if(merged.length<=d.results.length)return r;
      return new Response(JSON.stringify({...d,results:merged,count:Math.max(Number(d.count)||0,merged.length)}),{status:r.status,statusText:r.statusText,headers:{'content-type':'application/json'}});
    }catch{return r}
  };
  try{for(const k of Object.keys(sessionStorage))if(k.startsWith('jarvis:gutenberg:warm:v2:'))sessionStorage.removeItem(k)}catch{}
})();
