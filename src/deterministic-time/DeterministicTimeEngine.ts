import { SpineOrchestrator } from "./SpineOrchestrator.js";
import type { AdvanceResult, EngineConfig } from "./types.js";

const DEFAULT_CONFIG: EngineConfig = {
  fixedDeltaMs: 1000 / 60,
  maxFrameDeltaMs: 250,
  maxTicksPerFrame: 8
};

export class DeterministicTimeEngine {
  private readonly config: EngineConfig;
  private accumulatorMs = 0;
  private currentTick = 0n;

  constructor(private readonly spine: SpineOrchestrator, config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (!Number.isFinite(this.config.fixedDeltaMs) || this.config.fixedDeltaMs <= 0) {
      throw new RangeError("fixedDeltaMs must be finite and greater than zero");
    }
    if (!Number.isFinite(this.config.maxFrameDeltaMs) || this.config.maxFrameDeltaMs <= 0) {
      throw new RangeError("maxFrameDeltaMs must be finite and greater than zero");
    }
    if (!Number.isInteger(this.config.maxTicksPerFrame) || this.config.maxTicksPerFrame < 1) {
      throw new RangeError("maxTicksPerFrame must be a positive integer");
    }
  }

  get tickId(): bigint { return this.currentTick; }

  advance(frameDeltaMs: number): AdvanceResult {
    if (!Number.isFinite(frameDeltaMs) || frameDeltaMs < 0) {
      throw new RangeError("frameDeltaMs must be finite and non-negative");
    }
    const acceptedDelta = Math.min(frameDeltaMs, this.config.maxFrameDeltaMs);
    const droppedFrameMs = frameDeltaMs - acceptedDelta;
    this.accumulatorMs += acceptedDelta;

    let ticksRun = 0;
    while (
      this.accumulatorMs >= this.config.fixedDeltaMs &&
      ticksRun < this.config.maxTicksPerFrame
    ) {
      const nextTick = this.currentTick + 1n;
      this.spine.tick(Object.freeze({
        tickId: nextTick,
        deltaMs: this.config.fixedDeltaMs
      }));
      this.currentTick = nextTick;
      this.accumulatorMs -= this.config.fixedDeltaMs;
      ticksRun++;
    }

    // Keep alpha in [0, 1). Any remaining backlog is retained for later frames.
    const interpolationAlpha = Math.min(
      Math.max(this.accumulatorMs / this.config.fixedDeltaMs, 0),
      1 - Number.EPSILON
    );
    return {
      ticksRun,
      tickId: this.currentTick,
      interpolationAlpha,
      droppedFrameMs
    };
  }

  reset(tickId = 0n): void {
    if (tickId < 0n) throw new RangeError("tickId cannot be negative");
    this.currentTick = tickId;
    this.accumulatorMs = 0;
  }
}
