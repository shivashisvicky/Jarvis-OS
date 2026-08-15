(() => {
  'use strict';
  const speak = text => {
    if (!('speechSynthesis' in window)) return;
    const voices = speechSynthesis.getVoices();
    const preferred = ['Daniel','Arthur','George','Oliver','James','Alex','Fred'];
    const voice = voices.find(v => preferred.some(n => v.name.toLowerCase().includes(n.toLowerCase())) && /^en-GB/i.test(v.lang)) || voices.find(v => /^en-GB/i.test(v.lang)) || voices.find(v => /^en-IN/i.test(v.lang)) || voices[0];
    const u = new SpeechSynthesisUtterance(text); u.voice = voice || null; u.lang = voice?.lang || 'en-GB'; u.rate = .82; u.pitch = .52; u.volume = .98; speechSynthesis.cancel(); speechSynthesis.speak(u);
  };
  const clickApp = id => document.querySelector(`button.nav[data-app="${id}"]`)?.click();
  const natural = q => {
    const x=q.toLowerCase();
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(x)) return 'Good to hear from you. JARVIS is online and ready.';
    if (/\bwho are you\b|\bwhat are you\b/.test(x)) return 'I am JARVIS, your browser-native command layer. I can control the shell, search, news, maps, media and system tools.';
    if (/\bhow are you\b/.test(x)) return 'All primary systems are nominal. I am ready for your next command.';
    if (/\bwhat can you do\b|\bhelp me\b/.test(x)) return 'I can open modules, search the web, read live news, play videos and report system status.';
    if (/\b(status|diagnostic|system check|health)\b/.test(x)) return `Core is nominal. Network is ${navigator.onLine?'online':'offline'}, with ${navigator.hardwareConcurrency||'unknown'} logical processors available.`;
    return null;
  };
  window.addEventListener('jarvis:voice-command', e => {
    const q=String(e.detail?.text||'').trim(); if(!q)return;
    const x=q.toLowerCase();
    const reply=natural(q);
    if(reply){e.preventDefault();const r=document.querySelector('#jarvisReply');if(r){r.textContent=reply;r.style.display='block'}speak(reply);return;}
    if(/\b(news|headlines|current events|latest events)\b/.test(x)){
      e.preventDefault();clickApp('news');speak('Opening the live news desk.');return;
    }
    if(/\b(play|youtube|video)\b/.test(x) && /(https?:\/\/|youtu\.be|youtube\.com)/.test(x)){
      e.preventDefault();clickApp('media');setTimeout(()=>{const i=document.querySelector('#jarvisVideoUrl');const b=document.querySelector('#jarvisVideoPlay');if(i){i.value=q.match(/https?:\/\/\S+/)?.[0]||q;i.dispatchEvent(new Event('input',{bubbles:true}))}b?.click()},80);speak('Loading that video in the JARVIS player.');return;
    }
    if(/\b(open|show|go to)\b.*\b(media|player|youtube)\b/.test(x)){e.preventDefault();clickApp('media');speak('Media console ready.');return;}
    if(/\b(open|show|go to)\b.*\b(map|maps|navigation)\b/.test(x)){e.preventDefault();clickApp('maps');speak('Mapping console ready.');return;}
    if(/\b(open|show|go to)\b.*\b(news)\b/.test(x)){e.preventDefault();clickApp('news');speak('Opening the live news desk.');return;}
    if(/\b(search|look up|find)\b/.test(x)){
      e.preventDefault();const query=q.replace(/^\s*(search|look up|find)(\s+the\s+web)?(\s+for)?\s*/i,'').trim()||'JARVIS OS';clickApp('web');setTimeout(()=>{const i=document.querySelector('#browserAddress'),b=document.querySelector('button[data-provider="bing"]');if(i)i.value=query;b?.click()},100);speak(`Searching Bing for ${query}.`);return;
    }
  });
})();
