(()=>{
'use strict';
if(window.__JARVIS_GUTENBERG_RELIABILITY_V2__)return;
window.__JARVIS_GUTENBERG_RELIABILITY_V2__=true;
const nativeFetch=window.fetch.bind(window);
const isGutendex=url=>{try{return new URL(url,location.href).hostname==='gutendex.com'}catch{return String(url).includes('gutendex.com')}};
window.fetch=(input,init)=>{
 if(!isGutendex(typeof input==='string'?input:input?.url))return nativeFetch(input,init);
 return nativeFetch(input,init);
};
})();
