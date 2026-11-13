import { describe, expect, it } from "vitest";
import { checksumSnapshot, canonicalStringify } from "../src/deterministic-time/canonical.js";
import { DeterministicTimeEngine } from "../src/deterministic-time/DeterministicTimeEngine.js";
import { SpineOrchestrator } from "../src/deterministic-time/SpineOrchestrator.js";
import type { DeterministicSubsystem } from "../src/deterministic-time/types.js";

class Counter implements DeterministicSubsystem {
  readonly id: string;
  readonly priority: number;
  value = 0;
  readonly seen: bigint[] = [];
  constructor(id: string, priority = 0) { this.id = id; this.priority = priority; }
  update(context: { tickId: bigint }): void { this.value++; this.seen.push(context.tickId); }
  save(): unknown { return { value: this.value }; }
  restore(snapshot: unknown): void { this.value = (snapshot as { value: number }).value; }
  validateSnapshot(snapshot: unknown): boolean {
    return typeof (snapshot as { value?: unknown })?.value === "number";
  }
}

describe("deterministic time engine", () => {
  it("uses a fixed step and monotonically increasing bigint ticks", () => {
    const counter = new Counter("counter");
    const engine = new DeterministicTimeEngine(new SpineOrchestrator([counter]), {
      fixedDeltaMs: 10, maxFrameDeltaMs: 100, maxTicksPerFrame: 10
    });
    expect(engine.advance(25).ticksRun).toBe(2);
    expect(engine.tickId).toBe(2n);
    expect(engine.advance(5).ticksRun).toBe(1);
    expect(counter.seen).toEqual([1n, 2n, 3n]);
  });

  it("caps work per frame while retaining backlog and bounding alpha", () => {
    const counter = new Counter("counter");
    const engine = new DeterministicTimeEngine(new SpineOrchestrator([counter]), {
      fixedDeltaMs: 10, maxFrameDeltaMs: 100, maxTicksPerFrame: 2
    });
    const result = engine.advance(55);
    expect(result.ticksRun).toBe(2);
    expect(result.interpolationAlpha).toBeLessThan(1);
    expect(engine.advance(0).ticksRun).toBe(2);
  });

  it("orders subsystem dispatch by priority then id", () => {
    const order: string[] = [];
    const make = (id: string, priority: number): DeterministicSubsystem => ({
      id, priority, update: () => order.push(id), save: () => ({}), restore: () => {}
    });
    new SpineOrchestrator([make("z", 1), make("b", 0), make("a", 0)]).tick({
      tickId: 1n, deltaMs: 10
    });
    expect(order).toEqual(["a", "b", "z"]);
  });

  it("hashes the complete snapshot envelope and detects tampering", () => {
    const envelope = { subsystemId: "counter", tickId: "4", schemaVersion: 1, payload: { b: 2, a: 1 } };
    const checksum = checksumSnapshot(envelope);
    expect(checksum).toBe(checksumSnapshot({ ...envelope, payload: { a: 1, b: 2 } }));
    expect(checksum).not.toBe(checksumSnapshot({ ...envelope, tickId: "5" }));
    expect(() => canonicalStringify({ value: undefined })).toThrow();
  });

  it("validates every snapshot before restoring and rejects corruption", () => {
    const counter = new Counter("counter");
    const spine = new SpineOrchestrator([counter]);
    counter.value = 9;
    const snapshots = spine.capture(3n);
    counter.value = 20;
    const corrupt = [{ ...snapshots[0], payload: { value: 1 } }];
    expect(() => spine.restoreAll(corrupt, 3n)).toThrow(/checksum/);
    expect(counter.value).toBe(20);
    spine.restoreAll(snapshots, 3n);
    expect(counter.value).toBe(9);
  });

  it("rejects duplicate subsystem IDs and invalid frame deltas", () => {
    expect(() => new SpineOrchestrator([new Counter("x"), new Counter("x")])).toThrow(/duplicate/);
    const engine = new DeterministicTimeEngine(new SpineOrchestrator([]));
    expect(() => engine.advance(Number.NaN)).toThrow(RangeError);
  });
});
