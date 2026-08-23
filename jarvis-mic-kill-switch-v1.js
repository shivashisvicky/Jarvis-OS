(()=>{
'use strict';
if(window.__JARVIS_MIC_KILL_SWITCH_V1__)return;
window.__JARVIS_MIC_KILL_SWITCH_V1__=true;
const stop=()=>{try{window.jarvisStopIOSVoice?.()}catch{};try{window.speechSynthesis?.cancel()}catch{};const b=document.querySelector('#voiceBtn');b?.classList.remove('listening');const stopButton=document.querySelector('#jarvisIOSStopVoice');if(stopButton instanceof HTMLElement)stopButton.hidden=true};
window.jarvisForceStopVoice=stop;
window.addEventListener('jarvis:force-stop-voice',stop,true);
window.addEventListener('jarvis:voice-command',()=>window.setTimeout(stop,50),true);
document.addEventListener('submit',e=>{if(e.target instanceof HTMLFormElement&&e.target.id==='commandForm')window.setTimeout(stop,50)},true);
window.addEventListener('pagehide',stop,true);
window.addEventListener('beforeunload',stop,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()},true);
let watchdog=0;
const arm=()=>{if(watchdog)clearTimeout(watchdog);watchdog=window.setTimeout(stop,12000)};
document.addEventListener('click',e=>{const t=e.target instanceof Element?t=e.target.closest('#voiceBtn'):null;if(t)arm()},true);
})();