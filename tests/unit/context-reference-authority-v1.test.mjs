import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadRuntime(engine = {
  active: true,
  domain: 'BOOKS',
  contextId: 'books-test',
  turn: 4,
  results: [{ title: 'Book One' }, { title: 'Book Two' }, { title: 'Book Three' }],
  selected: { title: 'Book One' },
}) {
  const listeners = {};
  const dispatched = [];
  const window = {
    jarvisContextEngine: { get: () => engine },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    dispatchEvent(event) {
      dispatched.push(event);
      for (const fn of listeners[event.type] || []) fn(event);
      return true;
    },
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
  };
  const document = {
    documentElement: {},
    body: {},
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
  class CustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  }
  const context = vm.createContext({
    window,
    document,
    console,
    CustomEvent,
    MutationObserver: class { observe() {} },
    HTMLElement: class {},
    HTMLInputElement: class {},
    HTMLFormElement: class {},
    CSS: { escape: value => value },
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
  return { window, dispatched };
}

describe('JARVIS context reference authority', () => {
  it('resolves book ordinals from the authoritative BOOKS result set', () => {
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

  it('accepts numeric and terminal-punctuation references', () => {
    const { window, dispatched } = loadRuntime();
    expect(window.jarvisContextReferenceAuthority.run('read result 3')).toBe(true);
    expect(window.jarvisContextReferenceAuthority.run('open the 2nd one.')).toBe(true);
    const followups = dispatched.filter(x => x.type === 'jarvis:context-followup');
    expect(followups).toHaveLength(2);
    expect(followups[0].detail.resolved.index).toBe(2);
    expect(followups[1].detail.resolved.index).toBe(1);
  });

  it('does not claim unrelated commands', () => {
    const { window, dispatched } = loadRuntime();
    expect(window.jarvisContextReferenceAuthority.run('find Beowulf')).toBe(false);
    expect(dispatched.filter(x => x.type === 'jarvis:context-followup')).toHaveLength(0);
  });

  it('does not let a BOOKS resolver claim a fresh MAPS context', () => {
    const { window, dispatched } = loadRuntime({
      active: true,
      domain: 'MAPS',
      contextId: 'maps-test',
      turn: 5,
      results: [{ name: 'One' }, { name: 'Two' }],
      selected: null,
    });
    expect(window.jarvisContextReferenceAuthority.run('open the second one')).toBe(true);
    expect(dispatched.filter(x => x.type === 'jarvis:context-followup')).toHaveLength(0);
  });
});
