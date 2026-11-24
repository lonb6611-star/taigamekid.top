export type UserRole = 'admin' | 'user';
export type GameCategory = 'hack' | 'normal';

export const GAME_CATEGORY_LABELS: Record<GameCategory, string> = {
  hack: 'Mục 1: Hack',
  normal: 'Mục 2: Game thường',
};

export interface TransactionItem {
  id: string;
  linkId: string;
  linkTitle: string;
  amount: number;
  type: 'earn';
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  balance: number;
  completedTasks: number;
}

export interface UserAccount {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  role: UserRole;
  balance?: number;
  earnPasses?: Record<string, number>;
  transactions?: TransactionItem[];
}

export interface GameItem {
  id: string;
  title: string;
  coverUrl: string;
  category: GameCategory;
  genre: string;
  version: string;
  size: string;
  downloadUrl: string;
  review: string;
  installGuide: string[];
  updatedAt: string;
  downloadsCount: number;
}

export interface EarnLinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
  rewardPerPass: number;
  maxPasses: number;
  completedCount: number;
  requiresCode?: boolean;
  passCode?: string;
  updatedAt: string;
}

export interface ServerStateResponse {
  games: GameItem[];
  earnLinks: EarnLinkItem[];
  leaderboard?: LeaderboardEntry[];
  countdownEndTime: number;
  usersCount: number;
  serverRevision: number;
  lastUpdatedAt: string;
}

export interface BackupFileSchema {
  app: string;
  version: number;
  exportedAt: string;
  games: GameItem[];
  earnLinks?: EarnLinkItem[];
}
