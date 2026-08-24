(()=>{'use strict';
const KEY='jarvisSpeechRate';
const ACCENT_KEY='jarvisSpeechAccent';
const VERSION_KEY='jarvisSpeechRateVersion';
const DEFAULT_RATE=1.05;
const MIN_RATE=0.80;
const MAX_RATE=1.20;
const STEP=0.01;
const DEFAULT_ACCENT='en-GB';
const clamp=v=>Math.min(MAX_RATE,Math.max(MIN_RATE,Number(v)||DEFAULT_RATE));
const getRate=()=>{try{const stored=localStorage.getItem(KEY);const version=localStorage.getItem(VERSION_KEY);if(version!=='2'&&Number(stored)===0.92){localStorage.setItem(KEY,String(DEFAULT_RATE));localStorage.setItem(VERSION_KEY,'2');return DEFAULT_RATE}return clamp(stored??DEFAULT_RATE)}catch{return DEFAULT_RATE}};
const setRate=v=>{const rate=clamp(v);try{localStorage.setItem(KEY,String(rate));localStorage.setItem(VERSION_KEY,'2')}catch{};return rate};
const getAccent=()=>{try{return localStorage.getItem(ACCENT_KEY)||DEFAULT_ACCENT}catch{return DEFAULT_ACCENT}};
const setAccent=v=>{const accent=/^en-(GB|IN)$/i.test(String(v))?String(v):DEFAULT_ACCENT;try{localStorage.setItem(ACCENT_KEY,accent)}catch{};return accent};
window.jarvisGetSpeechRate=getRate;
window.jarvisSetSpeechRate=setRate;
window.jarvisGetSpeechAccent=getAccent;
window.jarvisSetSpeechAccent=setAccent;
window.jarvisSpeechRateConfig={min:MIN_RATE,max:MAX_RATE,step:STEP,default:DEFAULT_RATE};
window.jarvisSpeechAccentConfig={default:DEFAULT_ACCENT,options:[{value:'en-GB',label:'English (UK) — JARVIS standard'},{value:'en-IN',label:'English (India)'}]};

const style=()=>{if(document.querySelector('#jarvis-voice-rate-style'))return;const s=document.createElement('style');s.id='jarvis-voice-rate-style';s.textContent='.voice-rate-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.voice-rate-row input[type=range]{flex:1;min-width:180px}.voice-rate-value{min-width:54px;text-align:right;font-variant-numeric:tabular-nums}.voice-accent-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:10px}.voice-accent-row select{flex:1;min-width:220px}.voice-accent-note{width:100%;color:var(--muted,#78939c);font-size:10px;line-height:1.4}';document.head.appendChild(s)};
function installSettings(){const cards=[...document.querySelectorAll('.settings-card')];const voiceCard=cards.find(c=>/\bVoice\b/i.test(c.querySelector('h3')?.textContent||''));if(!voiceCard||voiceCard.querySelector('#jarvisSpeechRate'))return;const wrap=document.createElement('div');wrap.className='voice-rate-row';wrap.innerHTML='<label for="jarvisSpeechRate">Speech rate</label><input id="jarvisSpeechRate" type="range" min="0.80" max="1.20" step="0.01"><output class="voice-rate-value" id="jarvisSpeechRateValue"></output>';voiceCard.appendChild(wrap);const input=wrap.querySelector('#jarvisSpeechRate');const output=wrap.querySelector('#jarvisSpeechRateValue');const sync=()=>{const rate=setRate(input.value);input.value=rate.toFixed(2);output.textContent=`${rate.toFixed(2)}×`;window.dispatchEvent(new CustomEvent('jarvis:speech-rate-changed',{detail:{rate}}))};input.value=getRate().toFixed(2);output.textContent=`${getRate().toFixed(2)}×`;input.addEventListener('input',sync);const accent=document.createElement('div');accent.className='voice-accent-row';accent.innerHTML='<label for="jarvisSpeechAccent">JARVIS accent</label><select id="jarvisSpeechAccent"><option value="en-GB">English (UK) — JARVIS standard</option><option value="en-IN">English (India)</option></select><div class="voice-accent-note">JARVIS defaults to English (UK) across devices. The exact voice timbre still depends on voices installed by the device/browser.</div>';voiceCard.appendChild(accent);const select=accent.querySelector('#jarvisSpeechAccent');select.value=getAccent();select.addEventListener('change',()=>{const value=setAccent(select.value);window.dispatchEvent(new CustomEvent('jarvis:speech-accent-changed',{detail:{accent:value}}))})}
style();new MutationObserver(installSettings).observe(document.documentElement,{childList:true,subtree:true});installSettings();
})();