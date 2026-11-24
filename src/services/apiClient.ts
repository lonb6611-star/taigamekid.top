import {
  EarnLinkItem,
  GameCategory,
  GameItem,
  LeaderboardEntry,
  ServerStateResponse,
  TransactionItem,
  UserAccount,
} from '../types/game';

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

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Lỗi máy chủ (${res.status}).`);
  }
  return data;
}

function authHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export interface ServerSyncMeta {
  countdownEndTime: number;
  serverRevision: number;
  lastUpdatedAt: string;
}

export const ApiClient = {
  async fetchState(): Promise<ServerStateResponse> {
    const res = await fetch('/api/state', { cache: 'no-store' });
    return parseJsonResponse<ServerStateResponse>(res);
  },

  async fetchLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
    const res = await fetch('/api/leaderboard', { cache: 'no-store' });
    return parseJsonResponse<{ leaderboard: LeaderboardEntry[] }>(res);
  },

  async resetCountdown(): Promise<{ countdownEndTime: number }> {
    const res = await fetch('/api/countdown/reset', { method: 'POST' });
    return parseJsonResponse<{ countdownEndTime: number }>(res);
  },

  async triggerServerReset(token: string): Promise<ServerStateResponse> {
    const res = await fetch('/api/server/reset-update', {
      method: 'POST',
      headers: authHeaders(token),
    });
    return parseJsonResponse<ServerStateResponse>(res);
  },

  async login(
    username: string,
    password: string
  ): Promise<{ token: string; user: UserAccount }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return parseJsonResponse<{ token: string; user: UserAccount }>(res);
  },

  async register(
    username: string,
    displayName: string,
    password: string
  ): Promise<{ token: string; user: UserAccount }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName, password }),
    });
    return parseJsonResponse<{ token: string; user: UserAccount }>(res);
  },

  async fetchMe(token: string): Promise<{ user: UserAccount }> {
    const res = await fetch('/api/auth/me', {
      headers: authHeaders(token),
      cache: 'no-store',
    });
    return parseJsonResponse<{ user: UserAccount }>(res);
  },

  async restoreSession(): Promise<{
    authenticated: boolean;
    token?: string;
    user?: UserAccount;
  }> {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    return parseJsonResponse<{
      authenticated: boolean;
      token?: string;
      user?: UserAccount;
    }>(res);
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  async recordDownload(token: string, gameId: string): Promise<{ game: GameItem }> {
    const res = await fetch(`/api/games/${encodeURIComponent(gameId)}/download`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    return parseJsonResponse<{ game: GameItem }>(res);
  },

  async addGame(
    token: string,
    input: GamePayloadInput
  ): Promise<{ game: GameItem } & ServerSyncMeta> {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(input),
    });
    return parseJsonResponse<{ game: GameItem } & ServerSyncMeta>(res);
  },

  async updateGame(
    token: string,
    gameId: string,
    input: GamePayloadInput
  ): Promise<{ game: GameItem } & ServerSyncMeta> {
    const res = await fetch(`/api/games/${encodeURIComponent(gameId)}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(input),
    });
    return parseJsonResponse<{ game: GameItem } & ServerSyncMeta>(res);
  },

  async deleteGame(
    token: string,
    gameId: string
  ): Promise<{ ok: boolean } & ServerSyncMeta> {
    const res = await fetch(`/api/games/${encodeURIComponent(gameId)}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    return parseJsonResponse<{ ok: boolean } & ServerSyncMeta>(res);
  },

  async addEarnLink(
    token: string,
    input: EarnLinkPayloadInput
  ): Promise<{ earnLink: EarnLinkItem } & ServerSyncMeta> {
    const res = await fetch('/api/earn-links', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(input),
    });
    return parseJsonResponse<{ earnLink: EarnLinkItem } & ServerSyncMeta>(res);
  },

  async updateEarnLink(
    token: string,
    linkId: string,
    input: EarnLinkPayloadInput
  ): Promise<{ earnLink: EarnLinkItem } & ServerSyncMeta> {
    const res = await fetch(`/api/earn-links/${encodeURIComponent(linkId)}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(input),
    });
    return parseJsonResponse<{ earnLink: EarnLinkItem } & ServerSyncMeta>(res);
  },

  async deleteEarnLink(
    token: string,
    linkId: string
  ): Promise<{ ok: boolean } & ServerSyncMeta> {
    const res = await fetch(`/api/earn-links/${encodeURIComponent(linkId)}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    return parseJsonResponse<{ ok: boolean } & ServerSyncMeta>(res);
  },

  async fetchAdminEarnLinks(token: string): Promise<{ earnLinks: EarnLinkItem[] }> {
    const res = await fetch('/api/admin/earn-links', {
      headers: authHeaders(token),
      cache: 'no-store',
    });
    return parseJsonResponse<{ earnLinks: EarnLinkItem[] }>(res);
  },

  async completeEarnLink(
    token: string,
    linkId: string,
    code: string
  ): Promise<
    {
      earnLink: EarnLinkItem;
      balance: number;
      earnPasses: Record<string, number>;
      transactions: TransactionItem[];
    } & ServerSyncMeta
  > {
    const res = await fetch(`/api/earn-links/${encodeURIComponent(linkId)}/complete`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ code }),
    });
    return parseJsonResponse<
      {
        earnLink: EarnLinkItem;
        balance: number;
        earnPasses: Record<string, number>;
        transactions: TransactionItem[];
      } & ServerSyncMeta
    >(res);
  },

  async exportBackup(token: string): Promise<string> {
    const res = await fetch('/api/backup/export', {
      headers: authHeaders(token),
    });
    const data = await parseJsonResponse<unknown>(res);
    return JSON.stringify(data, null, 2);
  },

  async importBackup(
    token: string,
    jsonText: string
  ): Promise<
    {
      games: GameItem[];
      earnLinks: EarnLinkItem[];
      leaderboard?: LeaderboardEntry[];
      usersCount?: number;
    } & ServerSyncMeta
  > {
    const parsed = JSON.parse(jsonText) as {
      games?: unknown;
      earnLinks?: unknown;
      users?: unknown;
      adminBalance?: unknown;
      adminEarnPasses?: unknown;
      adminTransactions?: unknown;
    };
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.games)) {
      throw new Error('Tệp JSON không hợp lệ hoặc thiếu danh sách game.');
    }
    const res = await fetch('/api/backup/import', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        games: parsed.games,
        earnLinks: Array.isArray(parsed.earnLinks) ? parsed.earnLinks : undefined,
        users: Array.isArray(parsed.users) ? parsed.users : undefined,
        adminBalance:
          typeof parsed.adminBalance === 'number' ? parsed.adminBalance : undefined,
        adminEarnPasses:
          parsed.adminEarnPasses && typeof parsed.adminEarnPasses === 'object'
            ? parsed.adminEarnPasses
            : undefined,
        adminTransactions: Array.isArray(parsed.adminTransactions)
          ? parsed.adminTransactions
          : undefined,
      }),
    });
    return parseJsonResponse<
      {
        games: GameItem[];
        earnLinks: EarnLinkItem[];
        leaderboard?: LeaderboardEntry[];
        usersCount?: number;
      } & ServerSyncMeta
    >(res);
  },
};
