(()=>{'use strict';
const KEY='jarvisSpeechRate';
const DEFAULT_RATE=0.92;
const MIN_RATE=0.80;
const MAX_RATE=1.20;
const STEP=0.01;
const clamp=v=>Math.min(MAX_RATE,Math.max(MIN_RATE,Number(v)||DEFAULT_RATE));
const getRate=()=>{try{return clamp(localStorage.getItem(KEY)||DEFAULT_RATE)}catch{return DEFAULT_RATE}};
const setRate=v=>{const rate=clamp(v);try{localStorage.setItem(KEY,String(rate))}catch{};return rate};
window.jarvisGetSpeechRate=getRate;
window.jarvisSetSpeechRate=setRate;
window.jarvisSpeechRateConfig={min:MIN_RATE,max:MAX_RATE,step:STEP,default:DEFAULT_RATE};

const style=()=>{if(document.querySelector('#jarvis-voice-rate-style'))return;const s=document.createElement('style');s.id='jarvis-voice-rate-style';s.textContent='.voice-rate-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.voice-rate-row input[type=range]{flex:1;min-width:180px}.voice-rate-value{min-width:54px;text-align:right;font-variant-numeric:tabular-nums}';document.head.appendChild(s)};
function installSettings(){const cards=[...document.querySelectorAll('.settings-card')];const voiceCard=cards.find(c=>/\bVoice\b/i.test(c.querySelector('h3')?.textContent||''));if(!voiceCard||voiceCard.querySelector('#jarvisSpeechRate'))return;const wrap=document.createElement('div');wrap.className='voice-rate-row';wrap.innerHTML='<label for="jarvisSpeechRate">Speech rate</label><input id="jarvisSpeechRate" type="range" min="0.80" max="1.20" step="0.01"><output class="voice-rate-value" id="jarvisSpeechRateValue"></output>';voiceCard.appendChild(wrap);const input=wrap.querySelector('#jarvisSpeechRate');const output=wrap.querySelector('#jarvisSpeechRateValue');const sync=()=>{const rate=setRate(input.value);input.value=rate.toFixed(2);output.textContent=`${rate.toFixed(2)}×`;window.dispatchEvent(new CustomEvent('jarvis:speech-rate-changed',{detail:{rate}}))};input.value=getRate().toFixed(2);output.textContent=`${getRate().toFixed(2)}×`;input.addEventListener('input',sync)}
style();new MutationObserver(installSettings).observe(document.documentElement,{childList:true,subtree:true});installSettings();
})();