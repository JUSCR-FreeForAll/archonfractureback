export interface TickContext {
  /** Monotonic simulation tick; never derived from wall-clock time. */
  readonly tickId: bigint;
  /** Fixed simulation step in milliseconds. */
  readonly deltaMs: number;
}

export interface DeterministicSubsystem {
  readonly id: string;
  readonly priority?: number;
  update(context: TickContext): void;
  save(): unknown;
  restore(snapshot: unknown): void;
  /** Validate without mutating subsystem state. */
  validateSnapshot?(snapshot: unknown): boolean;
}

export interface SubsystemSnapshot {
  readonly subsystemId: string;
  readonly tickId: string;
  readonly schemaVersion: 1;
  readonly payload: unknown;
  readonly checksum: string;
}

export interface EngineConfig {
  readonly fixedDeltaMs: number;
  readonly maxFrameDeltaMs: number;
  readonly maxTicksPerFrame: number;
}

export interface AdvanceResult {
  readonly ticksRun: number;
  readonly tickId: bigint;
  readonly interpolationAlpha: number;
  readonly droppedFrameMs: number;
}
