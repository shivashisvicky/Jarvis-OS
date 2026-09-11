(()=>{'use strict';
if(window.__JARVIS_EBOOK_NETWORK_FAST_V1__)return;
window.__JARVIS_EBOOK_NETWORK_FAST_V1__=true;
const G='https://www.gutenberg.org';
const cache=new Map(),inflight=new Map();
const normalizeId=id=>String(id||'').replace(/[^0-9]/g,'');
const candidates=id=>{const n=normalizeId(id);if(!n)return[];return[
 `${G}/cache/epub/${n}/pg${n}.txt`,
 `${G}/files/${n}/${n}-0.txt`,
 `https://r.jina.ai/http://www.gutenberg.org/cache/epub/${n}/pg${n}.txt`,
 `https://r.jina.ai/http://www.gutenberg.org/files/${n}/${n}-0.txt`,
 `${G}/cache/epub/${n}/pg${n}-images.html`,
 `https://r.jina.ai/http://www.gutenberg.org/cache/epub/${n}/pg${n}-images.html`
]};
const fetchBounded=async(url,ms=7000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{cache:'no-store',redirect:'follow',headers:{Accept:'text/plain,text/html;q=.9,*/*;q=.1'},signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);const text=await r.text();if(text.trim().length<200)throw Error('Empty ebook source');if(!/(?:<html|<body|<pre|\*\*\* START OF)/i.test(text)&&text.length<=500)throw Error('Invalid ebook source');return text}finally{clearTimeout(t)}};
const acquire=async id=>{const n=normalizeId(id);if(!n)throw Error('Missing Gutenberg book id');const hit=cache.get(n);if(hit&&Date.now()-hit.time<120000)return hit.text;if(inflight.has(n))return inflight.get(n);const promise=(async()=>{const urls=candidates(n);if(!urls.length)throw Error('Missing Gutenberg book id');let last=null;try{const text=await Promise.any(urls.map(u=>fetchBounded(u).catch(e=>{last=e;throw e})));cache.set(n,{text,time:Date.now()});console.info('[JARVIS ebook fast source] hit',n);return text}catch{throw Error(`No ebook source within fast timeout (${last?.message||'source unavailable'})`)}})().finally(()=>inflight.delete(n));inflight.set(n,promise);return promise};
const prewarm=async id=>{try{await acquire(id)}catch{}};
window.jarvisEbookSourceAcquire=acquire;
window.jarvisEbookSourcePrewarm=prewarm;
})();
