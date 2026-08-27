(()=>{
'use strict';
if(window.__JARVIS_EBOOK_CONTENT_NORMALIZER_V1__)return;
window.__JARVIS_EBOOK_CONTENT_NORMALIZER_V1__=true;
const originalFetch=window.fetch.bind(window);
const isBookSource=url=>{const u=String(url||'').toLowerCase();return u.includes('gutenberg.org/cache/epub/')||u.includes('gutenberg.org/files/')||u.includes('r.jina.ai/http')||u.includes('allorigins.win/raw')};
const normalize=text=>{
  let t=String(text||'').replace(/\r/g,'');
  if(/<html|<body|<div|<p|<pre/i.test(t)){
    try{const d=new DOMParser().parseFromString(t,'text/html');d.querySelectorAll('script,style,noscript,iframe,object,embed,nav').forEach(x=>x.remove());t=d.body?.innerText||d.body?.textContent||t}catch{}
  }
  const start=t.search(/\*\*\* START OF (?:THE )?PROJECT GUTENBERG EBOOK[^\n]*\n/i);
  if(start>=0)t=t.slice(start).replace(/^\*\*\* START OF (?:THE )?PROJECT GUTENBERG EBOOK[^\n]*\n/i,'');
  const end=t.search(/\n\*\*\* END OF (?:THE )?PROJECT GUTENBERG EBOOK[^\n]*/i);
  if(end>=0)t=t.slice(0,end);
  // Some Gutenberg mirrors/proxies wrap the real text in metadata instead of
  // returning the canonical plain-text header. Strip that wrapper as well.
  const markdown=t.search(/(?:^|\n)Markdown Content:\s*\n/i);
  if(markdown>=0){
    const after=t.slice(markdown).replace(/^\s*Markdown Content:\s*/i,'').trim();
    const boilerplate=after.search(/\n\s*Title:\s*[^\n]*\n|\n\s*This eBook is for the use of anyone anywhere/i);
    if(boilerplate>=0){
      const license=after.search(/This eBook is for the use of anyone anywhere/i);
      if(license>=0){
        const canonicalStart=after.search(/\*\*\* START OF (?:THE )?PROJECT GUTENBERG EBOOK[^\n]*\n/i);
        if(canonicalStart>=0)t=after.slice(canonicalStart).replace(/^\*\*\* START OF (?:THE )?PROJECT GUTENBERG EBOOK[^\n]*\n/i,'');
        else {
          const titleLine=after.match(/(?:^|\n)Title:\s*([^\n]+)/i)?.[1];
          const body=after.slice(license);
          const bodyStart=body.search(/\n\s*(?:BEOWULF|CONTENTS\.|PREFACE\.|THE\s+PROJECT\s+GUTENBERG\s+EBOOK|[A-Z][A-Z .,'’:-]{8,})\s*\n/);
          if(bodyStart>=0)t=(titleLine?titleLine+'\n\n':'')+body.slice(bodyStart).trim();
          else t=after;
        }
      }else t=after;
    }
  }
  return t.trim();
};
window.fetch=async function(input,init){
  const response=await originalFetch(input,init);
  if(!isBookSource(typeof input==='string'?input:input?.url))return response;
  try{
    const text=await response.clone().text();
    const cleaned=normalize(text);
    return new Response(cleaned,{status:response.status,statusText:response.statusText,headers:response.headers});
  }catch{return response}
};
})();
