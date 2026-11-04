/**
 * Browser-side local-first storage seam for Lost Legacies Live.
 *
 * This first adapter uses IndexedDB (native browser API), not SQLite.
 * It persists namespaced records and a durable outbox atomically.
 * It does not implement CRDT merging, server sync, signatures, or MCP.
 */

export const SOVEREIGN_CONTEXT_V1 = "https://lostlegacies.live/context/v1";

export const PROJECTS = [
  "juscr",
  "phoenixflies",
  "timeauction",
  "karenquest",
  "freforsall",
  "justusschool"
] as const;

export type SovereignProject = (typeof PROJECTS)[number];

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface SovereignJsonLd {
  "@context": string | Record<string, JsonValue>;
  "@type": string;
  [key: string]: JsonValue | string | Record<string, JsonValue>;
}

export interface SovereignRecord {
  id: string;
  project: SovereignProject;
  type: string;
  data: Record<string, JsonValue>;
  jsonld: SovereignJsonLd;
  updatedAt: string;
  identityDid?: string;
}

export interface SovereignOutboxOperation {
  operationId: string;
  recordId: string;
  project: SovereignProject;
  kind: "put";
  record: SovereignRecord;
  createdAt: string;
  status: "pending" | "synced";
}

interface SovereignDatabase extends IDBDatabase {
  // Structural marker only; IndexedDB stores are created in onupgradeneeded.
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateSovereignRecord(input: unknown): SovereignRecord {
  if (!isPlainObject(input)) throw new TypeError("record must be an object");
  const value = input as Record<string, unknown>;

  if (typeof value.id !== "string" || value.id.trim().length === 0 || value.id.length > 200) {
    throw new TypeError("record.id must be a non-empty string of at most 200 characters");
  }
  if (typeof value.project !== "string" || !PROJECTS.includes(value.project as SovereignProject)) {
    throw new TypeError("record.project is not a supported Lost Legacies Live segment");
  }
  if (typeof value.type !== "string" || value.type.trim().length === 0) {
    throw new TypeError("record.type must be a non-empty string");
  }
  if (!isPlainObject(value.data)) throw new TypeError("record.data must be a JSON object");
  if (!isPlainObject(value.jsonld)) throw new TypeError("record.jsonld must be an object");

  const jsonld = value.jsonld as Record<string, unknown>;
  if (
    !(typeof jsonld["@context"] === "string" || isPlainObject(jsonld["@context"])) ||
    typeof jsonld["@type"] !== "string" ||
    jsonld["@type"].trim().length === 0
  ) {
    throw new TypeError('record.jsonld requires "@context" and a non-empty "@type"');
  }

  if (value.identityDid !== undefined && typeof value.identityDid !== "string") {
    throw new TypeError("record.identityDid must be a string when provided");
  }

  // Validate JSON compatibility and reject cycles, BigInt, undefined, and non-finite numbers.
  const serialized = JSON.stringify(value.data);
  if (serialized === undefined) throw new TypeError("record.data is not JSON serializable");
  const data = JSON.parse(serialized) as Record<string, JsonValue>;

  const context = jsonld["@context"];
  const safeContext = typeof context === "string"
    ? context
    : JSON.parse(JSON.stringify(context)) as Record<string, JsonValue>;

  const safeJsonLd: SovereignJsonLd = {
    ...jsonld,
    "@context": safeContext,
    "@type": jsonld["@type"] as string
  } as SovereignJsonLd;

  return {
    id: value.id,
    project: value.project as SovereignProject,
    type: value.type,
    data,
    jsonld: safeJsonLd,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
    ...(typeof value.identityDid === "string" ? { identityDid: value.identityDid } : {})
  };
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  });
}

export class LocalSovereignStore {
  private readonly dbPromise: Promise<SovereignDatabase>;

  constructor(
    dbName = "lost-legacies-sovereign",
    private readonly indexedDb: IDBFactory | undefined =
      typeof indexedDB === "undefined" ? undefined : indexedDB
  ) {
    if (!indexedDb) throw new Error("IndexedDB is unavailable in this runtime");
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDb.open(dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("records")) {
          const records = db.createObjectStore("records", { keyPath: "id" });
          records.createIndex("by-project", "project", { unique: false });
          records.createIndex("by-identity", "identityDid", { unique: false });
        }
        if (!db.objectStoreNames.contains("outbox")) {
          const outbox = db.createObjectStore("outbox", { keyPath: "operationId" });
          outbox.createIndex("by-status", "status", { unique: false });
          outbox.createIndex("by-project", "project", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result as SovereignDatabase);
      request.onerror = () => reject(request.error ?? new Error("Unable to open local sovereign database"));
      request.onblocked = () => reject(new Error("Database upgrade is blocked by another open tab"));
    });
  }

  /**
   * Persist the record and its sync intent in one transaction.
   * Client timestamps are diagnostic metadata, never server authority.
   */
  async put(input: SovereignRecord): Promise<SovereignRecord> {
    const record = validateSovereignRecord(input);
    if (!record.jsonld["@context"]) record.jsonld["@context"] = SOVEREIGN_CONTEXT_V1;

    const db = await this.dbPromise;
    const transaction = db.transaction(["records", "outbox"], "readwrite");
    const records = transaction.objectStore("records");
    const outbox = transaction.objectStore("outbox");
    const operation: SovereignOutboxOperation = {
      operationId: crypto.randomUUID(),
      recordId: record.id,
      project: record.project,
      kind: "put",
      record,
      createdAt: new Date().toISOString(),
      status: "pending"
    };

    records.put(record);
    outbox.put(operation);
    await transactionDone(transaction);
    return record;
  }

  async get(id: string): Promise<SovereignRecord | undefined> {
    const db = await this.dbPromise;
    const transaction = db.transaction("records", "readonly");
    const result = await requestResult(transaction.objectStore("records").get(id)) as SovereignRecord | undefined;
    await transactionDone(transaction);
    return result;
  }

  async getByProject(project: SovereignProject): Promise<SovereignRecord[]> {
    const db = await this.dbPromise;
    const transaction = db.transaction("records", "readonly");
    const result = await requestResult(
      transaction.objectStore("records").index("by-project").getAll(project)
    ) as SovereignRecord[];
    await transactionDone(transaction);
    return result;
  }

  async getByIdentity(identityDid: string): Promise<SovereignRecord[]> {
    const db = await this.dbPromise;
    const transaction = db.transaction("records", "readonly");
    const result = await requestResult(
      transaction.objectStore("records").index("by-identity").getAll(identityDid)
    ) as SovereignRecord[];
    await transactionDone(transaction);
    return result;
  }

  async listPending(limit = 100): Promise<SovereignOutboxOperation[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new RangeError("limit must be an integer between 1 and 500");
    }
    const db = await this.dbPromise;
    const transaction = db.transaction("outbox", "readonly");
    const result = await requestResult(
      transaction.objectStore("outbox").index("by-status").getAll("pending", limit)
    ) as SovereignOutboxOperation[];
    await transactionDone(transaction);
    return result;
  }

  async markSynced(operationIds: string[]): Promise<void> {
    if (operationIds.length === 0) return;
    const db = await this.dbPromise;
    const transaction = db.transaction("outbox", "readwrite");
    const store = transaction.objectStore("outbox");
    for (const operationId of operationIds) {
      const operation = await requestResult(store.get(operationId)) as SovereignOutboxOperation | undefined;
      if (operation) store.put({ ...operation, status: "synced" });
    }
    await transactionDone(transaction);
  }

  async close(): Promise<void> {
    const db = await this.dbPromise;
    db.close();
  }
}
