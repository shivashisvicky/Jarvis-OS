export type JarvisSubsystem =
  | 'shell' | 'intelligence' | 'home' | 'news' | 'maps' | 'media' | 'games'
  | 'api-lab' | 'files' | 'sftp' | 'terminal' | 'notes' | 'settings';

export type JarvisRuntimeState = 'idle' | 'loading' | 'success' | 'empty' | 'degraded' | 'error';

export interface JarvisRuntimeSnapshot<T = unknown> {
  subsystem: JarvisSubsystem;
  state: JarvisRuntimeState;
  requestId: number;
  updatedAt: number;
  data: T | null;
  error: string | null;
  meta: Record<string, unknown>;
}

export interface JarvisRuntimeAuthority {
  version: string;
  subsystems: readonly JarvisSubsystem[];
  states: Map<JarvisSubsystem, JarvisRuntimeSnapshot>;
  getState(subsystem: JarvisSubsystem): JarvisRuntimeSnapshot;
  begin(subsystem: JarvisSubsystem, meta?: Record<string, unknown>): JarvisRuntimeSnapshot;
  succeed<T>(subsystem: JarvisSubsystem, data: T | null, meta?: Record<string, unknown>): JarvisRuntimeSnapshot<T>;
  degrade<T>(subsystem: JarvisSubsystem, data?: T | null, error?: unknown, meta?: Record<string, unknown>): JarvisRuntimeSnapshot<T>;
  fail(subsystem: JarvisSubsystem, error: unknown, meta?: Record<string, unknown>): JarvisRuntimeSnapshot;
  reset(subsystem: JarvisSubsystem): JarvisRuntimeSnapshot;
  subscribe(listener: (snapshot: JarvisRuntimeSnapshot) => void): () => boolean;
}

export interface JarvisRuntimeOptions {
  now?: () => number;
}

export function createRuntimeAuthority(options?: JarvisRuntimeOptions): JarvisRuntimeAuthority;

export const jarvisRuntime: {
  version: string;
  subsystems: readonly JarvisSubsystem[];
  create: typeof createRuntimeAuthority;
};
