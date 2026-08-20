/**
 * JARVIS OS 3 Runtime Authority
 *
 * This module is deliberately small. It defines the stable contract that
 * future apps/providers use instead of creating parallel DOM/runtime owners.
 */

const RUNTIME_VERSION = '3.0.0-foundation';

const VALID_STATES = Object.freeze([
  'idle',
  'loading',
  'success',
  'empty',
  'degraded',
  'error',
]);

const SUBSYSTEMS = Object.freeze([
  'shell',
  'intelligence',
  'home',
  'news',
  'maps',
  'media',
  'games',
  'api-lab',
  'files',
  'sftp',
  'terminal',
  'notes',
  'settings',
]);

function createInitialState(subsystem) {
  if (!SUBSYSTEMS.includes(subsystem)) {
    throw new Error(`Unknown JARVIS subsystem: ${subsystem}`);
  }

  return {
    subsystem,
    state: 'idle',
    requestId: 0,
    updatedAt: Date.now(),
    data: null,
    error: null,
    meta: {},
  };
}

function transition(current, next) {
  if (!VALID_STATES.includes(next.state)) {
    throw new Error(`Invalid JARVIS runtime state: ${next.state}`);
  }

  return Object.freeze({
    ...current,
    ...next,
    updatedAt: Date.now(),
  });
}

export function createRuntimeAuthority({ now = () => Date.now() } = {}) {
  const listeners = new Set();
  const states = new Map(SUBSYSTEMS.map((name) => [name, createInitialState(name)]));
  let requestSequence = 0;

  const emit = (snapshot) => {
    for (const listener of listeners) {
      try {
        listener(snapshot);
      } catch {
        // Listener failures must never break runtime state transitions.
      }
    }
  };

  const getState = (subsystem) => {
    if (!states.has(subsystem)) {
      throw new Error(`Unknown JARVIS subsystem: ${subsystem}`);
    }
    return states.get(subsystem);
  };

  const setState = (subsystem, next) => {
    const current = getState(subsystem);
    const snapshot = transition(current, {
      ...next,
      updatedAt: now(),
    });
    states.set(subsystem, snapshot);
    emit(snapshot);
    return snapshot;
  };

  const begin = (subsystem, meta = {}) => {
    const requestId = ++requestSequence;
    return setState(subsystem, {
      state: 'loading',
      requestId,
      data: null,
      error: null,
      meta,
    });
  };

  const succeed = (subsystem, data, meta = {}) =>
    setState(subsystem, {
      state: data == null ? 'empty' : 'success',
      data: data ?? null,
      error: null,
      meta,
    });

  const degrade = (subsystem, data = null, error = null, meta = {}) =>
    setState(subsystem, {
      state: 'degraded',
      data,
      error: error ? String(error) : null,
      meta,
    });

  const fail = (subsystem, error, meta = {}) =>
    setState(subsystem, {
      state: 'error',
      data: null,
      error: error ? String(error) : 'Unknown error',
      meta,
    });

  const reset = (subsystem) => setState(subsystem, createInitialState(subsystem));

  return Object.freeze({
    version: RUNTIME_VERSION,
    subsystems: SUBSYSTEMS,
    states,
    getState,
    begin,
    succeed,
    degrade,
    fail,
    reset,
    subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('JARVIS runtime listener must be a function');
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
}

export const jarvisRuntime = Object.freeze({
  version: RUNTIME_VERSION,
  subsystems: SUBSYSTEMS,
  create: createRuntimeAuthority,
});
