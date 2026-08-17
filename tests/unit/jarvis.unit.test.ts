import { describe, expect, test } from 'vitest';
import { classifyCommand, runCommand } from '../../src/jarvis';

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
    expect(classifyCommand('what time is it')).toBe('time');
    expect(classifyCommand('open maps')).toBe('maps');
    expect(classifyCommand('find videos about SAP CPI')).toBe('media');
    expect(classifyCommand('open REST client')).toBe('api');
    expect(classifyCommand('connect to remote server')).toBe('remote');
    expect(classifyCommand('search the internet for TypeScript')).toBe('search');
  });

  test('returns module actions without redirecting the application', () => {
    expect(runCommand('open maps', telemetry)).toMatchObject({ intent: 'maps', value: 'maps' });
    expect(runCommand('open API Lab', telemetry)).toMatchObject({ intent: 'api', value: 'api' });
    expect(runCommand('open media', telemetry)).toMatchObject({ intent: 'media', value: 'media' });
  });

  test('reports telemetry through the status command', () => {
    const result = runCommand('system diagnostics', telemetry);
    expect(result.intent).toBe('status');
    expect(result.reply).toContain('wifi');
    expect(result.reply).toContain('8 logical processors');
  });
});
