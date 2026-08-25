(()=>{
'use strict';
if(window.__JARVIS_TASK_CONTEXT_GUARD_V1__)return;
window.__JARVIS_TASK_CONTEXT_GUARD_V1__=true;
const KEY='jarvis-session-context-v2';
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const textFor=(domain,d={})=>{
 if(domain==='MAPS'){
  const location=clean(typeof d.place==='string'?d.place:(d.location?.name||d.location||d.query||''));
  return location?`Current task: MAPS. Active location: ${location}. Use this location for relevant follow-up requests unless the user explicitly changes it.`:'Current task: MAPS. Use the active map context for relevant follow-up requests.';
 }
 if(domain==='BOOKS'){
  const query=clean(d.query||d.entity?.name||d.entity||'');
  return query?`Current task: BOOKS. Active book query/entity: ${query}. Use this for relevant follow-up requests unless the user explicitly changes topic.`:'Current task: BOOKS. Use the active book context for relevant follow-up requests.';
 }
 if(domain==='SEARCH'){
  const query=clean(d.query||'');
  return query?`Current task: WEB SEARCH. Active query: ${query}.`:'Current task: WEB SEARCH.';
 }
 if(domain==='MEDIA'){
  const query=clean(d.query||'');
  return query?`Current task: MEDIA. Active query: ${query}.`:'Current task: MEDIA.';
 }
 return '';
};
const switchTask=(domain,d={})=>{
 const text=textFor(domain,d);if(!text)return;
 try{sessionStorage.setItem(KEY,JSON.stringify([{role:'assistant',text,at:Date.now()}]))}catch{}
};
window.addEventListener('jarvis:map-intent',e=>switchTask('MAPS',e.detail||{}),true);
window.addEventListener('jarvis:ebook-context',e=>switchTask('BOOKS',e.detail||{}),true);
window.addEventListener('jarvis:search-context',e=>switchTask('SEARCH',e.detail||{}),true);
window.addEventListener('jarvis:media-search',e=>switchTask('MEDIA',e.detail||{}),true);
})();
