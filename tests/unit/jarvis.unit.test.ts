import { beforeAll, describe, expect, test, vi } from 'vitest';

type JarvisModule = typeof import('../../src/jarvis');
let jarvis: JarvisModule;

beforeAll(async () => {
  vi.stubGlobal('document', {
    readyState: 'loading',
    addEventListener: vi.fn(),
  });
  jarvis = await import('../../src/jarvis');
});

describe('JARVIS command core', () => {
  const telemetry = {
    online: true,
    battery: 80,
    charging: false,
    memory: 20,
    cores: 8,
    network: 'wifi',
  };

  test('classifies the primary command families', () => {
    expect(jarvis.classifyCommand('what time is it')).toBe('time');
    expect(jarvis.classifyCommand('open maps')).toBe('maps');
    expect(jarvis.classifyCommand('find a video about SAP CPI')).toBe('media');
    expect(jarvis.classifyCommand('open REST client')).toBe('api');
    expect(jarvis.classifyCommand('connect to remote server')).toBe('remote');
    expect(jarvis.classifyCommand('search the internet for TypeScript')).toBe('search');
    expect(jarvis.classifyCommand('make a note to pay 10 rs to Deepak')).toBe('notes');
  });

  test('classifies local POI requests as Maps commands', () => {
    expect(jarvis.classifyCommand('show me restaurants in Saheed Nagar')).toBe('maps');
    expect(jarvis.classifyCommand('find hospitals near Jagannath Nagar')).toBe('maps');
    expect(jarvis.classifyCommand('show me cafes around Rasulgarh')).toBe('maps');
  });

  test('returns module actions without redirecting the application', () => {
    expect(jarvis.runCommand('open maps', telemetry)).toMatchObject({ intent: 'maps', value: 'maps' });
    expect(jarvis.runCommand('open API Lab', telemetry)).toMatchObject({ intent: 'api', value: 'api' });
    expect(jarvis.runCommand('play a video', telemetry)).toMatchObject({ intent: 'media', value: 'media' });
  });

  test('returns Maps for local POI requests', () => {
    const result = jarvis.runCommand('show me restaurants in Saheed Nagar', telemetry);
    expect(result).toMatchObject({ intent: 'maps', value: 'maps' });
    expect(result.reply).toContain('Opening Maps');
  });

  test('creates an actionable note from natural language', () => {
    const result = jarvis.runCommand('make a note to pay 10 rs to Deepak', telemetry);
    expect(result).toMatchObject({ intent: 'notes', value: 'notes' });
    expect(result.reply).toContain('pay 10 rs to Deepak');
  });

  test('keeps browser event commands safe in the Node test environment', () => {
    expect(jarvis.runCommand('weather in Bhubaneswar', telemetry)).toMatchObject({ intent: 'weather', value: 'weather' });
    expect(jarvis.runCommand('latest news', telemetry)).toMatchObject({ intent: 'web' });
  });

  test('reports telemetry through the status command', () => {
    const result = jarvis.runCommand('system diagnostics', telemetry);
    expect(result.intent).toBe('status');
    expect(result.reply).toContain('wifi');
    expect(result.reply).toContain('8 logical processors');
  });
});
