const PREFIX = "juscr";
const TOKEN = /^[a-z0-9_-]{1,80}$/i;

function assertToken(value: string, label: string): void {
  if (!TOKEN.test(value)) {
    throw new Error(`Invalid ${label}: use 1-80 letters, numbers, underscores, or hyphens`);
  }
}

export function storageKey(segment: string, module: string, key: string): string {
  assertToken(segment, "segment");
  assertToken(module, "module");
  if (!key || key.includes(":")) {
    throw new Error("Invalid storage key: key must be non-empty and must not contain ':'");
  }
  return `${PREFIX}:${segment.toLowerCase()}:${module.toLowerCase()}:${key}`;
}

export const localStore = {
  set<T>(segment: string, module: string, key: string, value: T): void {
    if (typeof localStorage === "undefined") {
      throw new Error("localStorage is unavailable in this runtime");
    }
    localStorage.setItem(storageKey(segment, module, key), JSON.stringify(value));
  },

  get<T>(segment: string, module: string, key: string): T | null {
    if (typeof localStorage === "undefined") {
      throw new Error("localStorage is unavailable in this runtime");
    }
    const raw = localStorage.getItem(storageKey(segment, module, key));
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error(`Stored value for ${segment}/${module}/${key} is not valid JSON`);
    }
  },

  remove(segment: string, module: string, key: string): void {
    if (typeof localStorage === "undefined") {
      throw new Error("localStorage is unavailable in this runtime");
    }
    localStorage.removeItem(storageKey(segment, module, key));
  }
};
