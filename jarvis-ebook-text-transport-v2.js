(()=>{
'use strict';
if(window.__JARVIS_EBOOK_TEXT_TRANSPORT_V2__)return;
window.__JARVIS_EBOOK_TEXT_TRANSPORT_V2__=true;
const base=window.fetch.bind(window);
const isTextSource=url=>{try{const u=new URL(url,location.href);return u.hostname==='www.gutenberg.org'&&(/^\/cache\/epub\/\d+\/pg\d+\.txt(?:\.utf8)?$/i.test(u.pathname)||/^\/files\/\d+\/[^/]+\.txt$/i.test(u.pathname))}catch{return false}};
const proxy=url=>{try{const u=new URL(url,location.href);return `https://r.jina.ai/http://www.gutenberg.org${u.pathname}${u.search||''}`}catch{return url}};
window.fetch=async(input,init={})=>{const url=typeof input==='string'?input:input?.url||'';if(!isTextSource(url))return base(input,init);const p=proxy(url);try{const r=await base(p,{...init,cache:'no-store',redirect:'follow',headers:{...(init.headers||{}),Accept:'text/plain,text/html;q=.9,*/*;q=.1'}});if(r.ok)return r}catch{}return base(input,init)};
console.info('[JARVIS:EBOOK_TEXT_TRANSPORT] v2 active');
})();