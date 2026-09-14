#!/usr/bin/env node

/**
 * JARVIS OS static sanity check.
 *
 * Intentionally read-only. It does not modify the repository, browser behavior,
 * deployment configuration, or runtime code. Run from the repository root:
 *
 *   node scripts/jarvis-sanity-check.mjs
 *
 * The checker focuses on cheap failures that are easy to introduce in the
 * current patch-heavy architecture: missing local assets, duplicate exact
 * script/style references, and known high-risk duplicated authority families.
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const indexPath = path.join(root, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('SANITY FAIL: index.html not found. Run from repository root.');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const refs = [...html.matchAll(/(?:src|href)=["'](\.[^"']+)["']/g)].map(m => m[1]);
const localRefs = refs.filter(ref => !ref.startsWith('./src/') && !ref.includes('://'));
const missing = [];

for (const ref of localRefs) {
  const clean = ref.split('?')[0].split('#')[0];
  const target = path.join(root, clean.replace(/^\.\//, ''));
  if (!fs.existsSync(target)) missing.push(ref);
}

const exactRefs = new Map();
for (const ref of refs) exactRefs.set(ref, (exactRefs.get(ref) || 0) + 1);
const duplicateExactRefs = [...exactRefs.entries()].filter(([, count]) => count > 1);

const warnings = [];
const scriptSrcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1].split('?')[0]);
const duplicateScriptFiles = [...new Set(scriptSrcs.filter((src, i) => scriptSrcs.indexOf(src) !== i))];
if (duplicateScriptFiles.length) {
  warnings.push(`duplicate script files: ${duplicateScriptFiles.join(', ')}`);
}

const authorityFamilies = [
  ['speech recognition release', /jarvis-speech-recognition-release-/i],
  ['command authority', /jarvis-command-authority/i],
  ['context engine', /jarvis-context-engine/i],
  ['map authority', /jarvis-map-absolute-authority|jarvis-map-ordinal-authority/i],
  ['ebook authority', /jarvis-ebook-command-authority|jarvis-ebook-authority-v2/i]
];

for (const [label, pattern] of authorityFamilies) {
  const matches = scriptSrcs.filter(src => pattern.test(src));
  if (matches.length > 1) {
    warnings.push(`${label}: ${matches.length} loaded files (${matches.join(', ')})`);
  }
}

console.log(`JARVIS sanity: ${refs.length} local/relative asset references inspected.`);

if (missing.length) {
  console.error('SANITY FAIL: missing referenced assets:');
  for (const ref of missing) console.error(`  - ${ref}`);
  process.exit(1);
}

if (duplicateExactRefs.length) {
  warnings.push(`duplicate exact asset references: ${duplicateExactRefs.map(([ref, count]) => `${ref} ×${count}`).join('; ')}`);
}

if (warnings.length) {
  console.warn('SANITY WARN:');
  for (const warning of warnings) console.warn(`  - ${warning}`);
  console.warn('Warnings are advisory. Investigate before refactoring a mature authority family.');
} else {
  console.log('SANITY PASS: no missing assets or duplicate authority references detected.');
}

process.exit(0);
