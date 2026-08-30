(()=>{'use strict';
if(window.__JARVIS_ENTITY_PERSON_DISAMBIGUATION_V1__)return;
window.__JARVIS_ENTITY_PERSON_DISAMBIGUATION_V1__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const personish=/\b(?:person|human|writer|author|poet|novelist|historian|politician|actor|scientist|composer|musician)\b/i;
const explicitBook=/\b(?:book|books|ebook|ebooks|novel|novels|gutenberg|standard\s+ebooks?)\b/i;
const resolve=async q=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),4500);try{const u=new URL('https://www.wikidata.org/w/api.php');u.searchParams.set('action','wbsearchentities');u.searchParams.set('search',q);u.searchParams.set('language','en');u.searchParams.set('uselang','en');u.searchParams.set('type','item');u.searchParams.set('limit','5');u.searchParams.set('format','json');u.searchParams.set('origin','*');const r=await fetch(u,{signal:c.signal,cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)return null;const d=await r.json();const hit=(d.search||[]).find(x=>String(x.label||'').toLowerCase()===q.toLowerCase())||(d.search||[])[0];if(!hit)return null;const description=String(hit.description||'');return personish.test(description)?{name:q,type:'PERSON',score:.93,source:'wikidata',description}:null}catch{return null}finally{clearTimeout(t)}};
window.addEventListener('jarvis:entity-resolved',e=>{const d=e.detail||{};const raw=clean(d.text);const entity=d.entity||{};if(!raw||d.entityPersonDisambiguated||entity.type!=='BOOK'||explicitBook.test(raw)||raw.split(/\s+/).length<2||raw.length>100)return;void resolve(raw).then(person=>{if(!person)return;window.__JARVIS_ENTITY__=person;window.dispatchEvent(new CustomEvent('jarvis:entity-resolved',{detail:{...d,entity:person,entityPersonDisambiguated:true}}))})},true);
})();
