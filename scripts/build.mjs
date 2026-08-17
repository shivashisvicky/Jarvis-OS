import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const file = new URL('../src/jarvis.ts', import.meta.url);
const source = await readFile(file, 'utf8');
const legacySpeechTypes = /\ndeclare global\{interface SpeechRecognitionResultList\{\[index:number\]:SpeechRecognitionResult\}interface SpeechRecognitionEvent extends Event\{resultIndex:number;results:SpeechRecognitionResultList\}interface SpeechRecognition\{lang:string;interimResults:boolean;continuous:boolean;maxAlternatives:number;onstart:\(\(\)=>void\)\|null;onend:\(\(\)=>void\)\|null;onerror:\(\(\)=>void\)\|null;onresult:\(\(event:SpeechRecognitionEvent\)=>void\)\|null;start\(\):void;stop\(\):void\}\}\n/;
const patched = source.replace(legacySpeechTypes, '\n');

if (patched === source) {
  console.warn('JARVIS build: legacy speech DOM declarations were not present; continuing.');
} else {
  await writeFile(file, patched, 'utf8');
}

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  child.on('error', reject);
});

try {
  await run('npx', ['tsc', '-b']);
  await run('npx', ['vite', 'build']);
} finally {
  if (patched !== source) await writeFile(file, source, 'utf8');
}
