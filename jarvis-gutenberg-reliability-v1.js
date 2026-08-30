(()=>{
'use strict';
if(window.__JARVIS_GUTENBERG_RELIABILITY_V3__)return;
window.__JARVIS_GUTENBERG_RELIABILITY_V3__=true;
const nativeFetch=window.fetch.bind(window);
const isGutendex=url=>{try{return new URL(url,location.href).hostname==='gutendex.com'}catch{return String(url).includes('gutendex.com')}};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
window.fetch=async(input,init)=>{
  if(!isGutendex(typeof input==='string'?input:input?.url))return nativeFetch(input,init);
  const signal=init?.signal;
  let last;
  for(let attempt=0;attempt<3;attempt++){
    if(signal?.aborted)throw new DOMException('The operation was aborted.','AbortError');
    try{
      const response=await nativeFetch(input,init);
      if(response.ok||response.status<500||attempt===2)return response;
      last=new Error(`HTTP ${response.status}`);
    }catch(error){
      if(signal?.aborted)throw error;
      last=error;
    }
    await wait(350*(attempt+1));
  }
  throw last||new Error('Gutenberg request failed');
};
})();
