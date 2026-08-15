import { AppId, addNote, getSetting, notes, setSetting } from './db';
import { getTelemetry, runCommand, speak, startVoice, type Telemetry } from './jarvis';
import './styles.css';

const apps: Record<AppId, { name: string; icon: string }> = {
  home: { name: 'Command', icon: '◉' }, calculator: { name: 'Calculator', icon: '＋' }, snake: { name: 'Snake', icon: '◇' },
  files: { name: 'Files', icon: '▣' }, notes: { name: 'Notes', icon: '✎' }, settings: { name: 'Settings', icon: '⚙' },
};
let active: AppId = 'home';
let theme: 'dark' | 'light' = 'dark';
let telemetry: Telemetry = { online: navigator.onLine, battery: null, charging: null, memory: null, cores: navigator.hardwareConcurrency ?? null, network: 'online' };
let voiceStop: (() => void) | null = null;
const app = document.querySelector<HTMLDivElement>('#app')!;

function shell(content: string) {
  app.innerHTML = `<div class="os ${theme}">
    <header><div class="brand"><span class="orb">✦</span><span>J.A.R.V.I.S</span><em>PERSONAL ARTIFICIAL INTELLIGENCE</em></div>
      <div class="status"><span class="signal"><i></i> ${telemetry.online ? 'ONLINE' : 'OFFLINE'}</span><span id="clock"></span><button id="themeBtn" aria-label="Toggle theme">◐</button></div>
    </header>
    <main><aside>${Object.entries(apps).map(([id, a]) => `<button class="nav ${id === active ? 'selected' : ''}" data-app="${id}" title="${a.name}"><b>${a.icon}</b><span>${a.name}</span></button>`).join('')}</aside>
      <section class="workspace">${content}</section>
    </main>
    <footer><span>JARVIS CORE // LOCAL-FIRST RUNTIME</span><span><i class="dot"></i> ALL SYSTEMS ${telemetry.online ? 'NOMINAL' : 'OFFLINE'}</span></footer>
  </div>`;
  bind(); tick();
}

function bind() {
  document.querySelectorAll<HTMLButtonElement>('[data-app]').forEach(b => b.onclick = () => { active = b.dataset.app as AppId; render(); });
  document.querySelector<HTMLButtonElement>('#themeBtn')?.addEventListener('click', async () => { theme = theme === 'dark' ? 'light' : 'dark'; await setSetting('theme', theme); render(); });
  document.querySelector<HTMLButtonElement>('#voiceBtn')?.addEventListener('click', listen);
  document.querySelector<HTMLFormElement>('#commandForm')?.addEventListener('submit', e => { e.preventDefault(); const input = document.querySelector<HTMLInputElement>('#commandInput'); if (input?.value.trim()) execute(input.value.trim()); });
  document.querySelectorAll<HTMLButtonElement>('[data-command]').forEach(b => b.onclick = () => execute(b.dataset.command!));
  document.querySelector<HTMLButtonElement>('#fullscreenBtn')?.addEventListener('click', async () => { try { await document.documentElement.requestFullscreen?.(); } catch { /* browser policy */ } });
}
function tick() { const el = document.querySelector('#clock'); if (el) { el.textContent = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()); setTimeout(tick, 1000); } }
function render() { const c = active === 'home' ? home() : active === 'calculator' ? calculator() : active === 'snake' ? snake() : active === 'files' ? files() : active === 'notes' ? notesApp() : settings(); shell(c); setTimeout(afterRender, 0); }

