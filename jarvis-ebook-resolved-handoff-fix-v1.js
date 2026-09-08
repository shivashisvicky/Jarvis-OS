(()=>{
'use strict';
if(window.__JARVIS_EBOOK_RESOLVED_HANDOFF_FIX_V4__)return;
window.__JARVIS_EBOOK_RESOLVED_HANDOFF_FIX_V4__=true;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const norm=s=>clean(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const tokens=s=>norm(s).split(' ').filter(Boolean);
const displayable=b=>{
  if(!b)return false;
  const m=String(b.media_type||'').toLowerCase();
  const keys=Object.keys(b.formats||{});
  return(!m||m==='text')&&keys.some(k=>/^text\/(plain|html)/i.test(k))&&!/\b(?:audiobook|audio book)\b/i.test(String(b.title||''));
};
const sameAuthor=(b,q)=>{
  const wanted=tokens(q);
  if(!wanted.length)return false;
  const list=Array.isArray(b?.authors)?b.authors.map(x=>clean(x?.name)).filter(Boolean):[];
  return list.some(name=>{
    const got=tokens(name);
    return got.length===wanted.length&&wanted.every(w=>got.includes(w))&&got.every(w=>wanted.includes(w));
  });
};
const looksLikeAuthorEvidence=(base,q)=>base.length>0&&base.some(b=>sameAuthor(b,q));
const boot=()=>{
  const a=window.jarvisEbookSearchAuthority;
  if(!a||typeof a.searchResolved!=='function'||typeof a.search!=='function')return false;
  const original=a.searchResolved;
  if(original.__jarvisResolvedHandoffRoutingV5)return true;
  const searchResolved=async(raw,resolved)=>{
    const q=clean(raw),base=Array.isArray(resolved)?resolved.filter(displayable):[];
    try{
      const authorEvidence=looksLikeAuthorEvidence(base,q);
      console.info('[JARVIS:GUTENBERG_TRACE] RESOLVED_HANDOFF_ROUTING',{query:q,resolvedCount:base.length,mode:authorEvidence?'author':'catalogue'});
      if(authorEvidence&&typeof a.searchAuthor==='function'){
        const count=await a.searchAuthor(q);
        if(count>0){
          window.dispatchEvent(new CustomEvent('jarvis:ebook-resolved-handoff',{detail:{query:q,resolvedCount:base.length,mode:'author',catalogueCount:count,at:Date.now()}}));
          return true;
        }
      }else{
        const count=await a.search(q);
        if(count>0){
          window.dispatchEvent(new CustomEvent('jarvis:ebook-resolved-handoff',{detail:{query:q,resolvedCount:base.length,mode:'catalogue',catalogueCount:count,at:Date.now()}}));
          return true;
        }
      }
    }catch(e){
      console.info('[JARVIS:GUTENBERG_TRACE] RESOLVED_HANDOFF_ROUTING_ERROR',String(e));
    }
    if(base.length){
      console.info('[JARVIS:GUTENBERG_TRACE] RESOLVED_HANDOFF_FALLBACK',{query:q,resolvedCount:base.length});
      return original(raw,base);
    }
    return false;
  };
  searchResolved.__jarvisResolvedHandoffRoutingV5=true;
  a.searchResolved=searchResolved;
  a.__jarvisResolvedHandoffFixedV5=true;
  return true;
};
if(boot())return;
let n=0;
const t=setInterval(()=>{if(boot()||++n>100)clearInterval(t)},50);
})();