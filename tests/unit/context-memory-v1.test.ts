import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const loadRuntime = () => {
  const listeners: Record<string, Function[]> = {};
  const storage = new Map<string, string>();
  const window: any = {
    addEventListener(type: string, fn: Function) { (listeners[type] ||= []).push(fn); },
    dispatchEvent(event: any) { for (const fn of listeners[event.type] || []) fn(event); return true; }
  };
  const CustomEvent = class { type: string; detail: any; constructor(type: string, init: any = {}) { this.type = type; this.detail = init.detail; } };
  const sessionStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key)
  };
  const context = vm.createContext({ window, document: {}, console, structuredClone, CustomEvent, sessionStorage });
  for (const file of ['jarvis-context-engine-v1.js', 'jarvis-context-memory-v1.js']) {
    const source = fs.readFileSync(path.resolve(file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  return context.window;
};

describe('JARVIS contextual entity memory', () => {
  it('canonicalizes rich place labels without changing the live engine result', () => {
    const jarvis: any = loadRuntime();
    const result = {
      name: 'Oishi Fresh | Fastfood Restaurant | Bhubaneswar',
      display: 'Dalma Lane',
      lat: 20.29,
      lon: 85.86
    };

    jarvis.jarvisContextEngine.set({
      domain: 'MAPS',
      results: [result],
      selected: result
    });

    expect(jarvis.jarvisContextEngine.get().selected.name).toBe(result.name);
    expect(jarvis.jarvisContextMemory.get().selected.name).toBe('Oishi Fresh');
    expect(jarvis.jarvisContextMemory.resolveReference('that one')).toMatchObject({
      matched: true,
      type: 'ENTITY',
      value: { name: 'Oishi Fresh' }
    });
  });

  it('stores the active domain and result set for reload-safe context', () => {
    const jarvis: any = loadRuntime();
    jarvis.jarvisContextEngine.set({
      domain: 'BOOKS',
      query: 'beowulf',
      results: [{ title: 'Beowulf' }],
      selected: { title: 'Beowulf' }
    });

    expect(jarvis.jarvisContextMemory.get()).toMatchObject({
      domain: 'BOOKS',
      query: 'beowulf',
      selected: { name: 'Beowulf' }
    });
    expect(jarvis.jarvisContextMemory.get().results[0].name).toBe('Beowulf');
  });
});
