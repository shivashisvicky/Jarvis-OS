import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const root = new URL('../', import.meta.url);
const file = new URL('../src/jarvis.ts', import.meta.url);
const source = await readFile(file, 'utf8');
const legacySpeechTypes = /\ndeclare global\{interface SpeechRecognitionResultList\{\[index:number\]:SpeechRecognitionResult\}interface SpeechRecognitionEvent extends Event\{resultIndex:number;results:SpeechRecognitionResultList\}interface SpeechRecognition\{lang:string;interimResults:boolean;continuous:boolean;maxAlternatives:number;onstart:\(\(\)=>void\)\|null;onend:\(\(\)=>void\)\|null;onerror:\(\(\)=>void\)\|null;onresult:\(\(event:SpeechRecognitionEvent\)=>void\)\|null;start\(\):void;stop\(\):void\}\}\n/;
const patched = source.replace(legacySpeechTypes, '\n');

if (patched === source) console.warn('JARVIS build: legacy speech DOM declarations were not present; continuing.');
else await writeFile(file, patched, 'utf8');

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  child.on('error', reject);
});

async function writeYouTubeConfig() {
  const key = process.env.YOUTUBE_API_KEY || '';
  const dist = new URL('../dist/', import.meta.url);
  await mkdir(dist, { recursive: true });
  await writeFile(new URL('jarvis-youtube-config.js', dist), `window.JARVIS_YOUTUBE_API_KEY=${JSON.stringify(key)};\n`, 'utf8');
}

async function copyRootStaticAssets() {
  const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const refs = [...index.matchAll(/(?:src|href)=["']\.\/([^"']+)["']/g)]
    .map(match => match[1].split('?')[0].split('#')[0])
    .filter(path => path && !path.startsWith('src/') && path !== 'jarvis-youtube-config.js' && !path.includes('/'));
  const unique = [...new Set(refs)];
  const dist = new URL('../dist/', import.meta.url);
  await mkdir(dist, { recursive: true });
  for (const asset of unique) {
    try {
      await copyFile(new URL(asset, root), new URL(asset, dist));
      console.log(`JARVIS build: copied ${asset}`);
    } catch (error) {
      throw new Error(`JARVIS build: referenced static asset is missing: ${asset}\n${error.message}`);
    }
  }
}

try {
  await run('npx', ['tsc', '-b']);
  await run('npx', ['vite', 'build']);
  await writeYouTubeConfig();
  await copyRootStaticAssets();
} finally {
  if (patched !== source) await writeFile(file, source, 'utf8');
}
