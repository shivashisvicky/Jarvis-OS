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
  });

  test('returns module actions without redirecting the application', () => {
    expect(jarvis.runCommand('open maps', telemetry)).toMatchObject({ intent: 'maps', value: 'maps' });
    expect(jarvis.runCommand('open API Lab', telemetry)).toMatchObject({ intent: 'api', value: 'api' });
    expect(jarvis.runCommand('play a video', telemetry)).toMatchObject({ intent: 'media', value: 'media' });
  });

  test('reports telemetry through the status command', () => {
    const result = jarvis.runCommand('system diagnostics', telemetry);
    expect(result.intent).toBe('status');
    expect(result.reply).toContain('wifi');
    expect(result.reply).toContain('8 logical processors');
  });
});
