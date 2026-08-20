import { describe, expect, it } from 'vitest';
import { createRuntimeAuthority, jarvisRuntime } from '../../jarvis-os-3-runtime.js';

describe('JARVIS OS 3 runtime authority', () => {
  it('exposes a single versioned runtime contract', () => {
    expect(jarvisRuntime.version).toBe('3.0.0-foundation');
    expect(jarvisRuntime.subsystems).toContain('media');
    expect(jarvisRuntime.subsystems).toContain('maps');
  });

  it('keeps subsystem transitions explicit', () => {
    let clock = 1000;
    const runtime = createRuntimeAuthority({ now: () => clock++ });

    expect(runtime.getState('media').state).toBe('idle');

    const loading = runtime.begin('media', { query: 'cats' });
    expect(loading.state).toBe('loading');
    expect(loading.meta.query).toBe('cats');

    const success = runtime.succeed('media', [{ id: 'cat-1' }], { provider: 'youtube' });
    expect(success.state).toBe('success');
    expect(success.data).toEqual([{ id: 'cat-1' }]);

    const degraded = runtime.degrade('media', [{ id: 'cat-1' }], 'Provider timeout', { provider: 'fallback' });
    expect(degraded.state).toBe('degraded');
    expect(degraded.error).toBe('Provider timeout');

    const error = runtime.fail('media', 'Network unavailable');
    expect(error.state).toBe('error');
    expect(error.error).toBe('Network unavailable');
  });

  it('never lets listener failures corrupt state transitions', () => {
    const runtime = createRuntimeAuthority();
    const snapshots: string[] = [];

    runtime.subscribe(() => {
      throw new Error('listener failure');
    });
    runtime.subscribe((snapshot) => snapshots.push(snapshot.state));

    runtime.begin('news');
    runtime.succeed('news', { headline: 'Live' });

    expect(snapshots).toEqual(['loading', 'success']);
    expect(runtime.getState('news').state).toBe('success');
  });

  it('rejects unknown subsystems', () => {
    const runtime = createRuntimeAuthority();
    expect(() => runtime.getState('unknown' as never)).toThrow('Unknown JARVIS subsystem');
  });
});
