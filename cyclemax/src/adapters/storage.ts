// StorageAdapter: Web = IndexedDB, Native = @capacitor/preferences. Same interface everywhere.

export interface StorageAdapter {
  readonly kind: "indexeddb" | "preferences" | "memory";
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

const DB_NAME = "cyclemax";
const STORE = "kv";

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function createIndexedDbStorage(factory: IDBFactory = indexedDB): StorageAdapter {
  let dbPromise: Promise<IDBDatabase> | null = null;
  const db = () => {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const open = factory.open(DB_NAME, 1);
        open.onupgradeneeded = () => open.result.createObjectStore(STORE);
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error);
      });
    }
    return dbPromise;
  };
  const tx = async (mode: IDBTransactionMode) => (await db()).transaction(STORE, mode).objectStore(STORE);
  return {
    kind: "indexeddb",
    async get<T>(key: string) {
      return (await request((await tx("readonly")).get(key))) as T | undefined;
    },
    async set<T>(key: string, value: T) {
      await request((await tx("readwrite")).put(value, key));
    },
    async remove(key) {
      await request((await tx("readwrite")).delete(key));
    },
    async clear() {
      await request((await tx("readwrite")).clear());
    },
  };
}

/** Minimal surface of @capacitor/preferences used here (mockable in tests). */
export interface PreferencesLike {
  get(o: { key: string }): Promise<{ value: string | null }>;
  set(o: { key: string; value: string }): Promise<void>;
  remove(o: { key: string }): Promise<void>;
  clear(): Promise<void>;
}

export function createPreferencesStorage(prefs: PreferencesLike): StorageAdapter {
  return {
    kind: "preferences",
    async get<T>(key: string) {
      const { value } = await prefs.get({ key });
      return value == null ? undefined : (JSON.parse(value) as T);
    },
    async set<T>(key: string, value: T) {
      await prefs.set({ key, value: JSON.stringify(value) });
    },
    async remove(key) {
      await prefs.remove({ key });
    },
    async clear() {
      await prefs.clear();
    },
  };
}

export function createMemoryStorage(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    kind: "memory",
    async get<T>(key: string) {
      const v = map.get(key);
      return v === undefined ? undefined : (JSON.parse(v) as T);
    },
    async set<T>(key: string, value: T) {
      map.set(key, JSON.stringify(value));
    },
    async remove(key) {
      map.delete(key);
    },
    async clear() {
      map.clear();
    },
  };
}
