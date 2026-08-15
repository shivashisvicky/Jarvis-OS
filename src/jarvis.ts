export type JarvisIntent = 'time'|'date'|'calculator'|'snake'|'notes'|'settings'|'files'|'fullscreen'|'status'|'help'|'search'|'maps'|'media'|'api'|'remote'|'web'|'unknown';
export type Telemetry = { online:boolean; battery:number|null; charging:boolean|null; memory:number|null; cores:number|null; network:string };
export type JarvisResult = { intent:JarvisIntent; reply:string; value?:string; url?:string };
export type VoiceConfig = { voiceName:string; rate:number; pitch:number; volume:number; language:string };

export function classifyCommand(raw:string):JarvisIntent {
 const q=raw.trim().toLowerCase();
 if(/\b(time|clock)\b/.test(q))return'time'; if(/\b(date|day|today)\b/.test(q))return'date';
 if(/\b(calculator|calculate|math|compute)\b/.test(q))return'calculator'; if(/\b(snake|game|arcade)\b/.test(q))return'snake';
 if(/\b(note|notes|remember)\b/.test(q))return'notes'; if(/\b(setting|settings|appearance|theme|voice)\b/.test(q))return'settings';
 if(/\b(file|files|workspace)\b/.test(q))return'files'; if(/\b(fullscreen|full screen|cinema)\b/.test(q))return'fullscreen';
 if(/\b(status|diagnostic|diagnostics|system check|health)\b/.test(q))return'status'; if(/\b(help|commands|what can you do)\b/.test(q))return'help';
 if(/\b(map|maps|directions|navigate|location)\b/.test(q))return'maps'; if(/\b(video|youtube|movie|play)\b/.test(q))return'media';
 if(/\b(postman|api|rest|http request|request client)\b/.test(q))return'api'; if(/\b(sftp|winscp|ssh|remote server|file transfer)\b/.test(q))return'remote';
 if(/\b(search|look up|google|bing|brave|internet|web)\b/.test(q))return'search'; return'unknown';
}
export function runCommand(raw:string,telemetry:Telemetry):JarvisResult {
 const intent=classifyCommand(raw),q=raw.trim(),now=new Date();
 switch(intent){
  case'time':return{intent,reply:`The local time is ${new Intl.DateTimeFormat([],{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(now)}.`};
  case'date':return{intent,reply:`Today is ${new Intl.DateTimeFormat([],{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(now)}.`};
  case'calculator':return{intent,reply:'Calculator module standing by.',value:'calculator'};
  case'snake':return{intent,reply:'Arcade module ready. Shall we play?',value:'snake'};
  case'notes':return{intent,reply:'Personal memory module ready.',value:'notes'};
  case'settings':return{intent,reply:'System preferences ready.',value:'settings'};
  case'files':return{intent,reply:'Local workspace is online.',value:'files'};
  case'fullscreen':return{intent,reply:'Engaging immersive display.'};
  case'status':return{intent,reply:`All primary systems nominal. Network ${telemetry.network}. ${telemetry.cores??'Unknown'} logical processors detected. Memory telemetry ${telemetry.memory==null?'unavailable':`${telemetry.memory}%`}.`};
  case'help':return{intent,reply:'I can control modules, search the web, open maps and media, send REST requests, manage remote connection profiles, run diagnostics, and operate by voice.'};
  case'maps':return{intent,reply:'Mapping console ready.',value:'maps'};
  case'media':return{intent,reply:'Media console ready.',value:'media'};
  case'api':return{intent,reply:'REST client ready.',value:'api'};
  case'remote':return{intent,reply:'Secure transfer console ready. Browser-only SFTP requires a JARVIS Gateway.',value:'remote'};
  case'web': case'search':return{intent,reply:`Opening web search for “${q.replace(/\b(search|look up|internet|web)\b/gi,'').trim()||'your query'}”.`,value:'web'};
  default:return{intent,reply:'I did not recognise that command. Try “search the web for…”, “open maps”, “open REST client”, or “open media”.'};
 }
}
export async function getTelemetry():Promise<Telemetry>{
 const nav=navigator as Navigator&{getBattery?:()=>Promise<{level:number;charging:boolean}>};let battery:number|null=null,charging:boolean|null=null;
 if(nav.getBattery){try{const b=await nav.getBattery();battery=Math.round(b.level*100);charging=b.charging}catch{}}
 const memory=(performance as Performance&{memory?:{usedJSHeapSize:number;jsHeapSizeLimit:number}}).memory;
 return{online:navigator.onLine,battery,charging,memory:memory?Math.round(memory.usedJSHeapSize/memory.jsHeapSizeLimit*100):null,cores:navigator.hardwareConcurrency??null,network:(navigator as Navigator&{connection?:{effectiveType?:string}}).connection?.effectiveType??'online'};
}
export function availableVoices(){return 'speechSynthesis'in window?window.speechSynthesis.getVoices():[]}
export function chooseJarvisVoice(){const voices=availableVoices();const preferred=['Daniel','Arthur','George','Oliver','James','Alex','Fred','Thomas'];return voices.find(v=>preferred.some(n=>v.name.toLowerCase().includes(n.toLowerCase()))&&/^en-GB/i.test(v.lang))??voices.find(v=>/^en-GB/i.test(v.lang)&&/male|natural|enhanced|premium/i.test(v.name))??voices.find(v=>/^en-GB/i.test(v.lang))??voices.find(v=>/^en-IN/i.test(v.lang)&&/male|natural|enhanced|premium/i.test(v.name))??voices.find(v=>/^en-US/i.test(v.lang)&&/male|alex|natural|enhanced|premium/i.test(v.name))??voices[0]}
export function speak(text:string,cfg:VoiceConfig={voiceName:'',rate:.84,pitch:.58,volume:.98,language:'en-GB'}):void{if(!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=cfg.rate;u.pitch=cfg.pitch;u.volume=cfg.volume;u.lang=cfg.language;const v=availableVoices().find(x=>x.name===cfg.voiceName)||chooseJarvisVoice();if(v){u.voice=v;u.lang=v.lang}window.speechSynthesis.speak(u)}
export function startVoice(onResult:(text:string)=>void,onState:(active:boolean,interim?:string)=>void,language='en-US'):()=>void{
 const C=(window as Window&{SpeechRecognition?:new()=>SpeechRecognition;webkitSpeechRecognition?:new()=>SpeechRecognition}).SpeechRecognition??(window as Window&{webkitSpeechRecognition?:new()=>SpeechRecognition}).webkitSpeechRecognition;
 if(!C)throw new Error('Voice recognition is not supported by this browser.');const r=new C();r.lang=language;r.interimResults=true;r.continuous=true;r.maxAlternatives=3;r.onstart=()=>onState(true);r.onend=()=>onState(false);r.onerror=()=>onState(false);r.onresult=e=>{let interim='';let final='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)final+=t;else interim+=t}onState(true,interim);if(final.trim())onResult(final.trim())};r.start();return()=>{try{r.stop()}catch{}};
}
declare global{interface SpeechRecognitionResultList{[index:number]:SpeechRecognitionResult}interface SpeechRecognitionEvent extends Event{resultIndex:number;results:SpeechRecognitionResultList}interface SpeechRecognition{lang:string;interimResults:boolean;continuous:boolean;maxAlternatives:number;onstart:(()=>void)|null;onend:(()=>void)|null;onerror:(()=>void)|null;onresult:((event:SpeechRecognitionEvent)=>void)|null;start():void;stop():void}}
