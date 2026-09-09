import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const loadChain = () => {
  const listeners: Record<string, Function[]> = {};
  const window: any = {
    __JARVIS_COMMAND_CHAIN_V1__: false,
    jarvisCommandAuthority: {
      route: (q: string) => {
        const s = q.toLowerCase();
        if (/restaurants?\s+in\s+/.test(s)) return { type: 'MAP_POI', owner: 'map' };
        if (/beowulf/.test(s)) return { type: 'BOOKS', owner: 'books' };
        if (/youtube|yt/.test(s)) return { type: 'YOUTUBE', owner: 'youtube' };
        return { type: 'SEARCH', owner: 'search' };
      }
    },
    addEventListener(type: string, fn: Function) { (listeners[type] ||= []).push(fn); },
    dispatchEvent(event: any) { for (const fn of listeners[event.type] || []) fn(event); return true; }
  };
  const document = {
    addEventListener() {},
    querySelector() { return null; }
  };
  const CustomEvent = class { type: string; detail: any; constructor(type: string, init: any = {}) { this.type = type; this.detail = init.detail; } };
  const context = vm.createContext({ window, document, CustomEvent, HTMLInputElement: class {}, HTMLFormElement: class {}, setTimeout, clearTimeout, console });
  const source = fs.readFileSync(path.resolve('jarvis-command-chain-v1.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'jarvis-command-chain-v1.js' });
  return context.window.jarvisCommandChain;
};

describe('JARVIS Chain of Command contract', () => {
  it('splits a map search followed by an ordinal action', () => {
    const chain: any = loadChain();
    const parsed = chain.parse('show me restaurants in Jagannath nagar and open the third one');
    expect(parsed.parts).toEqual([
      'show me restaurants in Jagannath nagar',
      'open the third one'
    ]);
    expect(parsed.routes[0].type).toBe('MAP_POI');
    expect(parsed.routes[1].type).toBe('CONTEXT_FOLLOWUP');
  });

  it('keeps book and media chains in their own domains', () => {
    const chain: any = loadChain();
    const book = chain.parse('find Beowulf then read the first one');
    const media = chain.parse('search YouTube for space news then play the first one');
    expect(book.routes.map((r: any) => r.type)).toEqual(['BOOKS', 'CONTEXT_FOLLOWUP']);
    expect(media.routes.map((r: any) => r.type)).toEqual(['YOUTUBE', 'CONTEXT_FOLLOWUP']);
  });

  it('does not treat a normal single command as a chain', () => {
    const chain: any = loadChain();
    expect(chain.parse('show me restaurants in Jagannath nagar')).toBeNull();
  });
});
