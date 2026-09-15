#!/usr/bin/env node

/**
 * JARVIS OS protected regression contract gate.
 *
 * Read-only. This is intentionally structural, not a browser test runner.
 * It verifies that the TEST build still contains the files and browser wiring
 * required by the user-verified contracts documented in
 * JARVIS-REGRESSION-CONTRACT-20260915.md.
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const requiredFiles = [
  'index.html',
  'JARVIS-REGRESSION-CONTRACT-20260915.md',
  'scripts/jarvis-sanity-check.mjs',
  'jarvis-context-engine-v1.js',
  'jarvis-context-reference-authority-v1.js',
  'jarvis-ebook-command-authority-v1.js',
  'jarvis-ebook-search-authority-v2.js',
  'jarvis-ebook-context-retention-v1.js',
  'jarvis-ebook-ordinal-reader-race-fix-v1.js',
  'jarvis-chain-book-ordinal-direct-v1.js',
  'jarvis-map-ordinal-authority-v1.js',
  'jarvis-chain-map-fast-select-v1.js',
  'jarvis-image-shell-patch-v1.js',
  'workers/image-test/src/index.js',
  'jarvis-engineering-spatial-command-center-patch-v1.js',
  'jarvis-engineering-spatial-precision-patch-v1.js',
  'jarvis-engineering-spatial-command-bridge-v1.js'
];

for (const file of requiredFiles) {
  if (!exists(file)) failures.push(`missing protected file: ${file}`);
}

if (exists('index.html')) {
  const html = read('index.html');
  const requiredWiring = [
    'jarvis-context-engine-v1.js?',
    'jarvis-context-reference-authority-v1.js?',
    'jarvis-ebook-command-authority-v1.js?',
    'jarvis-ebook-search-authority-v2.js?',
    'jarvis-ebook-context-retention-v1.js?',
    'jarvis-ebook-ordinal-reader-race-fix-v1.js?',
    'jarvis-chain-book-ordinal-direct-v1.js?',
    'jarvis-map-ordinal-authority-v1.js?',
    'jarvis-chain-map-fast-select-v1.js?',
    'jarvis-image-shell-patch-v1.js?',
    'jarvis-engineering-spatial-command-center-patch-v1.js?',
    'jarvis-engineering-spatial-precision-patch-v1.js?',
    'jarvis-engineering-spatial-command-bridge-v1.js?'
  ];
  for (const marker of requiredWiring) {
    if (!html.includes(marker)) failures.push(`missing protected browser wiring: ${marker}`);
  }

  const browserSources = [...html.matchAll(/<script[^>]+src=["'](\.[^"']+)["'][^>]*>/gi)].map(m => m[1]);
  for (const src of browserSources) {
    const clean = src.split('?')[0].split('#')[0];
    if (/\.(?:js|css)$/i.test(clean) && !clean.startsWith('./src/') && !clean.includes('/assets/') && !/[?&]v=[^&#]+/i.test(src)) {
      failures.push(`protected browser asset missing cache-bust: ${src}`);
    }
  }
}

if (exists('workers/image-test/src/index.js')) {
  const worker = read('workers/image-test/src/index.js');
  if (!worker.includes('POST /api/enhance') && !worker.includes("pathname === '/api/enhance'")) {
    failures.push('Vision faithful Enhance endpoint wiring not found');
  }
  if (!worker.includes('/api/image')) failures.push('Vision generative endpoint wiring not found');
}

const contract = exists('JARVIS-REGRESSION-CONTRACT-20260915.md')
  ? read('JARVIS-REGRESSION-CONTRACT-20260915.md') : '';
for (const marker of [
  'Beowulf and open the 6th one',
  'History of English Literature from "Beowulf" to Swinburne',
  'Gutenberg id: `56613`',
  'faithful Enhance uses the dedicated `/api/enhance` endpoint',
  'Spatial Command Center Enter'
]) {
  if (!contract.includes(marker)) failures.push(`regression contract missing marker: ${marker}`);
}

console.log(`JARVIS regression contract: ${requiredFiles.length} protected files checked.`);

if (failures.length) {
  console.error('REGRESSION CONTRACT FAIL:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('REGRESSION CONTRACT PASS: protected files, browser wiring, cache-busts, and documented critical routes are present.');
