import { createHash } from "node:crypto";

/**
 * Canonical JSON for deterministic snapshots. Only JSON primitives, arrays,
 * and plain objects are accepted. Undefined, non-finite numbers, class
 * instances, cycles, bigint, functions, and symbols are rejected explicitly.
 */
export function canonicalStringify(value: unknown): string {
  const ancestors = new Set<object>();

  const encode = (input: unknown): string => {
    if (input === null) return "null";
    if (typeof input === "string" || typeof input === "boolean") return JSON.stringify(input);
    if (typeof input === "number") {
      if (!Number.isFinite(input)) throw new TypeError("snapshot numbers must be finite");
      return JSON.stringify(Object.is(input, -0) ? 0 : input);
    }
    if (typeof input !== "object") throw new TypeError(`unsupported snapshot value: ${typeof input}`);
    if (ancestors.has(input)) throw new TypeError("snapshot cannot contain circular references");
    ancestors.add(input);
    try {
      if (Array.isArray(input)) {
        return "[" + input.map((item) => encode(item)).join(",") + "]";
      }
      const prototype = Object.getPrototypeOf(input);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new TypeError("snapshot objects must be plain objects");
      }
      const record = input as Record<string, unknown>;
      const keys = Object.keys(record).sort();
      return "{" + keys.map((key) => {
        const item = record[key];
        if (item === undefined) throw new TypeError("snapshot cannot contain undefined values");
        return JSON.stringify(key) + ":" + encode(item);
      }).join(",") + "}";
    } finally {
      ancestors.delete(input);
    }
  };

  return encode(value);
}

export function checksumSnapshot(envelope: {
  subsystemId: string;
  tickId: string;
  schemaVersion: number;
  payload: unknown;
}): string {
  return createHash("sha256").update(canonicalStringify(envelope), "utf8").digest("hex");
}
