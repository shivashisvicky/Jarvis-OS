export type JarvisIntent =
  | 'time'
  | 'date'
  | 'calculator'
  | 'snake'
  | 'notes'
  | 'settings'
  | 'files'
  | 'fullscreen'
  | 'status'
  | 'help'
  | 'unknown';

export type Telemetry = {
  online: boolean;
  battery: number | null;
  charging: boolean | null;
  memory: number | null;
  cores: number | null;
  network: string;
};

export type JarvisResult = {
  intent: JarvisIntent;
  reply: string;
  value?: string;
};

export function classifyCommand(raw: string): JarvisIntent {
  const q = raw.trim().toLowerCase();
  if (/\b(time|clock)\b/.test(q)) return 'time';
  if (/\b(date|day|today)\b/.test(q)) return 'date';
  if (/\b(calculator|calculate|math|compute)\b/.test(q)) return 'calculator';
  if (/\b(snake|game|arcade)\b/.test(q)) return 'snake';
  if (/\b(note|notes|remember)\b/.test(q)) return 'notes';
  if (/\b(setting|settings|appearance|theme)\b/.test(q)) return 'settings';
  if (/\b(file|files|workspace)\b/.test(q)) return 'files';
  if (/\b(fullscreen|full screen|cinema)\b/.test(q)) return 'fullscreen';
  if (/\b(status|diagnostic|diagnostics|system check|health)\b/.test(q)) return 'status';
  if (/\b(help|commands|what can you do)\b/.test(q)) return 'help';
  return 'unknown';
}

export function runCommand(raw: string, telemetry: Telemetry): JarvisResult {
  const intent = classifyCommand(raw);
  const now = new Date();
  switch (intent) {
    case 'time':
      return { intent, reply: `The local time is ${new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now)}.` };
    case 'date':
      return { intent, reply: `Today is ${new Intl.DateTimeFormat([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(now)}.` };
    case 'calculator':
      return { intent, reply: 'Calculator module standing by.', value: 'calculator' };
    case 'snake':
      return { intent, reply: 'Arcade module ready. Shall we play?', value: 'snake' };
    case 'notes':
      return { intent, reply: 'Personal memory module ready.', value: 'notes' };
    case 'settings':
      return { intent, reply: 'System preferences ready.', value: 'settings' };
    case 'files':
      return { intent, reply: 'Local workspace is online.', value: 'files' };
    case 'fullscreen':
      return { intent, reply: 'Engaging immersive display.' };
    case 'status':
      return {
        intent,
        reply: `All primary systems nominal. Network ${telemetry.network}. ${telemetry.cores ?? 'Unknown'} logical processors detected. Memory telemetry ${telemetry.memory == null ? 'unavailable' : `${telemetry.memory}%`}.`,
      };
    case 'help':
      return { intent, reply: 'I can open modules, report time and date, run diagnostics, toggle immersive mode, and respond to voice commands.' };
    default:
      return { intent, reply: 'Command not recognised. Try “system status”, “open calculator”, “what time is it”, or “open snake”.' };
  }
}

export async function getTelemetry(): Promise<Telemetry> {
  const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
  let battery: number | null = null;
  let charging: boolean | null = null;
  if (nav.getBattery) {
    try {
      const b = await nav.getBattery();
      battery = Math.round(b.level * 100);
      charging = b.charging;
    } catch { /* browser may deny battery telemetry */ }
  }
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  return {
    online: navigator.onLine,
    battery,
    charging,
    memory: memory ? Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) : null,
    cores: navigator.hardwareConcurrency ?? null,
    network: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType ?? 'online',
  };
}

export function speak(text: string): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 0.82;
  utterance.volume = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function startVoice(onResult: (text: string) => void, onState: (active: boolean) => void): () => void {
  const SpeechRecognitionCtor = (window as Window & { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
    ?? (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) throw new Error('Voice recognition is not supported by this browser.');
  const recognition = new SpeechRecognitionCtor();
  recognition.lang = navigator.language || 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onstart = () => onState(true);
  recognition.onend = () => onState(false);
  recognition.onerror = () => onState(false);
  recognition.onresult = event => onResult(event.results[0][0].transcript);
  recognition.start();
  return () => recognition.stop();
}

declare global {
  interface SpeechRecognitionResultList { [index: number]: SpeechRecognitionResult; }
  interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; }
  interface SpeechRecognition { lang: string; interimResults: boolean; continuous: boolean; onstart: (() => void) | null; onend: (() => void) | null; onerror: (() => void) | null; onresult: ((event: SpeechRecognitionEvent) => void) | null; start(): void; stop(): void; }
}
