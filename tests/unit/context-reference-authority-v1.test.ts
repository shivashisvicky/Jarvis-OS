import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const loadRuntime = (overrides: Record<string, unknown> = {}) => {
  const listeners: Record<string, Function[]> = {};
  const dispatched: any[] = [];
  const clicked: string[] = [];
  const window: any = {
    jarvisContextEngine: {
      get: () => ({
        active: true,
        domain: 'BOOKS',
        contextId: 'books-test',
        turn: 4,
        results: [{ title: 'Book One' }, { title: 'Book Two' }, { title: 'Book Three' }],
        selected: { title: 'Book One' },
        ...((overrides.jarvisContextEngine as object) || {}),
      }),
    },
    addEventListener(type: string, fn: Function) { (listeners[type] ||= []).push(fn); },
    dispatchEvent(event: any) {
      dispatched.push(event);
      for (const fn of listeners[event.type] || []) fn(event);
      return true;
    },
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
  };

  const document: any = {
    documentElement: {},
    body: {},
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };

  const CustomEvent = class {
    type: string;
    detail: any;
    constructor(type: string, init: any = {}) { this.type = type; this.detail = init.detail; }
  };

  const context = vm.createContext({
    window,
    document,
    console,
    CustomEvent,
    MutationObserver: class { observe() {} },
    HTMLElement: class {},
    HTMLInputElement: class {},
    HTMLFormElement: class {},
    CSS: { escape: (value: string) => value },
    getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
    Date,
  });

  const source = fs.readFileSync(path.resolve('jarvis-context-reference-authority-v1.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'jarvis-context-reference-authority-v1.js' });
  return { window, dispatched, clicked };
};

describe('JARVIS context reference authority', () => {
  it('resolves first/second/third book ordinals from the authoritative BOOKS result set', () => {
    const { window, dispatched } = loadRuntime();

    expect(window.jarvisContextReferenceAuthority.run('open the second one')).toBe(true);

    const event = dispatched.find(x => x.type === 'jarvis:context-followup');
    expect(event?.detail?.resolved).toMatchObject({
      matched: true,
      index: 1,
      value: { title: 'Book Two' },
      domain: 'BOOKS',
    });
  });

  it('accepts numeric and terminal-punctuation references without changing ownership', () => {
    const { window, dispatched } = loadRuntime();

    expect(window.jarvisContextReferenceAuthority.run('read result 3')).toBe(true);
    expect(window.jarvisContextReferenceAuthority.run('open the 2nd one.')).toBe(true);

    const followups = dispatched.filter(x => x.type === 'jarvis:context-followup');
    expect(followups).toHaveLength(2);
    expect(followups[0].detail.resolved.index).toBe(2);
    expect(followups[1].detail.resolved.index).toBe(1);
  });

  it('does not claim unrelated commands as contextual references', () => {
    const { window, dispatched } = loadRuntime();

    expect(window.jarvisContextReferenceAuthority.run('find Beowulf')).toBe(false);
    expect(dispatched.filter(x => x.type === 'jarvis:context-followup')).toHaveLength(0);
  });

  it('keeps map ownership surface-specific when a map result card is available', () => {
    const mapCard = {
      click: () => {},
      getAttribute: () => '1',
    };
    const { window } = loadRuntime({
      jarvisContextEngine: {
        get: () => ({
          active: true,
          domain: 'MAPS',
          results: [{ name: 'One' }, { name: 'Two' }],
        }),
      },
    });

    window.jarvisContextReferenceAuthority.run('open the second one');
    expect(mapCard.getAttribute()).toBe('1');
  });
});
