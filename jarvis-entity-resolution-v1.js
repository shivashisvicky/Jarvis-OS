(()=>{
'use strict';
if(window.__JARVIS_ENTITY_RESOLUTION_V1__)return;
window.__JARVIS_ENTITY_RESOLUTION_V1__=true;

const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const lower=s=>normalize(s).toLowerCase().replace(/[.!?]+$/,'').trim();
const LOOKUP=/^(?:find|search for|look up|show me|open|read)\s+(?:the\s+)?(.+)$/i;
const EXPLICIT_DOMAIN=/\b(?:ebook|ebooks|book|books|novel|novels|gutenberg|standard ebooks|youtube|maps?|restaurants?|hospitals?|hotels?|weather|games?)\b/i;
const EXPLICIT_WEB=/^(?:search|look\s*up|lookup|google|bing|web\s+search)\b/i;
const CACHE='jarvis:entity-resolution:v1:';
const TTL=30*60*1000;

const cleanEntity=s=>normalize(String(s||'').replace(/^(?:the)\s+/i,''));
const cached=q=>{try{const x=JSON.parse(sessionStorage.getItem(CACHE+q.toLowerCase())||'');if(x&&Date.now()-x.at<TTL)return x.result}catch{}return null};
const store=(q,result)=>{try{sessionStorage.setItem(CACHE+q.toLowerCase(),JSON.stringify({at:Date.now(),result}))}catch{}};

const fetchJson=async(url,ms=3500)=>{const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json()}finally{clearTimeout(t)}};

const gutenberg=async entity=>{
 try{
  const url=`https://gutendex.com/books/?search=${encodeURIComponent(entity)}&languages=en`;
  const data=await fetchJson(url,3500);const results=Array.isArray(data?.results)?data.results:[];
  const q=entity.toLowerCase();
  const exact=results.filter(b=>String(b.title||'').toLowerCase().trim()===q);
  const authorExact=results.filter(b=>(b.authors||[]).some(a=>String(a.name||'').toLowerCase().trim()===q));
  if(exact.length||authorExact.length)return {type:'BOOK',score:0.99,source:'gutenberg',entity,results:exact.length?exact:authorExact};
  const partial=results.filter(b=>String(b.title||'').toLowerCase().includes(q)||(b.authors||[]).some(a=>String(a.name||'').toLowerCase().includes(q)));
  if(partial.length)return {type:'BOOK_CANDIDATE',score:0.76,source:'gutenberg',entity,results:partial.slice(0,10)};
 }catch{}
 return null;
};

const wikidata=async entity=>{
 try{
  const url=`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(entity)}&language=en&uselang=en&type=item&limit=6&format=json&origin=*`;
  const data=await fetchJson(url,3500);const hits=Array.isArray(data?.search)?data.search:[];
  const exact=hits.find(h=>String(h.label||'').toLowerCase()===entity.toLowerCase())||hits[0];
  if(!exact)return null;
  const desc=String(exact.description||'').toLowerCase();
  let type='UNKNOWN',score=.45;
  if(/epic poem|poem|novel|book|literary work|work of literature|written work|publication/.test(desc)){type='BOOK';score=.9}
  else if(/person|human|politician|writer|author|actor|scientist|musician/.test(desc)){type='PERSON';score=.86}
  else if(/city|town|village|place|country|state|district|river|mountain|temple/.test(desc)){type='PLACE';score=.86}
  else if(/company|business|organization|corporation|brand/.test(desc)){type='COMPANY';score=.86}
  else if(/film|movie|television series|tv series/.test(desc)){type='MEDIA';score=.84}
  else if(/song|single|album|musical work/.test(desc)){type='MUSIC';score=.84}
  return {type,score,source:'wikidata',entity,label:exact.label,description:exact.description||''};
 }catch{return null}
};

const resolve=async entity=>{
 const key=cleanEntity(entity);if(!key)return {type:'UNKNOWN',score:0,entity:key};
 const hit=cached(key);if(hit)return hit;
 const [book,knowledge]=await Promise.all([gutenberg(key),wikidata(key)]);
 let result=knowledge||book||{type:'UNKNOWN',score:.1,source:'none',entity:key};
 // A strong public-domain title/author match wins over a generic knowledge hit.
 if(book?.type==='BOOK'&&book.score>=(knowledge?.score||0))result=book;
 else if(book?.type==='BOOK_CANDIDATE'&&(!knowledge||knowledge.type==='UNKNOWN'))result=book;
 store(key,result);return result;
};

const shouldResolve=raw=>{
 const q=lower(raw);if(!q||EXPLICIT_WEB.test(q)||EXPLICIT_DOMAIN.test(q))return null;
 const m=q.match(LOOKUP);if(!m)return null;
 const entity=cleanEntity(m[1]);if(!entity||entity.length<2||entity.length>100)return null;
 return {entity,verb:q.split(/\s+/)[0]};
};

const dispatchResolved=(raw,res)=>{
 const detail={text:raw,resolved:true,entity:{name:res.entity,type:res.type,score:res.score,source:res.source,description:res.description||'',results:res.results||[]}};
 window.__JARVIS_ENTITY__=detail.entity;
 window.dispatchEvent(new CustomEvent('jarvis:entity-resolved',{detail}));
 window.dispatchEvent(new CustomEvent('jarvis:voice-command',{detail}));
};

const intercept=e=>{
 const raw=normalize(e.detail?.text);if(!raw||e.detail?.resolved)return;
 const target=shouldResolve(raw);if(!target)return;
 e.preventDefault?.();e.stopImmediatePropagation?.();
 resolve(target.entity).then(res=>dispatchResolved(raw,res));
};

window.addEventListener('jarvis:voice-command',intercept,true);
document.addEventListener('submit',e=>{
 const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;
 const input=f.querySelector('#commandInput');const raw=input instanceof HTMLInputElement?normalize(input.value):'';const target=shouldResolve(raw);if(!target)return;
 e.preventDefault();e.stopImmediatePropagation();
 resolve(target.entity).then(res=>{if(input instanceof HTMLInputElement)input.value='';dispatchResolved(raw,res)});
},true);

window.jarvisEntityResolution=Object.freeze({version:'1.0.0',resolve, get:()=>window.__JARVIS_ENTITY__||null});
})();
