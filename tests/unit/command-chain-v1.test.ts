import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const loadChain = () => {
  const window: any = {
    __JARVIS_COMMAND_CHAIN_V1__: false,
    jarvisCommandAuthority: {
      route: (q: string) => {
        const s = q.toLowerCase();
        if (/restaurants?\s+(?:in|near|around|at)\s+/.test(s)) return { type: 'MAP_POI', owner: 'map' };
        if (/beowulf|john henry newman/.test(s)) return { type: 'BOOKS', owner: 'books' };
        if (/youtube|yt/.test(s)) return { type: 'YOUTUBE', owner: 'youtube' };
        return { type: 'SEARCH', owner: 'search' };
      }
    },
    jarvisContextReferenceAuthority: { run: () => false }
  };
  const document = {
    addEventListener() {},
    querySelector() { return null; }
  };
  const CustomEvent = class {
    type: string;
    detail: any;
    constructor(type: string, init: any = {}) { this.type = type; this.detail = init.detail; }
  };
  const context = vm.createContext({
    window,
    document,
    CustomEvent,
    HTMLInputElement: class {},
    HTMLFormElement: class {},
    Event: class {},
    setTimeout,
    clearTimeout,
    console
  });
  const source = fs.readFileSync(path.resolve('jarvis-command-chain-v1.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'jarvis-command-chain-v1.js' });
  return context.window.jarvisCommandChain;
};

describe('JARVIS Chain of Command TEST contract', () => {
  it('keeps Maps ownership for a map search followed by an ordinal', () => {
    const chain: any = loadChain();
    const parsed = chain.parse('show me restaurants in Jagannath nagar and open the third one');
    expect(parsed.parts).toEqual([
      'show me restaurants in Jagannath nagar',
      'open the third one'
    ]);
    expect(parsed.routes[0].type).toBe('MAP_POI');
    expect(parsed.routes[1].type).toBe('CONTEXT_FOLLOWUP');
  });

  it('keeps Books ownership for book search followed by a reference', () => {
    const chain: any = loadChain();
    const parsed = chain.parse('find Beowulf then read the first one');
    expect(parsed.parts).toEqual(['find Beowulf', 'read the first one']);
    expect(parsed.routes[0].type).toBe('BOOKS');
    expect(parsed.routes[1].type).toBe('CONTEXT_FOLLOWUP');
  });

  it('keeps YouTube ownership for media search followed by playback', () => {
    const chain: any = loadChain();
    const parsed = chain.parse('search YouTube for space news then play the first one');
    expect(parsed.parts).toEqual(['search YouTube for space news', 'play the first one']);
    expect(parsed.routes[0].type).toBe('YOUTUBE');
    expect(parsed.routes[1].type).toBe('CONTEXT_FOLLOWUP');
  });

  it('does not classify a normal single command as a chain', () => {
    const chain: any = loadChain();
    expect(chain.parse('show me restaurants in Jagannath nagar')).toBeNull();
  });
});
