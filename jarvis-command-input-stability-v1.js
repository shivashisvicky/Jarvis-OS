(()=>{
'use strict';
if(window.__JARVIS_COMMAND_INPUT_STABILITY_V1__)return;
window.__JARVIS_COMMAND_INPUT_STABILITY_V1__=true;
let value='',lastFocus=0,suppressUntil=0,node=null;
const get=()=>document.querySelector('#commandInput');
const remember=e=>{const t=e.target;if(t instanceof HTMLInputElement&&t.id==='commandInput'){value=t.value;lastFocus=Date.now()}};
document.addEventListener('focusin',e=>{const t=e.target;if(t instanceof HTMLInputElement&&t.id==='commandInput'){node=t;value=t.value;lastFocus=Date.now()}},true);
document.addEventListener('input',remember,true);
document.addEventListener('submit',e=>{const f=e.target;if(f instanceof HTMLFormElement&&f.id==='commandForm')suppressUntil=Date.now()+1200},true);
const repair=()=>{const input=get();if(!input||Date.now()<suppressUntil)return;if(document.activeElement===input){node=input;value=input.value;lastFocus=Date.now();return}if(node&&Date.now()-lastFocus<5000&&input!==node&&input.value!==value){input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));try{input.focus({preventScroll:true})}catch{input.focus()};node=input}};
new MutationObserver(repair).observe(document.documentElement,{childList:true,subtree:true});
setInterval(repair,150);
})();
