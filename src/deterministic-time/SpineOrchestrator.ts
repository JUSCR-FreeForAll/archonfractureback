import { checksumSnapshot, canonicalStringify } from "./canonical.js";
import type { DeterministicSubsystem, SubsystemSnapshot, TickContext } from "./types.js";

export class SpineOrchestrator {
  private readonly subsystems: DeterministicSubsystem[];

  constructor(subsystems: DeterministicSubsystem[]) {
    const ids = new Set<string>();
    for (const subsystem of subsystems) {
      if (!subsystem.id.trim()) throw new Error("subsystem id is required");
      if (ids.has(subsystem.id)) throw new Error(`duplicate subsystem id: ${subsystem.id}`);
      ids.add(subsystem.id);
    }
    this.subsystems = [...subsystems].sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0) || a.id.localeCompare(b.id)
    );
  }

  tick(context: TickContext): void {
    for (const subsystem of this.subsystems) subsystem.update(context);
  }

  capture(tickId: bigint): SubsystemSnapshot[] {
    return this.subsystems.map((subsystem) => {
      const payload = subsystem.save();
      // Validate serializability now, rather than creating a snapshot that
      // cannot be compared or transported later.
      canonicalStringify(payload);
      const envelope = {
        subsystemId: subsystem.id,
        tickId: tickId.toString(),
        schemaVersion: 1 as const,
        payload
      };
      return { ...envelope, checksum: checksumSnapshot(envelope) };
    });
  }

  restoreAll(snapshots: SubsystemSnapshot[], expectedTickId: bigint): void {
    const expectedTick = expectedTickId.toString();
    if (snapshots.length !== this.subsystems.length) {
      throw new Error("snapshot set must contain every registered subsystem exactly once");
    }

    const byId = new Map<string, SubsystemSnapshot>();
    for (const snapshot of snapshots) {
      if (byId.has(snapshot.subsystemId)) throw new Error(`duplicate snapshot: ${snapshot.subsystemId}`);
      if (snapshot.tickId !== expectedTick) throw new Error("snapshot tick mismatch");
      if (snapshot.schemaVersion !== 1) throw new Error("unsupported snapshot schema version");
      const envelope = {
        subsystemId: snapshot.subsystemId,
        tickId: snapshot.tickId,
        schemaVersion: snapshot.schemaVersion,
        payload: snapshot.payload
      };
      if (checksumSnapshot(envelope) !== snapshot.checksum) {
        throw new Error(`snapshot checksum mismatch: ${snapshot.subsystemId}`);
      }
      byId.set(snapshot.subsystemId, snapshot);
    }

    for (const subsystem of this.subsystems) {
      const snapshot = byId.get(subsystem.id);
      if (!snapshot) throw new Error(`missing snapshot: ${subsystem.id}`);
      if (subsystem.validateSnapshot && !subsystem.validateSnapshot(snapshot.payload)) {
        throw new Error(`invalid snapshot payload: ${subsystem.id}`);
      }
    }

    // Validate the complete set before any mutation. Backups provide recovery
    // if an individual restore unexpectedly throws despite validation.
    const backups = this.subsystems.map((subsystem) => subsystem.save());
    try {
      for (const subsystem of this.subsystems) {
        subsystem.restore(byId.get(subsystem.id)!.payload);
      }
    } catch (error) {
      for (let i = 0; i < this.subsystems.length; i++) {
        try { this.subsystems[i].restore(backups[i]); } catch { /* preserve original failure */ }
      }
      throw error;
    }
  }
}
