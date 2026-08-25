import { describe, expect, it, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const loadRuntime = () => {
  const window: any = { __JARVIS_ENTITY__: null, addEventListener() {} };
  const document: any = { addEventListener() {} };
  const context = vm.createContext({ window, document, console, structuredClone });
  for (const file of ['jarvis-context-engine-v1.js', 'jarvis-command-authority-v2.js']) {
    const source = fs.readFileSync(path.resolve(file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  return context.window;
};

describe('JARVIS contextual authority', () => {
  let jarvis: any;

  beforeEach(() => {
    jarvis = loadRuntime();
  });

  it('resolves ordinal result references from the active result set', () => {
    jarvis.jarvisContextEngine.set({
      domain: 'BOOKS',
      query: 'beowulf',
      results: [{ title: 'Beowulf' }, { title: 'Beowulf II' }, { title: 'Beowulf III' }]
    });

    expect(jarvis.jarvisContextEngine.resolveReference('the first one')).toMatchObject({
      matched: true,
      type: 'RESULT',
      index: 0,
      value: { title: 'Beowulf' }
    });
    expect(jarvis.jarvisContextEngine.resolveReference('second result')).toMatchObject({
      matched: true,
      type: 'RESULT',
      index: 1
    });
    expect(jarvis.jarvisContextEngine.resolveReference('number 3')).toMatchObject({
      matched: true,
      type: 'RESULT',
      index: 2
    });
  });

  it('keeps location references tied to the current map context', () => {
    jarvis.jarvisContextEngine.set({
      domain: 'MAPS',
      location: { name: 'Jagannath Nagar' },
      results: [{ name: 'Restaurant A' }]
    });

    expect(jarvis.jarvisContextEngine.resolveReference('there')).toMatchObject({
      matched: true,
      type: 'LOCATION',
      value: { name: 'Jagannath Nagar' }
    });
  });

  it('does not resolve references after context expiry', () => {
    jarvis.jarvisContextEngine.set({ domain: 'BOOKS', results: [{ title: 'Beowulf' }] });
    const originalNow = Date.now;
    Date.now = () => originalNow() + 10 * 60 * 1000 + 1;
    try {
      expect(jarvis.jarvisContextEngine.resolveReference('the first one')).toMatchObject({
        matched: false,
        reason: 'no_context'
      });
    } finally {
      Date.now = originalNow;
    }
  });

  it('preserves explicit map intent over contextual follow-up routing', () => {
    jarvis.jarvisContextEngine.set({
      domain: 'MAPS',
      location: { name: 'Jagannath Nagar' },
      results: []
    });

    expect(jarvis.jarvisCommandAuthority.route('show me restaurants there')).toMatchObject({
      type: 'MAP_POI',
      owner: 'jarvis-command-final-routing-v2.js'
    });
  });

  it('routes book result follow-ups through the book authority', () => {
    jarvis.jarvisContextEngine.set({
      domain: 'BOOKS',
      query: 'beowulf',
      results: [{ title: 'Beowulf' }]
    });

    expect(jarvis.jarvisCommandAuthority.route('open the first one')).toMatchObject({
      type: 'CONTEXT_FOLLOWUP',
      owner: 'jarvis-ebook-command-authority-v1.js',
      contextDomain: 'BOOKS'
    });
  });

  it('routes explicit web search without inheriting book context', () => {
    jarvis.jarvisContextEngine.set({ domain: 'BOOKS', query: 'beowulf', results: [{ title: 'Beowulf' }] });

    expect(jarvis.jarvisCommandAuthority.route('search the internet for beowulf')).toMatchObject({
      type: 'SEARCH',
      owner: 'search-runtime'
    });
  });
});
