(()=>{
'use strict';
if(window.__JARVIS_EBOOK_TEXT_TRANSPORT_V1__)return;
window.__JARVIS_EBOOK_TEXT_TRANSPORT_V1__=true;
const G='https://www.gutenberg.org';
const originalFetch=window.fetch.bind(window);
const isTextRequest=init=>/text\/plain|text\/html|\*\/\*/i.test(String(init?.headers?.Accept||init?.headers?.accept||''));
const ebookId=url=>{
 const m=url.pathname.match(/^\/cache\/epub\/(\d+)\/|^\/files\/(\d+)\//);
 return m?.[1]||m?.[2]||'';
};
const canonicalCandidates=id=>[
 `${G}/ebooks/${id}.txt.utf-8`,
 `https://r.jina.ai/http://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
 `https://r.jina.ai/https://www.gutenberg.org/ebooks/${id}.txt.utf-8`
];
window.fetch=async(input,init={})=>{
 const raw=typeof input==='string'?input:input?.url||'';
 try{
  const u=new URL(raw,location.href);
  const id=ebookId(u);
  if(id&&u.hostname==='www.gutenberg.org'&&isTextRequest(init)){
   for(const candidate of canonicalCandidates(id)){
    try{
     const r=await originalFetch(candidate,{...init,cache:'no-store'});
     if(r.ok){
      const text=await r.text();
      if(text.trim().length>200){
       console.info('[JARVIS ebook transport] canonical text source',id,candidate);
       return new Response(text,{status:200,headers:{'content-type':'text/plain;charset=utf-8'}});
      }
     }
    }catch{}
   }
  }
 }catch{}
 return originalFetch(input,init);
};
console.info('[JARVIS ebook transport] v1 active');
})();