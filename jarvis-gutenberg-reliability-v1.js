(()=>{
'use strict';
if(window.__JARVIS_GUTENBERG_RELIABILITY_V1__)return;
window.__JARVIS_GUTENBERG_RELIABILITY_V1__=true;
const nativeFetch=window.fetch.bind(window);
const isGutendex=url=>{try{return new URL(url,location.href).hostname==='gutendex.com'}catch{return String(url).includes('gutendex.com')}};
window.fetch=async(input,init)=>{
 if(!isGutendex(typeof input==='string'?input:input?.url))return nativeFetch(input,init);
 let last;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await nativeFetch(input,init);
   if(response.ok)return response;
   last=new Error(`Gutendex HTTP ${response.status}`);
  }catch(error){last=error}
  if(attempt<2)await new Promise(r=>setTimeout(r,300*(attempt+1)));
 }
 throw last||new Error('Gutendex unavailable');
};
})();
