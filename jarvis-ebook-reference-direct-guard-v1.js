(()=>{'use strict';
if(window.__JARVIS_EBOOK_REFERENCE_DIRECT_GUARD_V2__)return;
window.__JARVIS_EBOOK_REFERENCE_DIRECT_GUARD_V2__=true;
const match=s=>{const q=String(s||'').trim().toLowerCase().replace(/[?.!]+$/,'');const m=q.match(/^read\s+(?:the\s+)?(first|second|third|last|\d+(?:st|nd|rd|th)?)(?:\s+(?:one|result))?$/);if(!m)return null;const n=m[1];if(n==='first')return 0;if(n==='second')return 1;if(n==='third')return 2;if(n==='last')return Math.max(0,document.querySelectorAll('#jbe6Results .jbe6-book').length-1);return Math.max(0,parseInt(n,10)-1)};
const schedule=raw=>{const index=match(raw);if(index===null)return false;const attempt=()=>{if(document.querySelector('.jbe24'))return true;const list=[...document.querySelectorAll('#jbe6Results .jbe6-book')];const card=list[index];const button=card?.querySelector('[data-read]');if(!(button instanceof HTMLElement))return false;button.click();return true};let tries=0;const timer=setInterval(()=>{if(attempt()||++tries>=100)clearInterval(timer)},100);return true};
window.addEventListener('jarvis:voice-command',e=>{schedule(e.detail?.text)},true);
window.addEventListener('jarvis:context-followup',e=>{const d=e.detail||{};if(d.type==='SELECT')schedule(`read ${d.text||'the first one'}`)},true);
})();
