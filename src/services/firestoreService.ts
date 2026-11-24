import { User as FirebaseUser, signInWithPopup, signOut } from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { SEED_EARN_LINKS, SEED_GAMES } from '../data/seedCatalog';
import {
  ADMIN_BOOTSTRAP_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase';
import {
  EarnLinkItem,
  GameCategory,
  GameItem,
  LeaderboardEntry,
  TransactionItem,
  UserAccount,
  UserRole,
} from '../types/game';

const THIRTY_HOURS_MS = 30 * 60 * 60 * 1000;

export interface GamePayloadInput {
  title: string;
  coverUrl: string;
  category: GameCategory;
  genre: string;
  version: string;
  size: string;
  downloadUrl: string;
  review: string;
  installGuide: string[];
}

export interface EarnLinkPayloadInput {
  title: string;
  description: string;
  url: string;
  rewardPerPass: number;
  maxPasses: number;
  passCode: string;
}

export interface SiteMetaState {
  countdownEndTime: number;
  serverRevision: number;
  lastUpdatedAt: string;
  maintenanceActive: boolean;
  maintenanceEndTime: number;
  maintenanceMessage: string;
}

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '');
  return `${cleanPrefix}-${Date.now()}-${rand}`.slice(0, 120);
}

function sanitizeDocId(raw: unknown, fallbackPrefix: string): string {
  if (typeof raw === 'string') {
    const cleaned = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
    if (cleaned.length >= 1) return cleaned;
  }
  return makeSafeId(fallbackPrefix);
}

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string' && val.trim()) {
    return val;
  }
  return new Date().toISOString();
}

