(() => {
  'use strict';
  if (window.__JARVIS_VOICE_BRIDGE_V3__) return;
  window.__JARVIS_VOICE_BRIDGE_V3__ = true;
  const synth = window.speechSynthesis;
  if (!synth) return;
  let voices = [];
  let primed = false;
  let lastText = '';
  let lastAt = 0;
  const originalSpeak = synth.speak.bind(synth);
  const originalCancel = synth.cancel.bind(synth);
  const refresh = () => { voices = synth.getVoices(); };
  refresh();
  if ('onvoiceschanged' in synth) synth.addEventListener('voiceschanged', refresh);
  const pick = () => {
    refresh();
    const preferred = ['Arthur','Daniel','George','Oliver','James','Alex','Fred','Thomas'];
    return voices.find(v => /^en-GB/i.test(v.lang) && preferred.some(n => v.name.toLowerCase().includes(n.toLowerCase())))
      || voices.find(v => /^en-GB/i.test(v.lang) && /male|enhanced|premium|natural/i.test(v.name))
      || voices.find(v => /^en-GB/i.test(v.lang))
      || voices.find(v => /^en-IN/i.test(v.lang) && /male|enhanced|premium|natural/i.test(v.name))
      || voices.find(v => /^en-US/i.test(v.lang) && /male|alex|enhanced|premium|natural/i.test(v.name))
      || voices[0] || null;
  };
  const cinematicize = u => {
    const v = pick();
    u.rate = .86;
    u.pitch = .43;
    u.volume = .98;
    if (v) { u.voice = v; u.lang = v.lang; }
    else u.lang = 'en-GB';
    return u;
  };
  function prime() {
    if (primed) return;
    primed = true;
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      originalSpeak(u);
      originalCancel();
    } catch {}
  }
  function speak(text) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return;
    const now = Date.now();
    if (clean === lastText && now - lastAt < 900) return;
    lastText = clean; lastAt = now;
    refresh();
    try { originalCancel(); } catch {}
    try { originalSpeak(cinematicize(new SpeechSynthesisUtterance(clean))); } catch {}
  }
  // Main JARVIS already calls speechSynthesis.speak(). Make that path reliable too.
  try {
    synth.speak = utterance => originalSpeak(cinematicize(utterance));
  } catch {}
  window.jarvisCinematicSpeak = speak;
  window.jarvisPrimeVoice = prime;
  document.addEventListener('pointerdown', prime, {capture:true, passive:true});
  document.addEventListener('touchstart', prime, {capture:true, passive:true});
  document.addEventListener('click', e => {
    const t = e.target instanceof Element ? e.target.closest('#voiceBtn,#heroVoice,#testVoice') : null;
    if (t) prime();
  }, true);

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const isTime = q => /\btime\b/i.test(q) && /\b(what|tell|give|current|now|is it)\b/i.test(q) || /\bwhat(?:'s| is)\s+the\s+time\b/i.test(q);
  const isWeather = q => /\b(weather|temperature|forecast|rain|raining|hot|cold)\b/i.test(q) && /\b(around me|near me|here|my location|where i am|current location)\b/i.test(q);
  const isPm = q => /\b(prime minister|pm)\b/i.test(q) && /\b(india|indian)\b/i.test(q);
  function reply(text) {
    const box = $('#jarvisReply');
    if (box) { box.innerHTML = `<strong>JARVIS</strong><span>${esc(text)}</span>`; box.classList.add('visible'); }
    speak(text);
  }
  async function weatherHere() {
    if (!navigator.geolocation) throw Error('Location access is unavailable.');
    const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {enableHighAccuracy:false, timeout:10000, maximumAge:300000}));
    const {latitude:lat, longitude:lon} = pos.coords;
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`, {cache:'no-store'});
    if (!r.ok) throw Error('Weather service is unavailable.');
    const c = (await r.json()).current || {};
    const code = Number(c.weather_code);
    const desc = code === 0 ? 'clear skies' : code <= 3 ? 'partly cloudy skies' : code <= 48 ? 'misty conditions' : code <= 67 ? 'rain' : code <= 77 ? 'snow' : code <= 82 ? 'showers' : 'thunderstorms';
    reply(`It is ${Math.round(c.temperature_2m)} degrees Celsius, feels like ${Math.round(c.apparent_temperature)}, with ${desc}. Humidity is ${Math.round(c.relative_humidity_2m)} percent and wind is ${Math.round(c.wind_speed_10m)} kilometres per hour.`);
  }
  async function homeCommand(raw) {
    const q = String(raw || '').trim();
    if (!q) return false;
    if (isTime(q)) {
      reply(`The local time is ${new Intl.DateTimeFormat([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}).format(new Date())}.`);
      return true;
    }
    if (isPm(q)) { reply('The Prime Minister of India is Narendra Modi.'); return true; }
    if (isWeather(q)) {
      reply('Checking your current location and local weather.');
      try { await weatherHere(); } catch (e) { reply(`I could not access your location. ${e?.message || 'Please allow location access.'}`); }
      return true;
    }
    return false;
  }
  function bindHome() {
    const form = $('#commandForm');
    const input = $('#commandInput');
    if (!form || !input || form.dataset.homeVoiceBound === '1') return;
    form.dataset.homeVoiceBound = '1';
    form.addEventListener('submit', async e => {
      const q = input.value.trim();
      if (!(isTime(q) || isPm(q) || isWeather(q))) return;
      e.preventDefault(); e.stopImmediatePropagation();
      await homeCommand(q);
    }, true);
  }
  window.addEventListener('jarvis:voice-command', async e => {
    const q = String(e.detail?.text || '').trim();
    if (!(isTime(q) || isPm(q) || isWeather(q))) return;
    e.preventDefault();
    await homeCommand(q);
  }, true);
  new MutationObserver(bindHome).observe(document.documentElement, {childList:true, subtree:true});
  bindHome();
})();
