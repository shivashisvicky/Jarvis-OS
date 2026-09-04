(()=>{'use strict';
if(window.__JARVIS_EBOOK_SOURCE_FALLBACK_V1__)return;window.__JARVIS_EBOOK_SOURCE_FALLBACK_V1__=true;
const J='https://r.jina.ai/';
const audio=/\.(?:mp3|ogg|m4b|spx|wav|flac|aac)(?:$|[?#])/i;
const pg=/gutenberg\.org\/(?:cache\/epub|files)\//i;
const bad404=t=>{const s=String(t||'').toLowerCase();return s.includes('target url returned error 404')||s.includes('## error 404')||s.includes('our website does not have the page you requested')||s.includes('error 404: not found')};
const idFrom=u=>{const s=String(u||'').replace(/^https?:\/\/r\.jina\.ai\//i,'');const m=s.match(/gutenberg\.org\/(?:cache\/epub|files)\/(\d+)\//i);return m?.[1]||''};
const candidates=u=>{const id=idFrom(u);if(!id)return[];const direct=[`https://www.gutenberg.org/cache/epub/${id}/pg${id}-images.html`,`https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,`https://www.gutenberg.org/files/${id}/${id}-h/${id}-h.htm`].filter(x=>!audio.test(x));return [...direct,...direct.map(x=>`${J}http://${x.replace(/^https?:\/\//,'')}`)];};
const usable=async r=>{if(!r||!r.ok)return false;try{const t=await r.clone().text();return t.trim().length>200&&!bad404(t)}catch{return false}};
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){const original=typeof input==='string'?input:(input?.url||'');if(!pg.test(original)&&!/^https?:\/\/r\.jina\.ai\/https?:\/\/www\.gutenberg\.org\//i.test(original))return nativeFetch(input,init);let first=null;try{first=await nativeFetch(input,init);if(await usable(first))return first;}catch(e){first=null;}
for(const u of candidates(original)){try{console.info('[JARVIS:GUTENBERG_TRACE] SOURCE_FALLBACK_TRY',{from:original,to:u});const r=await nativeFetch(u,{...init,cache:'no-store',headers:{...(init?.headers||{}),Accept:'text/plain,text/html;q=.9,*/*;q=.1'}});if(await usable(r)){console.info('[JARVIS:GUTENBERG_TRACE] SOURCE_FALLBACK_OK',{url:u});return r;}}catch(e){console.info('[JARVIS:GUTENBERG_TRACE] SOURCE_FALLBACK_FAIL',{url:u,error:String(e?.message||e)})}}
return first||new Response('Gutenberg source unavailable',{status:404,statusText:'Not Found'});
};})();
