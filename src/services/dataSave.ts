import { INITIAL_SEED_GAMES } from '../data/seedGames';
import { BackupFileSchema, DataSavePayload, GameCategory, GameItem, UserAccount } from '../types/game';

const LS_KEY = 'taigamekid_datasave_v1';
const LS_SESSION_KEY = 'taigamekid_session_v1';
const IDB_NAME = 'taigamekid_db';
const IDB_VERSION = 1;
const IDB_STORE = 'datasave';
const IDB_RECORD_KEY = 'primary_state';
const COUNTDOWN_DURATION_MS = 30 * 60 * 60 * 1000; // 30 hours in ms

export const DEFAULT_ADMIN_USER: UserAccount = {
  id: 'user-admin-root',
  username: 'admin',
  password: 'admin',
  displayName: 'Quản trị viên',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const SEED_CATEGORY_BY_ID = new Map<string, GameCategory>(
  INITIAL_SEED_GAMES.map((g) => [g.id, g.category])
);

function normalizeCategory(raw: unknown, id?: string): GameCategory {
  if (raw === 'hack' || raw === 'normal') return raw;
  if (id && SEED_CATEGORY_BY_ID.has(id)) {
    return SEED_CATEGORY_BY_ID.get(id)!;
  }
  return 'normal';
}

function normalizeGames(games: GameItem[]): GameItem[] {
  return games.map((g) => ({
    ...g,
    category: normalizeCategory(g.category, g.id),
  }));
}

function createDefaultState(): DataSavePayload {
  return {
    version: 1,
    seeded: true,
    games: [...INITIAL_SEED_GAMES],
    users: [DEFAULT_ADMIN_USER],
    countdownEndTime: Date.now() + COUNTDOWN_DURATION_MS,
  };
}

function ensureAdminAccount(users: UserAccount[]): UserAccount[] {
  const hasAdmin = users.some((u) => u.username.toLowerCase() === 'admin');
  if (hasAdmin) {
    return users;
  }
  return [DEFAULT_ADMIN_USER, ...users];
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function readFromIndexedDB(): Promise<DataSavePayload | null> {
  try {
    const db = await openDatabase();
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_RECORD_KEY);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as DataSavePayload) ?? null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

async function writeToIndexedDB(payload: DataSavePayload): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(payload, IDB_RECORD_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // LocalStorage remains intact as fallback
  }
}

function readFromLocalStorage(): DataSavePayload | null {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DataSavePayload>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.games) || !Array.isArray(parsed.users)) return null;

    return {
      version: parsed.version ?? 1,
      seeded: parsed.seeded ?? true,
      games: normalizeGames(parsed.games),
      users: ensureAdminAccount(parsed.users),
      countdownEndTime:
        typeof parsed.countdownEndTime === 'number' && parsed.countdownEndTime > Date.now()
          ? parsed.countdownEndTime
          : Date.now() + COUNTDOWN_DURATION_MS,
    };
  } catch {
    return null;
  }
}

function writeToLocalStorage(payload: DataSavePayload): void {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {
    // IndexedDB still stores full payload even if localStorage quota is exceeded
  }
}

export const DataSave = {
  /**
   * Fast synchronous boot state from LocalStorage, or initial seed on very first visit.
   */
  loadInitialSync(): DataSavePayload {
    const fromLS = readFromLocalStorage();
    if (fromLS) {
      return fromLS;
    }
    const fresh = createDefaultState();
    writeToLocalStorage(fresh);
    void writeToIndexedDB(fresh);
    return fresh;
  },

  /**
   * Async hydration from IndexedDB to guarantee durability even if LocalStorage was cleared or quota exceeded.
   */
  async hydrateFromDurableStore(): Promise<DataSavePayload> {
    const fromLS = readFromLocalStorage();
    const fromIDB = await readFromIndexedDB();

    if (fromIDB && fromIDB.seeded) {
      const normalized: DataSavePayload = {
        ...fromIDB,
        users: ensureAdminAccount(fromIDB.users || []),
        games: Array.isArray(fromIDB.games) ? normalizeGames(fromIDB.games) : [],
        countdownEndTime:
          typeof fromIDB.countdownEndTime === 'number' && fromIDB.countdownEndTime > Date.now()
            ? fromIDB.countdownEndTime
            : Date.now() + COUNTDOWN_DURATION_MS,
      };
      // Keep LocalStorage synchronized
      writeToLocalStorage(normalized);
      return normalized;
    }

    if (fromLS) {
      await writeToIndexedDB(fromLS);
      return fromLS;
    }

    const fresh = createDefaultState();
    writeToLocalStorage(fresh);
    await writeToIndexedDB(fresh);
    return fresh;
  },

  async saveState(payload: DataSavePayload): Promise<void> {
    const normalized: DataSavePayload = {
      ...payload,
      seeded: true,
      games: normalizeGames(payload.games),
      users: ensureAdminAccount(payload.users),
    };
    writeToLocalStorage(normalized);
    await writeToIndexedDB(normalized);
  },

  loadSessionUserId(): string | null {
    try {
      return window.localStorage.getItem(LS_SESSION_KEY);
    } catch {
      return null;
    }
  },

  saveSessionUserId(userId: string | null): void {
    try {
      if (userId) {
        window.localStorage.setItem(LS_SESSION_KEY, userId);
      } else {
        window.localStorage.removeItem(LS_SESSION_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  },

  createBackupBlob(state: DataSavePayload): string {
    const backup: BackupFileSchema = {
      app: 'taigamekid',
      version: 1,
      exportedAt: new Date().toISOString(),
      games: state.games,
      users: state.users,
    };
    return JSON.stringify(backup, null, 2);
  },

  parseAndValidateBackup(jsonText: string, currentState: DataSavePayload): DataSavePayload {
    const parsed = JSON.parse(jsonText) as Partial<BackupFileSchema>;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.games)) {
      throw new Error('Tệp JSON không hợp lệ hoặc thiếu danh sách game.');
    }

    const sanitizedGames: GameItem[] = parsed.games
      .filter((g) => g && typeof g.title === 'string' && g.title.trim().length > 0)
      .map((g, idx) => {
        const rawGuide: unknown = g.installGuide;
        const installGuide = Array.isArray(rawGuide)
          ? rawGuide.map(String).filter(Boolean)
          : typeof rawGuide === 'string'
            ? rawGuide
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

        const id = typeof g.id === 'string' && g.id ? g.id : `game-imported-${Date.now()}-${idx}`;
        return {
          id,
          title: String(g.title).trim(),
          coverUrl: typeof g.coverUrl === 'string' ? g.coverUrl.trim() : '',
          category: normalizeCategory(g.category, id),
          genre: typeof g.genre === 'string' && g.genre.trim() ? g.genre.trim() : 'Hành động',
          version: typeof g.version === 'string' && g.version.trim() ? g.version.trim() : 'v1.0.0',
          size: typeof g.size === 'string' && g.size.trim() ? g.size.trim() : 'Chưa rõ',
          downloadUrl: typeof g.downloadUrl === 'string' ? g.downloadUrl.trim() : '#',
          review: typeof g.review === 'string' ? g.review : '',
          installGuide,
          updatedAt: typeof g.updatedAt === 'string' ? g.updatedAt : new Date().toISOString(),
          downloadsCount: typeof g.downloadsCount === 'number' ? g.downloadsCount : 0,
        };
      });

    const importedUsers = Array.isArray(parsed.users) ? parsed.users : currentState.users;

    return {
      ...currentState,
      seeded: true,
      games: sanitizedGames,
      users: ensureAdminAccount(importedUsers),
    };
  },
};
