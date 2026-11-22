export type UserRole = 'admin' | 'user';
export type GameCategory = 'hack' | 'normal';

export const GAME_CATEGORY_LABELS: Record<GameCategory, string> = {
  hack: 'Mục 1: Hack',
  normal: 'Mục 2: Game thường',
};

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
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

export interface DataSavePayload {
  version: number;
  seeded: boolean;
  games: GameItem[];
  users: UserAccount[];
  countdownEndTime: number;
}

export interface BackupFileSchema {
  app: string;
  version: number;
  exportedAt: string;
  games: GameItem[];
  users?: UserAccount[];
}