function home() {
  const battery = telemetry.battery == null ? 'N/A' : `${telemetry.battery}%`;
  return `<div class="command-center">
    <div class="hud-top"><div><p class="eyebrow">STARK-LIKE COMMAND INTERFACE / CORE 01</p><h1>Good afternoon.</h1><p class="sub">Your browser-native personal command center. Lightweight, local-first, and ready for instructions.</p></div><button class="square-btn" id="fullscreenBtn" title="Immersive mode">⛶</button></div>
    <div class="reactor-stage"><div class="reticle r1"></div><div class="reticle r2"></div><div class="reactor"><span>J</span><small>CORE</small></div><div class="orbit o1"></div><div class="orbit o2"></div><div class="orbit o3"></div></div>
    <div class="command-deck"><form id="commandForm"><span class="prompt">›</span><input id="commandInput" autocomplete="off" placeholder="Ask JARVIS anything this runtime can do…"><button class="voice" id="voiceBtn" type="button">◉ <span>VOICE</span></button><button class="execute" type="submit">EXECUTE</button></form><div class="suggestions"><button data-command="system status">SYSTEM STATUS</button><button data-command="what time is it">TIME</button><button data-command="open calculator">CALCULATOR</button><button data-command="open snake">ARCADE</button></div></div>
    <div class="telemetry-grid"><article class="telemetry"><span>CORE STATUS</span><strong><i class="dot"></i> NOMINAL</strong><small>Local runtime operational</small></article><article class="telemetry"><span>NETWORK</span><strong>${telemetry.network.toUpperCase()}</strong><small>${telemetry.online ? 'Connection available' : 'Offline mode active'}</small></article><article class="telemetry"><span>POWER</span><strong>${battery}${telemetry.charging ? ' ⚡' : ''}</strong><small>Browser battery telemetry</small></article><article class="telemetry"><span>PROCESSING</span><strong>${telemetry.cores ?? '—'} CORES</strong><small>${telemetry.memory == null ? 'Memory telemetry unavailable' : `${telemetry.memory}% JS heap used`}</small></article></div>
    <div class="module-strip">${(['calculator','snake','files','notes','settings'] as AppId[]).map(id => `<button class="module" data-app="${id}"><span>${apps[id].icon}</span><div><strong>${apps[id].name}</strong><small>OPEN MODULE</small></div><b>↗</b></button>`).join('')}</div>
  </div>`;
}

function calculator() { return `<div class="apphead"><div><p class="eyebrow">UTILITY / MATHEMATICS</p><h2>Calculator</h2><p class="sub">Fast local computation module.</p></div></div><div class="calc"><input id="display" value="0" readonly><div class="keys">${['C','⌫','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','±','0','.','='].map(x => `<button data-key="${x}" class="${x === '=' ? 'equals' : ''}">${x}</button>`).join('')}</div></div>`; }
function snake() { return `<div class="apphead"><div><p class="eyebrow">ARCADE / RECREATION</p><h2>Snake</h2><p class="sub">Arrow keys or WASD. Eat the pulse. Don't eat yourself.</p></div><button class="primary" id="snakeStart">Start</button></div><canvas id="snakeCanvas" width="420" height="420"></canvas><div class="score" id="score">Score 0</div>`; }
function files() { return `<div class="apphead"><div><p class="eyebrow">SYSTEM / LOCAL WORKSPACE</p><h2>Files</h2><p class="sub">Browser sandbox storage. Your workspace remains local to this runtime.</p></div></div><div class="filebox"><div>▣ <strong>Jarvis Workspace</strong></div><div class="file">⌁ <span>Local database</span><small>IndexedDB</small></div><div class="file">◈ <span>App registry</span><small>Built-in</small></div><div class="file">⚙ <span>Preferences</span><small>Persistent</small></div></div>`; }
function notesApp() { return `<div class="apphead"><div><p class="eyebrow">MEMORY / PERSONAL</p><h2>Notes</h2><p class="sub">A private local memory module.</p></div></div><div class="note-compose"><textarea id="note" placeholder="Tell JARVIS something to remember…"></textarea><button class="primary" id="saveNote">Save note</button></div><div class="notes" id="notesList"><div class="empty">Loading memory…</div></div>`; }
function settings() { return `<div class="apphead"><div><p class="eyebrow">SYSTEM / CONFIGURATION</p><h2>Settings</h2><p class="sub">Control the interface and runtime.</p></div></div><div class="settings"><div><strong>Appearance</strong><span>Switch between dark and light command center</span></div><button class="primary" id="settingsTheme">${theme === 'dark' ? 'Light mode' : 'Dark mode'}</button></div><div class="settings"><div><strong>Runtime</strong><span>Native browser APIs • IndexedDB • no server required</span></div><span class="badge">LOCAL</span></div><div class="settings"><div><strong>Voice interface</strong><span>Uses browser speech recognition when available</span></div><span class="badge">BROWSER</span></div>`; }
function escapeHtml(s: string) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]!)); }

async function execute(command: string) {
  const result = runCommand(command, telemetry);
  if (result.value) { active = result.value as AppId; render(); return; }
  if (result.intent === 'fullscreen') { try { await document.documentElement.requestFullscreen?.(); } catch { /* ignored */ } }
  const reply = document.querySelector<HTMLElement>('#jarvisReply');
  if (reply) { reply.textContent = result.reply; reply.classList.add('show'); }
  speak(result.reply);
}
function listen() {
  if (voiceStop) { voiceStop(); voiceStop = null; return; }
  try { voiceStop = startVoice(text => { const input = document.querySelector<HTMLInputElement>('#commandInput'); if (input) input.value = text; execute(text); }, activeState => document.querySelector('#voiceBtn')?.classList.toggle('listening', activeState)); }
  catch (error) { const reply = document.querySelector<HTMLElement>('#jarvisReply'); if (reply) { reply.textContent = error instanceof Error ? error.message : 'Voice recognition unavailable.'; reply.classList.add('show'); } }
}