function isSafeUrl(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeGamePayload(input: GamePayloadInput): GamePayloadInput {
  const title = (input.title || '').trim().slice(0, 160) || 'Game mới';
  const rawCover = (input.coverUrl || '').trim().slice(0, 1000);
  const coverUrl = rawCover && isSafeUrl(rawCover) ? rawCover : '';
  const category: GameCategory = input.category === 'hack' ? 'hack' : 'normal';
  const genre = (input.genre || '').trim().slice(0, 60) || 'Hành động';
  const version = (input.version || '').trim().slice(0, 40) || 'v1.0.0';
  const size = (input.size || '').trim().slice(0, 40) || 'Chưa rõ';
  const rawDownload = (input.downloadUrl || '').trim().slice(0, 1000);
  const downloadUrl = isSafeUrl(rawDownload) ? rawDownload : 'https://taigamekid.vn';
  const review = (input.review || '').trim().slice(0, 10000);
  const installGuide = Array.isArray(input.installGuide)
    ? input.installGuide
        .filter((s): s is string => typeof s === 'string')
        .map((s) => s.trim().slice(0, 500))
        .filter(Boolean)
        .slice(0, 30)
    : [];

  return {
    title,
    coverUrl,
    category,
    genre,
    version,
    size,
    downloadUrl,
    review,
    installGuide,
  };
}

function sanitizeEarnLinkPayload(input: EarnLinkPayloadInput): EarnLinkPayloadInput {
  const title = (input.title || '').trim().slice(0, 160);
  if (!title) {
    throw new Error('Vui lòng nhập tên nhiệm vụ vượt link.');
  }
  const url = (input.url || '').trim().slice(0, 1000);
  if (!isSafeUrl(url)) {
    throw new Error('URL vượt link phải bắt đầu bằng http:// hoặc https://.');
  }
  const description = (input.description || '').trim().slice(0, 1000);
  const rewardRaw = Number(input.rewardPerPass);
  const rewardPerPass =
    Number.isFinite(rewardRaw) && rewardRaw >= 0
      ? Math.min(10_000_000, Math.floor(rewardRaw))
      : 0;
  const maxRaw = Number(input.maxPasses);
  const maxPasses =
    Number.isFinite(maxRaw) && maxRaw >= 1
      ? Math.min(100_000, Math.floor(maxRaw))
      : 1;
  const passCode = (input.passCode || '').trim().slice(0, 64);
  if (passCode.length < 2) {
    throw new Error('Mã xác nhận phải dài từ 2 đến 64 ký tự.');
  }

  return {
    title,
    description,
    url,
    rewardPerPass,
    maxPasses,
    passCode,
  };
}

export const FirestoreService = {
  async signInWithGoogle(): Promise<FirebaseUser> {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },

  async signOutUser(): Promise<void> {
    await signOut(auth);
  },

  async ensureUserProfile(firebaseUser: FirebaseUser): Promise<UserAccount> {
    const uid = firebaseUser.uid;
    const email = (firebaseUser.email || '').trim().slice(0, 160);
    const displayName =
      (firebaseUser.displayName || email.split('@')[0] || 'Thành viên').trim().slice(0, 80);
    const username = (email.split('@')[0] || uid.slice(0, 12)).slice(0, 40);

    const userRef = doc(db, 'users', uid);
    let snap;
    try {
      snap = await getDoc(userRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }

    let isListedAdmin = email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();
    if (!isListedAdmin) {
      try {
        const adminSnap = await getDoc(doc(db, 'admins', uid));
        isListedAdmin = adminSnap.exists();
      } catch {
        isListedAdmin = false;
      }
    }

    if (snap.exists()) {
      const data = snap.data();
      const role: UserRole =
        data.role === 'admin' || isListedAdmin ? 'admin' : 'user';
      return {
        id: uid,
        username,
        email: typeof data.email === 'string' ? data.email : email,
        displayName: typeof data.displayName === 'string' ? data.displayName : displayName,
        role,
        balance: typeof data.balance === 'number' ? Math.floor(data.balance) : 0,
        earnPasses:
          data.earnPasses && typeof data.earnPasses === 'object'
            ? (data.earnPasses as Record<string, number>)
            : {},
        transactions: [],
      };
    }

    const role: UserRole = isListedAdmin ? 'admin' : 'user';
    const batch = writeBatch(db);
    batch.set(userRef, {
      uid,
      email,
      displayName,
      role,
      balance: 0,
      completedTasks: 0,
      earnPasses: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'leaderboard', uid), {
      uid,
      displayName,
      balance: 0,
      completedTasks: 0,
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }

    return {
      id: uid,
      username,
      email,
      displayName,
      role,
      balance: 0,
      earnPasses: {},
      transactions: [],
    };
  },

  subscribeGames(onData: (games: GameItem[]) => void): () => void {
    const q = query(collection(db, 'games'), orderBy('updatedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: GameItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            title: String(data.title || ''),
            coverUrl: String(data.coverUrl || ''),
            category: data.category === 'hack' ? 'hack' : 'normal',
            genre: String(data.genre || 'Hành động'),
            version: String(data.version || 'v1.0.0'),
            size: String(data.size || 'Chưa rõ'),
            downloadUrl: String(data.downloadUrl || '#'),
            review: String(data.review || ''),
            installGuide: Array.isArray(data.installGuide)
              ? data.installGuide.filter((s): s is string => typeof s === 'string')
              : [],
            downloadsCount:
              typeof data.downloadsCount === 'number' && data.downloadsCount >= 0
                ? Math.floor(data.downloadsCount)
                : 0,
            updatedAt: toIsoString(data.updatedAt),
          };
        });
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'games');
      }
    );
  },

  subscribeEarnLinks(onData: (links: EarnLinkItem[]) => void): () => void {
    const q = query(collection(db, 'earnLinks'), orderBy('updatedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: EarnLinkItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            title: String(data.title || ''),
            description: String(data.description || ''),
            url: String(data.url || '#'),
            rewardPerPass:
              typeof data.rewardPerPass === 'number' ? Math.floor(data.rewardPerPass) : 0,
            maxPasses: typeof data.maxPasses === 'number' ? Math.floor(data.maxPasses) : 1,
            completedCount:
              typeof data.completedCount === 'number' ? Math.floor(data.completedCount) : 0,
            requiresCode: Boolean(data.requiresCode),
            updatedAt: toIsoString(data.updatedAt),
          };
        });
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'earnLinks');
      }
    );
  },

  subscribeAdminEarnLinkSecrets(onData: (codesById: Record<string, string>) => void): () => void {
    return onSnapshot(
      collection(db, 'earnLinkSecrets'),
      (snapshot) => {
        const codes: Record<string, string> = {};
        for (const d of snapshot.docs) {
          const data = d.data();
          if (typeof data.passCode === 'string') {
            codes[d.id] = data.passCode;
          }
        }
        onData(codes);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'earnLinkSecrets');
      }
    );
  },

  subscribeLeaderboard(onData: (entries: LeaderboardEntry[]) => void): () => void {
    const q = query(collection(db, 'leaderboard'), orderBy('balance', 'desc'), limit(10));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: LeaderboardEntry[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.uid || d.id),
            displayName: String(data.displayName || 'Thành viên'),
            balance: typeof data.balance === 'number' ? Math.floor(data.balance) : 0,
            completedTasks:
              typeof data.completedTasks === 'number' ? Math.floor(data.completedTasks) : 0,
          };
        });
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'leaderboard');
      }
    );
  },

  subscribeSiteMeta(onData: (meta: SiteMetaState | null) => void): () => void {
    const metaRef = doc(db, 'siteMeta', 'global');
    return onSnapshot(
      metaRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onData(null);
          return;
        }
        const data = snapshot.data();
        onData({
          countdownEndTime:
            typeof data.countdownEndTime === 'number'
              ? data.countdownEndTime
              : Date.now() + THIRTY_HOURS_MS,
          serverRevision:
            typeof data.serverRevision === 'number' ? Math.floor(data.serverRevision) : 1,
          lastUpdatedAt: toIsoString(data.lastUpdatedAt),
          maintenanceActive: Boolean(data.maintenanceActive),
          maintenanceEndTime:
            typeof data.maintenanceEndTime === 'number' && data.maintenanceEndTime > 0
              ? Math.floor(data.maintenanceEndTime)
              : 0,
          maintenanceMessage:
            typeof data.maintenanceMessage === 'string' ? data.maintenanceMessage : '',
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'siteMeta/global');
      }
    );
  },

  subscribeUserProfile(
    uid: string,
    email: string,
    onData: (profile: Partial<UserAccount>) => void
  ): () => void {
    const username = (email.split('@')[0] || uid.slice(0, 12)).slice(0, 40);
    return onSnapshot(
      doc(db, 'users', uid),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        onData({
          id: uid,
          username,
          email: typeof data.email === 'string' ? data.email : email,
          displayName: typeof data.displayName === 'string' ? data.displayName : username,
          role: data.role === 'admin' ? 'admin' : 'user',
          balance: typeof data.balance === 'number' ? Math.floor(data.balance) : 0,
          earnPasses:
            data.earnPasses && typeof data.earnPasses === 'object'
              ? (data.earnPasses as Record<string, number>)
              : {},
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      }
    );
  },

  subscribeUserTransactions(
    uid: string,
    onData: (transactions: TransactionItem[]) => void
  ): () => void {
    const q = query(
      collection(db, 'users', uid, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: TransactionItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            linkId: String(data.linkId || ''),
            linkTitle: String(data.linkTitle || 'Nhiệm vụ vượt link'),
            amount: typeof data.amount === 'number' ? Math.floor(data.amount) : 0,
            type: 'earn',
            createdAt: toIsoString(data.createdAt),
          };
        });
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/transactions`);
      }
    );
  },

  subscribeAdminUsersCount(onData: (count: number) => void): () => void {
    return onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        onData(Math.max(1, snapshot.size));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    );
  },

  async seedInitialCatalogIfEmpty(): Promise<boolean> {
    let gamesSnap;
    let linksSnap;
    let metaSnap;
    try {
      [gamesSnap, linksSnap, metaSnap] = await Promise.all([
        getDocs(query(collection(db, 'games'), limit(1))),
        getDocs(query(collection(db, 'earnLinks'), limit(1))),
        getDoc(doc(db, 'siteMeta', 'global')),
      ]);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'games');
    }

    const needGames = gamesSnap.empty;
    const needLinks = linksSnap.empty;
    const needMeta = !metaSnap.exists();
    if (!needGames && !needLinks && !needMeta) {
      return false;
    }

    const batch = writeBatch(db);
    if (needGames) {
      for (const g of SEED_GAMES) {
        batch.set(doc(db, 'games', g.id), {
          ...g,
          updatedAt: serverTimestamp(),
        });
      }
    }
    if (needLinks) {
      for (const link of SEED_EARN_LINKS) {
        const { passCode, ...publicFields } = link;
        batch.set(doc(db, 'earnLinks', link.id), {
          ...publicFields,
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, 'earnLinkSecrets', link.id), {
          linkId: link.id,
          passCode,
          updatedAt: serverTimestamp(),
        });
      }
    }
    if (needMeta) {
      batch.set(doc(db, 'siteMeta', 'global'), {
        countdownEndTime: Date.now() + THIRTY_HOURS_MS,
        serverRevision: 1,
        lastUpdatedAt: serverTimestamp(),
        maintenanceActive: false,
        maintenanceEndTime: 0,
        maintenanceMessage: '',
      });
    }

    try {
      await batch.commit();
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seedInitialCatalog');
    }
  },

  async recordGameDownload(gameId: string, currentDownloadsCount: number): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    try {
      await updateDoc(gameRef, {
        downloadsCount: Math.max(0, Math.floor(currentDownloadsCount)) + 1,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  },

  async claimEarnLink(
    uid: string,
    user: UserAccount,
    earnLink: EarnLinkItem,
    rawCode: string
  ): Promise<{ newBalance: number }> {
    const submittedCode = rawCode.trim().slice(0, 64);
    if (submittedCode.length < 2) {
      throw new Error('Mã xác nhận cần ít nhất 2 ký tự.');
    }

    const currentPassesMap = { ...(user.earnPasses || {}) };
    const currentLinkPasses = currentPassesMap[earnLink.id] || 0;
    if (currentLinkPasses >= earnLink.maxPasses) {
      throw new Error(`Bạn đã vượt tối đa ${earnLink.maxPasses}/${earnLink.maxPasses} lần cho link này.`);
    }

    const txId = makeSafeId('tx');
    const nextBalance = (user.balance || 0) + earnLink.rewardPerPass;
    const totalCompletedBefore = Object.values(currentPassesMap).reduce(
      (sum, count) => sum + (typeof count === 'number' && count > 0 ? count : 0),
      0
    );
    const nextCompletedTasks = totalCompletedBefore + 1;
    currentPassesMap[earnLink.id] = currentLinkPasses + 1;

    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid, 'transactions', txId), {
      id: txId,
      userId: uid,
      linkId: earnLink.id,
      linkTitle: earnLink.title.slice(0, 160),
      amount: earnLink.rewardPerPass,
      submittedCode,
      type: 'earn',
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users', uid), {
      balance: nextBalance,
      completedTasks: nextCompletedTasks,
      earnPasses: currentPassesMap,
      lastClaimTxId: txId,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'leaderboard', uid), {
      displayName: (user.displayName || 'Thành viên').slice(0, 80),
      balance: nextBalance,
      completedTasks: nextCompletedTasks,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'earnLinks', earnLink.id), {
      completedCount: Math.max(0, Math.floor(earnLink.completedCount || 0)) + 1,
    });

    try {
      await batch.commit();
      return { newBalance: nextBalance };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/transactions/${txId}`);
    }
  },

  async addGame(input: GamePayloadInput, currentRevision: number): Promise<void> {
    const cleaned = sanitizeGamePayload(input);
    const id = makeSafeId('game');
    const batch = writeBatch(db);
    batch.set(doc(db, 'games', id), {
      id,
      ...cleaned,
      downloadsCount: 0,
      updatedAt: serverTimestamp(),
    });
    batch.set(
      doc(db, 'siteMeta', 'global'),
      {
        countdownEndTime: Date.now() + THIRTY_HOURS_MS,
        serverRevision: Math.max(1, currentRevision + 1),
        lastUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `games/${id}`);
    }
  },

  async updateGame(
    gameId: string,
    input: GamePayloadInput,
    currentDownloadsCount: number,
    currentRevision: number
  ): Promise<void> {
    const cleaned = sanitizeGamePayload(input);
    const batch = writeBatch(db);
    batch.set(doc(db, 'games', gameId), {
      id: gameId,
      ...cleaned,
      downloadsCount: Math.max(0, Math.floor(currentDownloadsCount)),
      updatedAt: serverTimestamp(),
    });
    batch.set(
      doc(db, 'siteMeta', 'global'),
      {
        countdownEndTime: Date.now() + THIRTY_HOURS_MS,
        serverRevision: Math.max(1, currentRevision + 1),
        lastUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  },

  async deleteGame(gameId: string, currentRevision: number): Promise<void> {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'games', gameId));
    batch.set(
      doc(db, 'siteMeta', 'global'),
      {
        countdownEndTime: Date.now() + THIRTY_HOURS_MS,
        serverRevision: Math.max(1, currentRevision + 1),
        lastUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `games/${gameId}`);
    }
  },

  async addEarnLink(input: EarnLinkPayloadInput, currentRevision: number): Promise<void> {
    const cleaned = sanitizeEarnLinkPayload(input);
    const id = makeSafeId('earn');
    const batch = writeBatch(db);
    batch.set(doc(db, 'earnLinks', id), {
      id,
      title: cleaned.title,
      description: cleaned.description,
      url: cleaned.url,
      rewardPerPass: cleaned.rewardPerPass,
      maxPasses: cleaned.maxPasses,
      completedCount: 0,
      requiresCode: true,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'earnLinkSecrets', id), {
      linkId: id,
      passCode: cleaned.passCode,
      updatedAt: serverTimestamp(),
    });
    batch.set(
      doc(db, 'siteMeta', 'global'),
      {
        countdownEndTime: Date.now() + THIRTY_HOURS_MS,
        serverRevision: Math.max(1, currentRevision + 1),
        lastUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `earnLinks/${id}`);
    }
  },

  async updateEarnLink(
    linkId: string,
    input: EarnLinkPayloadInput,
    currentCompletedCount: number,
    currentRevision: number
  ): Promise<void> {
    const cleaned = sanitizeEarnLinkPayload(input);
    const batch = writeBatch(db);
    batch.set(doc(db, 'earnLinks', linkId), {
      id: linkId,
      title: cleaned.title,
      description: cleaned.description,
      url: cleaned.url,
      rewardPerPass: cleaned.rewardPerPass,
      maxPasses: cleaned.maxPasses,
      completedCount: Math.max(0, Math.floor(currentCompletedCount)),
      requiresCode: true,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'earnLinkSecrets', linkId), {
      linkId,
      passCode: cleaned.passCode,
      updatedAt: serverTimestamp(),
    });
    batch.set(
      doc(db, 'siteMeta', 'global'),
      {
        countdownEndTime: Date.now() + THIRTY_HOURS_MS,
        serverRevision: Math.max(1, currentRevision + 1),
        lastUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `earnLinks/${linkId}`);
    }
  },

  async deleteEarnLink(linkId: string, currentRevision: number): Promise<void> {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'earnLinks', linkId));
    batch.delete(doc(db, 'earnLinkSecrets', linkId));
    batch.set(
      doc(db, 'siteMeta', 'global'),
      {
        countdownEndTime: Date.now() + THIRTY_HOURS_MS,
        serverRevision: Math.max(1, currentRevision + 1),
        lastUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `earnLinks/${linkId}`);
    }
  },

  async resetServerCycle(currentRevision: number): Promise<void> {
    const metaRef = doc(db, 'siteMeta', 'global');
    try {
      const batch = writeBatch(db);
      batch.set(
        metaRef,
        {
          countdownEndTime: Date.now() + THIRTY_HOURS_MS,
          serverRevision: Math.max(1, currentRevision + 1),
          lastUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'siteMeta/global');
    }
  },

  async updateMaintenanceSettings(params: {
    active: boolean;
    endTimeMs: number;
    message: string;
    currentRevision: number;
    countdownEndTime: number;
  }): Promise<void> {
    const metaRef = doc(db, 'siteMeta', 'global');
    const cleanEnd =
      Number.isFinite(params.endTimeMs) && params.endTimeMs > 0
        ? Math.floor(params.endTimeMs)
        : 0;
    const cleanMsg = (params.message || '').trim().slice(0, 300);
    const safeCountdown =
      Number.isFinite(params.countdownEndTime) && params.countdownEndTime > 0
        ? Math.floor(params.countdownEndTime)
        : Date.now() + THIRTY_HOURS_MS;

    try {
      const batch = writeBatch(db);
      batch.set(
        metaRef,
        {
          countdownEndTime: safeCountdown,
          serverRevision: Math.max(1, params.currentRevision + 1),
          lastUpdatedAt: serverTimestamp(),
          maintenanceActive: Boolean(params.active),
          maintenanceEndTime: cleanEnd,
          maintenanceMessage: cleanMsg,
        },
        { merge: true }
      );
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'siteMeta/global');
    }
  },

  exportBackupJson(games: GameItem[], earnLinks: EarnLinkItem[]): string {
    return JSON.stringify(
      {
        app: 'taigamekid',
        version: 4,
        exportedAt: new Date().toISOString(),
        games,
        earnLinks,
      },
      null,
      2
    );
  },

  async importBackupJson(
    jsonText: string,
    existingGames: GameItem[],
    existingEarnLinks: EarnLinkItem[],
    currentRevision: number
  ): Promise<{ gamesCount: number; earnLinksCount: number }> {
    const parsed = JSON.parse(jsonText) as {
      games?: unknown;
      earnLinks?: unknown;
    };
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.games)) {
      throw new Error('Tệp JSON không hợp lệ hoặc thiếu danh sách game.');
    }

    const batch = writeBatch(db);
    for (const g of existingGames) {
      batch.delete(doc(db, 'games', g.id));
    }

    let gamesCount = 0;
    for (let i = 0; i < parsed.games.length && i < 150; i++) {
      const raw = parsed.games[i] as Record<string, unknown>;
      if (!raw || typeof raw !== 'object') continue;
      const id = sanitizeDocId(raw.id, `game-imp-${i}`);
      const cleaned = sanitizeGamePayload({
        title: typeof raw.title === 'string' ? raw.title : '',
        coverUrl: typeof raw.coverUrl === 'string' ? raw.coverUrl : '',
        category: raw.category === 'hack' ? 'hack' : 'normal',
        genre: typeof raw.genre === 'string' ? raw.genre : 'Hành động',
        version: typeof raw.version === 'string' ? raw.version : 'v1.0.0',
        size: typeof raw.size === 'string' ? raw.size : 'Chưa rõ',
        downloadUrl: typeof raw.downloadUrl === 'string' ? raw.downloadUrl : '#',
        review: typeof raw.review === 'string' ? raw.review : '',
        installGuide: Array.isArray(raw.installGuide)
          ? raw.installGuide.filter((s): s is string => typeof s === 'string')
          : [],
      });
      const downloadsCount =
        typeof raw.downloadsCount === 'number' && raw.downloadsCount >= 0
          ? Math.floor(raw.downloadsCount)
          : 0;
      batch.set(doc(db, 'games', id), {
        id,
        ...cleaned,
        downloadsCount,
        updatedAt: serverTimestamp(),
      });
      gamesCount += 1;
    }

    let earnLinksCount = 0;
    if (Array.isArray(parsed.earnLinks)) {
      for (const l of existingEarnLinks) {
        batch.delete(doc(db, 'earnLinks', l.id));
        batch.delete(doc(db, 'earnLinkSecrets', l.id));
      }

      for (let i = 0; i < parsed.earnLinks.length && i < 100; i++) {
        const raw = parsed.earnLinks[i] as Record<string, unknown>;
        if (!raw || typeof raw !== 'object') continue;
        const id = sanitizeDocId(raw.id, `earn-imp-${i}`);
        const passCodeRaw =
          typeof raw.passCode === 'string' && raw.passCode.trim().length >= 2
            ? raw.passCode.trim().slice(0, 64)
            : `KID${100 + i}`;
        try {
          const cleaned = sanitizeEarnLinkPayload({
            title: typeof raw.title === 'string' ? raw.title : 'Nhiệm vụ vượt link',
            description: typeof raw.description === 'string' ? raw.description : '',
            url: typeof raw.url === 'string' ? raw.url : 'https://taigamekid.vn',
            rewardPerPass: typeof raw.rewardPerPass === 'number' ? raw.rewardPerPass : 500,
            maxPasses: typeof raw.maxPasses === 'number' ? raw.maxPasses : 1,
            passCode: passCodeRaw,
          });
          const completedCount =
            typeof raw.completedCount === 'number' && raw.completedCount >= 0
              ? Math.floor(raw.completedCount)
              : 0;
          batch.set(doc(db, 'earnLinks', id), {
            id,
            title: cleaned.title,
            description: cleaned.description,
            url: cleaned.url,
            rewardPerPass: cleaned.rewardPerPass,
            maxPasses: cleaned.maxPasses,
            completedCount,
            requiresCode: true,
            updatedAt: serverTimestamp(),
          });
          batch.set(doc(db, 'earnLinkSecrets', id), {
            linkId: id,
            passCode: cleaned.passCode,
            updatedAt: serverTimestamp(),
          });
          earnLinksCount += 1;
        } catch {
          continue;
        }
      }
    }

    batch.set(
      doc(db, 'siteMeta', 'global'),
      {
        countdownEndTime: Date.now() + THIRTY_HOURS_MS,
        serverRevision: Math.max(1, currentRevision + 1),
        lastUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    try {
      await batch.commit();
      return { gamesCount, earnLinksCount };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'backupImport');
    }
  },
};
