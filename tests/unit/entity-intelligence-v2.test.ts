import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

describe('JARVIS entity intelligence v2', () => {
  it('classifies a Gutenberg author as BOOK_AUTHOR even when Wikidata says PERSON', async () => {
    const window: any = { addEventListener() {}, __JARVIS_ENTITY_INTELLIGENCE_V2__: false };
    const document: any = { addEventListener() {} };
    const storage = new Map<string, string>();
    const sessionStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value)
    };
    const fetch = async (url: string) => ({
      ok: true,
      json: async () => url.includes('gutendex.com')
        ? { results: [{ title: 'The Dream of Gerontius', authors: [{ name: 'Newman, John Henry, 1801-1890' }] }] }
        : { search: [{ label: 'John Henry Newman', description: 'English cardinal and author' }] }
    });
    const context = vm.createContext({
      window,
      document,
      sessionStorage,
      fetch,
      AbortController,
      setTimeout,
      clearTimeout,
      console
    });

    const source = fs.readFileSync(path.resolve('jarvis-entity-intelligence-v2.js'), 'utf8');
    vm.runInContext(source, context, { filename: 'jarvis-entity-intelligence-v2.js' });

    await expect(window.jarvisEntityIntelligence.resolve('John Henry Newman')).resolves.toMatchObject({
      type: 'BOOK_AUTHOR',
      source: 'gutenberg',
      score: 0.97
    });
  });

  it('keeps an unrelated person from becoming a book author without Gutenberg author evidence', async () => {
    const window: any = { addEventListener() {}, __JARVIS_ENTITY_INTELLIGENCE_V2__: false };
    const document: any = { addEventListener() {} };
    const storage = new Map<string, string>();
    const sessionStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value)
    };
    const fetch = async (url: string) => ({
      ok: true,
      json: async () => url.includes('gutendex.com')
        ? { results: [{ title: 'A Biography of Alan Turing', authors: [{ name: 'Other Author' }] }] }
        : { search: [{ label: 'Alan Turing', description: 'English mathematician and computer scientist' }] }
    });
    const context = vm.createContext({
      window,
      document,
      sessionStorage,
      fetch,
      AbortController,
      setTimeout,
      clearTimeout,
      console
    });

    const source = fs.readFileSync(path.resolve('jarvis-entity-intelligence-v2.js'), 'utf8');
    vm.runInContext(source, context, { filename: 'jarvis-entity-intelligence-v2.js' });

    await expect(window.jarvisEntityIntelligence.resolve('Alan Turing')).resolves.toMatchObject({
      type: 'PERSON',
      source: 'wikidata'
    });
  });
});