async function afterRender() {
  document.querySelector<HTMLButtonElement>('#settingsTheme')?.addEventListener('click', async () => { theme = theme === 'dark' ? 'light' : 'dark'; await setSetting('theme', theme); render(); });
  document.querySelector<HTMLButtonElement>('#saveNote')?.addEventListener('click', async () => { const t = (document.querySelector('#note') as HTMLTextAreaElement).value.trim(); if (t) { await addNote(t); render(); } });
  if (active === 'notes') { const list = document.querySelector('#notesList')!; const ns = await notes(); list.innerHTML = ns.slice().reverse().map(n => `<article><p>${escapeHtml(n.text)}</p><small>${new Date(n.created).toLocaleString()}</small></article>`).join('') || '<div class="empty">No notes yet.</div>'; }
  if (active === 'calculator') setupCalc(); if (active === 'snake') setupSnake();
}
function setupCalc() { let expr = ''; const d = document.querySelector<HTMLInputElement>('#display')!; document.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(b => b.onclick = () => { const k = b.dataset.key!; if (k === 'C') { expr = ''; d.value = '0'; return; } if (k === '⌫') { expr = expr.slice(0, -1); d.value = expr || '0'; return; } if (k === '=') { try { const safe = expr.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-').replace(/[^0-9+\-*/%.() ]/g, ''); const result = Function(`"use strict";return (${safe})`)(); expr = String(result); d.value = expr; } catch { d.value = 'Error'; expr = ''; } return; } if (k === '±') { expr = expr.startsWith('-') ? expr.slice(1) : '-' + expr; d.value = expr; return; } expr += k; d.value = expr; }); }
function setupSnake() { const c = document.querySelector<HTMLCanvasElement>('#snakeCanvas')!, ctx = c.getContext('2d')!, scoreEl = document.querySelector('#score')!; let snake: [number, number][] = [[10, 10]], food: [number, number] = [15, 10], dir: [number, number] = [1, 0], score = 0, running = false, timer: number; const reset = () => { snake = [[10, 10]]; food = [15, 10]; dir = [1, 0]; score = 0; scoreEl.textContent = 'Score 0'; }; const draw = () => { ctx.clearRect(0, 0, 420, 420); ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, 420, 420); ctx.strokeStyle = '#55d6ff18'; for (let i = 0; i <= 21; i++) { ctx.beginPath(); ctx.moveTo(i * 20, 0); ctx.lineTo(i * 20, 420); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * 20); ctx.lineTo(420, i * 20); ctx.stroke(); } ctx.fillStyle = '#55d6ff'; ctx.fillRect(food[0] * 20 + 3, food[1] * 20 + 3, 14, 14); ctx.fillStyle = '#f5c95b'; snake.forEach(([x, y]) => ctx.fillRect(x * 20 + 2, y * 20 + 2, 16, 16)); }; const step = () => { const h: [number, number] = [snake[0][0] + dir[0], snake[0][1] + dir[1]]; if (h[0] < 0 || h[0] >= 21 || h[1] < 0 || h[1] >= 21 || snake.some(([x, y]) => x === h[0] && y === h[1])) { running = false; clearInterval(timer); return; } snake.unshift(h); if (h[0] === food[0] && h[1] === food[1]) { score++; scoreEl.textContent = `Score ${score}`; food = [Math.floor(Math.random() * 21), Math.floor(Math.random() * 21)]; } else snake.pop(); draw(); }; document.addEventListener('keydown', e => { const m: Record<string, [number, number]> = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }; const n = m[e.key]; if (n && !(n[0] === -dir[0] && n[1] === -dir[1])) dir = n; }); document.querySelector('#snakeStart')!.addEventListener('click', () => { if (running) return; reset(); running = true; draw(); timer = window.setInterval(step, 120); }); draw(); }

async function boot() { theme = await getSetting<'dark' | 'light'>('theme', 'dark'); telemetry = await getTelemetry(); render(); setInterval(async () => { telemetry = await getTelemetry(); if (active === 'home') render(); }, 15000); }
void boot();
