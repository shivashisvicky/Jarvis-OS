(()=>{
'use strict';
if(window.__JARVIS_EBOOK_TEXT_TRANSPORT_V3__)return;
window.__JARVIS_EBOOK_TEXT_TRANSPORT_V3__=true;
const base=window.fetch.bind(window);
const isTextSource=url=>{try{const u=new URL(url,location.href);return u.hostname==='www.gutenberg.org'&&(/^\/cache\/epub\/\d+\/pg\d+\.txt(?:\.utf8)?$/i.test(u.pathname)||/^\/files\/\d+\/[^/]+\.txt$/i.test(u.pathname))}catch{return false}};
const proxy=url=>{try{const u=new URL(url,location.href);return `https://r.jina.ai/http://www.gutenberg.org${u.pathname}${u.search||''}`}catch{return url}};
const inflight=new Map();
const sharedFetch=async(url,init={})=>{
 const key=new URL(url,location.href).href;
 if(inflight.has(key))return (await inflight.get(key)).clone();
 const p=(async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),11000);
  const sharedInit={...init,signal:controller.signal,cache:'no-store',redirect:'follow',headers:{...(init.headers||{}),Accept:'text/plain,text/html;q=.9,*/*;q=.1'}};
  delete sharedInit.keepalive;
  try{
   const purl=proxy(key);
   if(purl){try{const r=await base(purl,sharedInit);if(r.ok)return r}catch{}}
   return await base(key,sharedInit);
  }finally{clearTimeout(timer)}
 })();
 inflight.set(key,p);
 try{return (await p).clone()}finally{inflight.delete(key)}
};
window.fetch=async(input,init={})=>{const url=typeof input==='string'?input:input?.url||'';if(!isTextSource(url))return base(input,init);return sharedFetch(url,init)};
console.info('[JARVIS:EBOOK_TEXT_TRANSPORT] v3 shared-source acquisition active');
})();
