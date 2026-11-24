import 'dotenv/config';
import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';

type UserRole = 'admin' | 'user';
type GameCategory = 'hack' | 'normal';

interface TransactionItem {
  id: string;
  linkId: string;
  linkTitle: string;
  amount: number;
  type: 'earn';
  createdAt: string;
}

interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  passwordHash: string;
  balance?: number;
  earnPasses?: Record<string, number>;
  transactions?: TransactionItem[];
  createdAt: string;
}

interface GameItem {
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

interface EarnLinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
  rewardPerPass: number;
  maxPasses: number;
  completedCount: number;
  passCode: string;
  updatedAt: string;
}

interface PublicEarnLinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
  rewardPerPass: number;
  maxPasses: number;
  completedCount: number;
  requiresCode: boolean;
  updatedAt: string;
}

interface DatabaseSchema {
  version: number;
  adminPasswordHash: string | null;
  adminBalance: number;
  adminEarnPasses: Record<string, number>;
  adminTransactions: TransactionItem[];
  countdownEndTime: number;
  serverRevision: number;
  lastUpdatedAt: string;
  games: GameItem[];
  earnLinks: EarnLinkItem[];
  users: StoredUser[];
}

interface SessionPayload {
  userId: string;
  username: string;
  displayName: string;
  role: UserRole;
  exp: number;
}

const PORT = 3000;
const THIRTY_HOURS_MS = 30 * 60 * 60 * 1000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'taigamekid-db.json');
const SESSION_SECRET_FILE = path.resolve(DATA_DIR, '.session-secret');
const SESSION_COOKIE_NAME = 'taigamekid_session';

function resolveSessionSecret(): string {
  const fromEnv = (process.env.SESSION_SECRET || '').trim();
  if (fromEnv) return fromEnv;
  try {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
    if (fsSync.existsSync(SESSION_SECRET_FILE)) {
      const existing = fsSync.readFileSync(SESSION_SECRET_FILE, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fsSync.writeFileSync(SESSION_SECRET_FILE, generated, { encoding: 'utf8', mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const SESSION_SECRET = resolveSessionSecret();

const SEED_GAMES: GameItem[] = [
  {
    id: 'game-cyber-drift-neo',
    title: 'Cyber Drift: Neo Saigon',
    coverUrl: '/src/assets/images/cover_cyber_action_1795322030078.jpg',
    category: 'hack',
    genre: 'Hành động',
    version: 'v2.4.1',
    size: '28.4 GB',
    downloadUrl: 'https://cdn.taigamekid.vn/files/cyber-drift-neo-saigon-v2.4.1.zip',
    review:
      'Cyber Drift: Neo Saigon đưa người chơi vào vai một đặc vụ giao vận đêm trong thành phố tương lai rực ánh đèn neon và những cơn mưa tầm tã. Phiên bản mở khóa sẵn toàn bộ trang bị và tùy biến xe giúp trải nghiệm tự do ngay từ đầu.\n\nĐồ họa được tối ưu tốt cho cả cấu hình tầm trung, hiệu ứng phản chiếu mặt đường ướt mang lại chiều sâu thị giác ấn tượng mà vẫn giữ vững khung hình ổn định trên 60 FPS.',
    installGuide: [
      'Tải về toàn bộ tệp nén Cyber_Drift_Neo_Saigon_v2.4.1.zip bằng nút Tải Miễn Phí bên trên.',
      'Giải nén tệp vừa tải bằng WinRAR hoặc 7-Zip vào thư mục có đường dẫn không chứa dấu tiếng Việt (ví dụ: D:\\Games\\CyberDrift).',
      'Mở thư mục _CommonRedist bên trong và cài đặt đầy đủ DirectX cùng Visual C++ Runtime nếu máy chưa có.',
      'Nhấp chuột phải vào tệp CyberDrift.exe và chọn "Run as Administrator" để khởi chạy game với hiệu năng cao nhất.',
    ],
    updatedAt: '2026-11-20T10:00:00.000Z',
    downloadsCount: 1420,
  },
  {
    id: 'game-astral-chronicle',
    title: 'Astral Chronicle: Eclipse',
    coverUrl: '/src/assets/images/cover_astral_rpg_1795322029827.jpg',
    category: 'hack',
    genre: 'Nhập vai',
    version: 'v3.1.2',
    size: '42.5 GB',
    downloadUrl: 'https://cdn.taigamekid.vn/files/astral-chronicle-eclipse-v3.1.2.zip',
    review:
      'Astral Chronicle: Eclipse là tựa game nhập vai hành động thế giới mở lấy bối cảnh vương quốc cổ đại bị chia cắt bởi những khối đá hắc thạch lơ lửng mang cổ ngữ ánh tím. Phiên bản hỗ trợ menu tinh chỉnh tài nguyên và mở khóa kỹ năng nhanh.\n\nMỗi khu vực tàn tích đều ẩn chứa boss bí mật với bộ chiêu thức đa dạng, bản cập nhật v3.1.2 đã bổ sung thêm chương mở rộng Nguyệt Thực và tối ưu đáng kể thời gian tải màn chơi.',
    installGuide: [
      'Tải bộ cài đặt Astral_Chronicle_Eclipse_v3.1.2.zip về máy tính.',
      'Giải nén bằng 7-Zip phiên bản mới nhất để tránh lỗi tràn đường dẫn file tài nguyên.',
      'Chạy file setup.exe, chọn ổ đĩa SSD để đạt tốc độ nạp cảnh mượt mà nhất và nhấn Install.',
      'Sau khi hoàn tất, mở game từ biểu tượng Astral Chronicle ngoài màn hình Desktop.',
    ],
    updatedAt: '2026-11-18T08:15:00.000Z',
    downloadsCount: 2150,
  },
  {
    id: 'game-frostborne-outpost',
    title: 'Frostborne: Last Outpost',
    coverUrl: '/src/assets/images/cover_frost_survival_1795322030299.jpg',
    category: 'normal',
    genre: 'Sinh tồn',
    version: 'v1.8.0',
    size: '16.2 GB',
    downloadUrl: 'https://cdn.taigamekid.vn/files/frostborne-last-outpost-v1.8.0.zip',
    review:
      'Frostborne: Last Outpost tái hiện chân thực cuộc chiến sinh tồn khắc nghiệt giữa vùng cực băng giá dưới bầu trời cực quang huyền ảo. Bạn phải thu thập củi đốt, săn bắn, chế tạo trang bị giữ ấm và gia cố căn cứ gỗ trước những cơn bão tuyết kéo dài nhiều ngày.\n\nCơ chế thời tiết động tác động trực tiếp đến thân nhiệt, độ bền công cụ và tầm nhìn của nhân vật. Không chạy theo lối chơi bắn súng ồn ào, game chinh phục người chơi bằng nhịp độ căng thẳng, âm thanh gió rít chân thực và cảm giác thỏa mãn khi thắp sáng ngọn đèn bão giữa đêm đông.',
    installGuide: [
      'Tải tệp cài đặt Frostborne_Last_Outpost_v1.8.0.zip về ổ cứng còn trống tối thiểu 25 GB.',
      'Nhấp chuột phải vào tệp nén và chọn Extract Here để giải nén toàn bộ dữ liệu game.',
      'Kiểm tra xem trình diệt virus có nhận nhầm tệp lưu tiến trình không, nếu cần hãy thêm thư mục game vào danh sách loại trừ.',
      'Chạy tệp FrostborneLauncher.exe, chọn ngôn ngữ Tiếng Việt trong mục Settings và bắt đầu hành trình sinh tồn.',
    ],
    updatedAt: '2026-11-19T14:30:00.000Z',
    downloadsCount: 985,
  },
  {
    id: 'game-apex-strikers-26',
    title: 'Apex Strikers 26',
    coverUrl: '/src/assets/images/cover_apex_sports_1795322030003.jpg',
    category: 'normal',
    genre: 'Thể thao',
    version: 'v26.2.0',
    size: '34.0 GB',
    downloadUrl: 'https://cdn.taigamekid.vn/files/apex-strikers-26-v26.2.0.zip',
    review:
      'Apex Strikers 26 nâng tầm trải nghiệm bóng đá hiện đại với công nghệ mô phỏng vật lý trái bóng thế hệ mới và chuyển động cầu thủ cực kỳ tự nhiên dưới ánh đèn sân vận động ban đêm. Chế độ Career Mode cho phép bạn quản lý chiến thuật, đào tạo cầu thủ trẻ và chinh phục các giải đấu đỉnh cao.\n\nĐiểm cộng lớn của phiên bản này là hỗ trợ tay cầm Xbox/PlayStation cắm là nhận ngay, độ trễ phím gần như bằng không và góc quay camera truyền hình sống động như đang theo dõi một trận chung kết thực thụ.',
    installGuide: [
      'Tải xuống gói cài đặt Apex_Strikers_26_Full.zip từ liên kết trực tiếp.',
      'Giải nén toàn bộ thư mục vào ổ D hoặc ổ C (đảm bảo trống ít nhất 40 GB).',
      'Cắm tay cầm (nếu dùng) trước khi mở game để hệ thống tự động nhận cấu hình phím.',
      'Nhấn đúp vào ApexStrikers26.exe để vào thẳng sân cỏ và tùy chỉnh độ phân giải phù hợp màn hình.',
    ],
    updatedAt: '2026-11-17T16:45:00.000Z',
    downloadsCount: 1760,
  },
  {
    id: 'game-hollow-vale',
    title: 'Shadow of Hollow Vale',
    coverUrl: '/src/assets/images/cover_hollow_adventure_1795322029805.jpg',
    category: 'normal',
    genre: 'Phiêu lưu',
    version: 'v1.4.5',
    size: '4.6 GB',
    downloadUrl: 'https://cdn.taigamekid.vn/files/shadow-of-hollow-vale-v1.4.5.zip',
    review:
      'Shadow of Hollow Vale là viên ngọc indie đậm chất nghệ thuật kể về hành trình khám phá thung lũng hang động ngầm phát sáng huyền bí. Trò chơi khéo léo đan xen giữa giải đố môi trường thông minh và những pha di chuyển vượt địa hình đầy thử thách.\n\nDù dung lượng rất nhẹ và chạy mượt trên hầu hết laptop văn phòng, phần hình ảnh vẽ tay tỉ mỉ cùng nhạc nền piano sâu lắng tạo nên sức hút khó rời mắt ngay từ những phút đầu tiên.',
    installGuide: [
      'Tải tệp nén gọn nhẹ Shadow_of_Hollow_Vale_v1.4.5.zip (4.6 GB).',
      'Giải nén tệp vào một thư mục bất kỳ trên máy tính.',
      'Không cần cài đặt phức tạp, chỉ cần mở file HollowVale.exe là có thể chơi ngay lập tức.',
    ],
    updatedAt: '2026-11-16T09:20:00.000Z',
    downloadsCount: 840,
  },
];

const SEED_EARN_LINKS: EarnLinkItem[] = [
  {
    id: 'earn-link-1',
    title: 'Vượt link nhanh #1 — Nhận thưởng 500đ',
    description: 'Mở liên kết, lấy mã xác nhận do Admin cấp rồi quay lại nhập mã để nhận tiền.',
    url: 'https://taigamekid.vn/go/nhiem-vu-1',
    rewardPerPass: 500,
    maxPasses: 5,
    completedCount: 42,
    passCode: 'KID500',
    updatedAt: '2026-11-22T08:00:00.000Z',
  },
  {
    id: 'earn-link-2',
    title: 'Vượt link VIP #2 — Nhận thưởng 1.000đ',
    description: 'Hoàn thành bước vượt link, sao chép mã xác nhận và nhập tại đây để cộng 1.000đ.',
    url: 'https://taigamekid.vn/go/nhiem-vu-2',
    rewardPerPass: 1000,
    maxPasses: 3,
    completedCount: 19,
    passCode: 'VIP1000',
    updatedAt: '2026-11-22T09:30:00.000Z',
  },
];

let writeQueue: Promise<unknown> = Promise.resolve();

function withDbLock<T>(task: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(task, task);
  writeQueue = next.catch(() => undefined);
  return next;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const actualBuf = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

function timingSafeCompareText(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function signSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const encoded = token.slice(0, dotIdx);
  const providedSig = token.slice(dotIdx + 1);
  if (!encoded || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');

  const sigBufA = Buffer.from(providedSig, 'utf8');
  const sigBufB = Buffer.from(expectedSig, 'utf8');
  if (sigBufA.length !== sigBufB.length || !crypto.timingSafeEqual(sigBufA, sigBufB)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    if (parsed.role !== 'admin' && parsed.role !== 'user') return null;
    return parsed;
  } catch {
    return null;
  }
}

function isSafeUrl(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeGameInput(body: unknown): Omit<GameItem, 'id' | 'updatedAt' | 'downloadsCount'> | null {
  if (!body || typeof body !== 'object') return null;
  const obj = body as Record<string, unknown>;

  const title = typeof obj.title === 'string' ? obj.title.trim() : '';
  if (!title || title.length > 160) return null;

  const category: GameCategory = obj.category === 'hack' ? 'hack' : 'normal';
  const genre = typeof obj.genre === 'string' && obj.genre.trim() ? obj.genre.trim().slice(0, 60) : 'Hành động';
  const version = typeof obj.version === 'string' && obj.version.trim() ? obj.version.trim().slice(0, 40) : 'v1.0.0';
  const size = typeof obj.size === 'string' && obj.size.trim() ? obj.size.trim().slice(0, 40) : 'Chưa rõ';

  const rawCover = typeof obj.coverUrl === 'string' ? obj.coverUrl.trim() : '';
  const coverUrl = rawCover === '' ? '' : isSafeUrl(rawCover) ? rawCover : '';

  const rawDownload = typeof obj.downloadUrl === 'string' ? obj.downloadUrl.trim() : '';
  const downloadUrl = isSafeUrl(rawDownload) ? rawDownload : '#';

  const review = typeof obj.review === 'string' ? obj.review.trim().slice(0, 10000) : '';

  let installGuide: string[] = [];
  if (Array.isArray(obj.installGuide)) {
    installGuide = obj.installGuide
      .filter((step): step is string => typeof step === 'string')
      .map((s) => s.trim().slice(0, 500))
      .filter(Boolean)
      .slice(0, 30);
  } else if (typeof obj.installGuide === 'string') {
    installGuide = obj.installGuide
      .split('\n')
      .map((s) => s.trim().slice(0, 500))
      .filter(Boolean)
      .slice(0, 30);
  }

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

function toPublicEarnLink(link: EarnLinkItem): PublicEarnLinkItem {
  return {
    id: link.id,
    title: link.title,
    description: link.description,
    url: link.url,
    rewardPerPass: link.rewardPerPass,
    maxPasses: link.maxPasses,
    completedCount: link.completedCount,
    requiresCode: Boolean(link.passCode && link.passCode.trim().length > 0),
    updatedAt: link.updatedAt,
  };
}

function toPublicEarnLinks(links: EarnLinkItem[]): PublicEarnLinkItem[] {
  return links.map(toPublicEarnLink);
}

function sanitizeEarnLinkInput(
  body: unknown
): Omit<EarnLinkItem, 'id' | 'completedCount' | 'updatedAt'> | null {
  if (!body || typeof body !== 'object') return null;
  const obj = body as Record<string, unknown>;

  const title = typeof obj.title === 'string' ? obj.title.trim() : '';
  if (!title || title.length > 160) return null;

  const rawUrl = typeof obj.url === 'string' ? obj.url.trim() : '';
  if (!isSafeUrl(rawUrl)) return null;

  const description =
    typeof obj.description === 'string' ? obj.description.trim().slice(0, 1000) : '';

  const rewardRaw = Number(obj.rewardPerPass);
  if (!Number.isFinite(rewardRaw) || rewardRaw < 0 || rewardRaw > 10_000_000) return null;
  const rewardPerPass = Math.floor(rewardRaw);

  const maxPassesRaw = Number(obj.maxPasses);
  if (!Number.isFinite(maxPassesRaw) || maxPassesRaw < 1 || maxPassesRaw > 100_000) return null;
  const maxPasses = Math.floor(maxPassesRaw);

  const passCode = typeof obj.passCode === 'string' ? obj.passCode.trim() : '';
  if (passCode.length < 2 || passCode.length > 64) return null;

  return {
    title,
    description,
    url: rawUrl,
    rewardPerPass,
    maxPasses,
    passCode,
  };
}

async function readDb(): Promise<DatabaseSchema> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    const games = Array.isArray(parsed.games)
      ? parsed.games.map((g) => ({
          ...g,
          category: g.category === 'hack' ? ('hack' as const) : ('normal' as const),
        }))
      : [...SEED_GAMES];

    const earnLinks = Array.isArray(parsed.earnLinks)
      ? parsed.earnLinks.map((link, idx) => {
          const rawCode =
            typeof link.passCode === 'string' ? link.passCode.trim().slice(0, 64) : '';
          const seedMatch = SEED_EARN_LINKS.find((s) => s.id === link.id);
          return {
            id: String(link.id || `earn-${Date.now()}`),
            title: String(link.title || 'Nhiệm vụ vượt link'),
            description: String(link.description || ''),
            url: isSafeUrl(link.url) ? String(link.url) : '#',
            rewardPerPass:
              typeof link.rewardPerPass === 'number' && link.rewardPerPass >= 0
                ? Math.floor(link.rewardPerPass)
                : 500,
            maxPasses:
              typeof link.maxPasses === 'number' && link.maxPasses >= 1
                ? Math.floor(link.maxPasses)
                : 1,
            completedCount:
              typeof link.completedCount === 'number' && link.completedCount >= 0
                ? Math.floor(link.completedCount)
                : 0,
            passCode: rawCode || seedMatch?.passCode || `TK${idx + 101}`,
            updatedAt:
              typeof link.updatedAt === 'string' ? link.updatedAt : new Date().toISOString(),
          };
        })
      : [...SEED_EARN_LINKS];

    const countdownEndTime =
      typeof parsed.countdownEndTime === 'number' && parsed.countdownEndTime > Date.now()
        ? parsed.countdownEndTime
        : Date.now() + THIRTY_HOURS_MS;

    const db: DatabaseSchema = {
      version: parsed.version ?? 1,
      adminPasswordHash: typeof parsed.adminPasswordHash === 'string' ? parsed.adminPasswordHash : null,
      adminBalance:
        typeof parsed.adminBalance === 'number' && parsed.adminBalance >= 0
          ? Math.floor(parsed.adminBalance)
          : 0,
      adminEarnPasses:
        parsed.adminEarnPasses && typeof parsed.adminEarnPasses === 'object'
          ? parsed.adminEarnPasses
          : {},
      adminTransactions: Array.isArray(parsed.adminTransactions) ? parsed.adminTransactions : [],
      countdownEndTime,
      serverRevision:
        typeof parsed.serverRevision === 'number' && parsed.serverRevision >= 1
          ? Math.floor(parsed.serverRevision)
          : 1,
      lastUpdatedAt:
        typeof parsed.lastUpdatedAt === 'string' ? parsed.lastUpdatedAt : new Date().toISOString(),
      games,
      earnLinks,
      users: Array.isArray(parsed.users) ? parsed.users : [],
    };
    return db;
  } catch {
    const initial: DatabaseSchema = {
      version: 1,
      adminPasswordHash: null,
      adminBalance: 0,
      adminEarnPasses: {},
      adminTransactions: [],
      countdownEndTime: Date.now() + THIRTY_HOURS_MS,
      serverRevision: 1,
      lastUpdatedAt: new Date().toISOString(),
      games: [...SEED_GAMES],
      earnLinks: [...SEED_EARN_LINKS],
      users: [],
    };
    await writeDbAtomic(initial);
    return initial;
  }
}

async function writeDbAtomic(db: DatabaseSchema): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempFile = path.resolve(DATA_DIR, `.taigamekid-db.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tempFile, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tempFile, DB_FILE);
}

function getEnvAdminPasscode(): string {
  return (process.env.ADMIN_PASSCODE || '').trim();
}

interface AuthedRequest extends Request {
  authUser?: SessionPayload;
}

function extractCookieValue(req: Request, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = pair.slice(0, eqIdx).trim();
    if (key === name) {
      return decodeURIComponent(pair.slice(eqIdx + 1).trim());
    }
  }
  return null;
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  return extractCookieValue(req, SESSION_COOKIE_NAME);
}

function isRequestHttps(req: Request): boolean {
  if (req.secure) return true;
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string') {
    return proto.split(',')[0].trim().toLowerCase() === 'https';
  }
  return false;
}

function setSessionCookie(req: Request, res: Response, token: string): void {
  const https = isRequestHttps(req);
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: https ? 'none' : 'lax',
    secure: https,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearSessionCookie(req: Request, res: Response): void {
  const https = isRequestHttps(req);
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: https ? 'none' : 'lax',
    secure: https,
    path: '/',
  });
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục.' });
    return;
  }
  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.' });
    return;
  }
  req.authUser = session;
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.authUser?.role !== 'admin') {
      res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền thực hiện thao tác này.' });
      return;
    }
    next();
  });
}

const sseClients = new Set<Response>();

function bumpServerCycle(db: DatabaseSchema): void {
  db.countdownEndTime = Date.now() + THIRTY_HOURS_MS;
  db.serverRevision = (db.serverRevision || 0) + 1;
  db.lastUpdatedAt = new Date().toISOString();
}

interface LeaderboardEntry {
  id: string;
  displayName: string;
  balance: number;
  completedTasks: number;
}

function buildLeaderboard(db: DatabaseSchema): LeaderboardEntry[] {
  return db.users
    .map((u) => {
      const completedTasks = u.earnPasses
        ? Object.values(u.earnPasses).reduce(
            (sum, count) => sum + (typeof count === 'number' && count > 0 ? count : 0),
            0
          )
        : 0;
      return {
        id: u.id,
        displayName: u.displayName,
        balance: typeof u.balance === 'number' && u.balance >= 0 ? Math.floor(u.balance) : 0,
        completedTasks,
      };
    })
    .sort((a, b) => {
      if (b.balance !== a.balance) return b.balance - a.balance;
      return b.completedTasks - a.completedTasks;
    })
    .slice(0, 10);
}

function broadcastServerUpdate(
  db: DatabaseSchema,
  reason:
    | 'game-added'
    | 'game-updated'
    | 'game-deleted'
    | 'earn-links-updated'
    | 'backup-imported'
    | 'server-reset',
  gameTitle?: string
): void {
  if (sseClients.size === 0) return;
  const payload = JSON.stringify({
    games: db.games,
    earnLinks: toPublicEarnLinks(db.earnLinks),
    leaderboard: buildLeaderboard(db),
    countdownEndTime: db.countdownEndTime,
    usersCount: db.users.length + 1,
    serverRevision: db.serverRevision,
    lastUpdatedAt: db.lastUpdatedAt,
    reason,
    gameTitle,
  });
  const frame = `event: server-update\ndata: ${payload}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(frame);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Ensure DB exists on startup
  await withDbLock(() => readDb());

  // Live Server-Sent Events stream for instant cross-device game updates & server resets
  app.get('/api/events', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    sseClients.add(res);

    try {
      const db = await readDb();
      const snapshot = JSON.stringify({
        games: db.games,
        earnLinks: toPublicEarnLinks(db.earnLinks),
        leaderboard: buildLeaderboard(db),
        countdownEndTime: db.countdownEndTime,
        usersCount: db.users.length + 1,
        serverRevision: db.serverRevision,
        lastUpdatedAt: db.lastUpdatedAt,
        reason: 'connected',
      });
      res.write(`event: server-update\ndata: ${snapshot}\n\n`);
    } catch {
      // Ignore initial snapshot read error; polling remains active
    }

    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Public state endpoint (no PII, no password hashes, no secret link passCodes)
  app.get('/api/state', async (_req: Request, res: Response) => {
    try {
      const db = await withDbLock(async () => {
        const current = await readDb();
        if (current.countdownEndTime <= Date.now()) {
          current.countdownEndTime = Date.now() + THIRTY_HOURS_MS;
          await writeDbAtomic(current);
        }
        return current;
      });

      res.json({
        games: db.games,
        earnLinks: toPublicEarnLinks(db.earnLinks),
        leaderboard: buildLeaderboard(db),
        countdownEndTime: db.countdownEndTime,
        usersCount: db.users.length + 1,
        serverRevision: db.serverRevision,
        lastUpdatedAt: db.lastUpdatedAt,
      });
    } catch {
      res.status(500).json({ error: 'Không thể tải dữ liệu từ máy chủ.' });
    }
  });

  // Public top-10 balance leaderboard (displayName, balance, completedTasks only — no PII)
  app.get('/api/leaderboard', async (_req: Request, res: Response) => {
    try {
      const db = await readDb();
      res.json({ leaderboard: buildLeaderboard(db) });
    } catch {
      res.status(500).json({ error: 'Không thể tải bảng xếp hạng.' });
    }
  });

  // Reset countdown if expired
  app.post('/api/countdown/reset', async (_req: Request, res: Response) => {
    try {
      const nextEnd = await withDbLock(async () => {
        const db = await readDb();
        if (db.countdownEndTime <= Date.now()) {
          db.countdownEndTime = Date.now() + THIRTY_HOURS_MS;
          await writeDbAtomic(db);
        }
        return db.countdownEndTime;
      });
      res.json({ countdownEndTime: nextEnd });
    } catch {
      res.status(500).json({ error: 'Không thể cập nhật đồng hồ đếm ngược.' });
    }
  });

  // Admin: Immediately reset server sync cycle and push latest catalog to all connected devices
  app.post('/api/server/reset-update', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const db = await withDbLock(async () => {
        const current = await readDb();
        bumpServerCycle(current);
        await writeDbAtomic(current);
        return current;
      });
      broadcastServerUpdate(db, 'server-reset');
      res.json({
        games: db.games,
        earnLinks: db.earnLinks,
        countdownEndTime: db.countdownEndTime,
        usersCount: db.users.length + 1,
        serverRevision: db.serverRevision,
        lastUpdatedAt: db.lastUpdatedAt,
      });
    } catch {
      res.status(500).json({ error: 'Không thể reset và cập nhật máy chủ.' });
    }
  });

  // Login (Admin or standard registered user)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      res.status(400).json({ error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
      return;
    }

    try {
      const db = await readDb();

      if (username.toLowerCase() === 'admin') {
        const envPasscode = getEnvAdminPasscode();
        if (envPasscode) {
          if (!timingSafeCompareText(password, envPasscode)) {
            res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
            return;
          }
        } else if (db.adminPasswordHash) {
          if (!verifyPassword(password, db.adminPasswordHash)) {
            res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
            return;
          }
        } else {
          res.status(503).json({
            error: 'Chưa cấu hình ADMIN_PASSCODE trong Settings → Secrets của ứng dụng.',
          });
          return;
        }

        const adminUser = {
          id: 'user-admin-root',
          username: 'admin',
          displayName: 'Quản trị viên',
          role: 'admin' as const,
          balance: db.adminBalance || 0,
          earnPasses: db.adminEarnPasses || {},
          transactions: db.adminTransactions || [],
        };
        const token = signSessionToken({
          userId: adminUser.id,
          username: adminUser.username,
          displayName: adminUser.displayName,
          role: adminUser.role,
        });
        setSessionCookie(req, res, token);
        res.json({ token, user: adminUser });
        return;
      }

      const matched = db.users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );
      if (!matched || !verifyPassword(password, matched.passwordHash)) {
        res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
        return;
      }

      const safeUser = {
        id: matched.id,
        username: matched.username,
        displayName: matched.displayName,
        role: 'user' as const,
        balance: matched.balance || 0,
        earnPasses: matched.earnPasses || {},
        transactions: matched.transactions || [],
      };
      const token = signSessionToken({
        userId: safeUser.id,
        username: safeUser.username,
        displayName: safeUser.displayName,
        role: safeUser.role,
      });
      setSessionCookie(req, res, token);
      res.json({ token, user: safeUser });
    } catch {
      res.status(500).json({ error: 'Không thể xử lý đăng nhập.' });
    }
  });

  // Register standard user account
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const displayName =
      typeof req.body?.displayName === 'string' && req.body.displayName.trim()
        ? req.body.displayName.trim().slice(0, 60)
        : username;
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (username.length < 3 || username.length > 40 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
      res.status(400).json({
        error: 'Tên đăng nhập dài 3–40 ký tự, chỉ gồm chữ, số, dấu chấm hoặc gạch dưới.',
      });
      return;
    }
    if (username.toLowerCase() === 'admin') {
      res.status(409).json({ error: 'Tên đăng nhập này đã được hệ thống sử dụng.' });
      return;
    }
    if (password.length < 4 || password.length > 100) {
      res.status(400).json({ error: 'Mật khẩu cần từ 4 đến 100 ký tự.' });
      return;
    }

    try {
      const created = await withDbLock(async () => {
        const db = await readDb();
        const duplicate = db.users.some(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        );
        if (duplicate) {
          return null;
        }
        const newUser: StoredUser = {
          id: `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          username,
          displayName,
          role: 'user',
          passwordHash: hashPassword(password),
          balance: 0,
          earnPasses: {},
          transactions: [],
          createdAt: new Date().toISOString(),
        };
        db.users.push(newUser);
        await writeDbAtomic(db);
        return newUser;
      });

      if (!created) {
        res.status(409).json({ error: 'Tên đăng nhập này đã được sử dụng.' });
        return;
      }

      const safeUser = {
        id: created.id,
        username: created.username,
        displayName: created.displayName,
        role: 'user' as const,
        balance: 0,
        earnPasses: {},
        transactions: [] as TransactionItem[],
      };
      const token = signSessionToken({
        userId: safeUser.id,
        username: safeUser.username,
        displayName: safeUser.displayName,
        role: safeUser.role,
      });

      setSessionCookie(req, res, token);
      res.status(201).json({ token, user: safeUser });
    } catch {
      res.status(500).json({ error: 'Không thể đăng ký tài khoản.' });
    }
  });

  // Restore active cookie session without throwing 401 for guests
  app.get('/api/auth/session', async (req: Request, res: Response) => {
    const token = extractCookieValue(req, SESSION_COOKIE_NAME);
    if (!token) {
      res.json({ authenticated: false });
      return;
    }
    const u = verifySessionToken(token);
    if (!u) {
      clearSessionCookie(req, res);
      res.json({ authenticated: false });
      return;
    }
    try {
      const db = await readDb();
      if (u.role === 'admin') {
        res.json({
          authenticated: true,
          token,
          user: {
            id: u.userId,
            username: u.username,
            displayName: u.displayName,
            role: u.role,
            balance: db.adminBalance || 0,
            earnPasses: db.adminEarnPasses || {},
            transactions: db.adminTransactions || [],
          },
        });
        return;
      }
      const matched = db.users.find((item) => item.id === u.userId);
      if (!matched) {
        clearSessionCookie(req, res);
        res.json({ authenticated: false });
        return;
      }
      res.json({
        authenticated: true,
        token,
        user: {
          id: matched.id,
          username: matched.username,
          displayName: matched.displayName,
          role: 'user' as const,
          balance: matched.balance || 0,
          earnPasses: matched.earnPasses || {},
          transactions: matched.transactions || [],
        },
      });
    } catch {
      res.json({ authenticated: false });
    }
  });

  // Clear HttpOnly session cookie
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  // Verify current Bearer session
  app.get('/api/auth/me', requireAuth, async (req: AuthedRequest, res: Response) => {
    const u = req.authUser!;
    try {
      const db = await readDb();
      if (u.role === 'admin') {
        res.json({
          user: {
            id: u.userId,
            username: u.username,
            displayName: u.displayName,
            role: u.role,
            balance: db.adminBalance || 0,
            earnPasses: db.adminEarnPasses || {},
            transactions: db.adminTransactions || [],
          },
        });
        return;
      }
      const matched = db.users.find((item) => item.id === u.userId);
      res.json({
        user: {
          id: u.userId,
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          balance: matched?.balance || 0,
          earnPasses: matched?.earnPasses || {},
          transactions: matched?.transactions || [],
        },
      });
    } catch {
      res.status(500).json({ error: 'Không thể tải thông tin tài khoản.' });
    }
  });

  // Authenticated download counter increment
  app.post('/api/games/:id/download', requireAuth, async (req: Request, res: Response) => {
    const gameId = String(req.params.id || '');
    try {
      const updated = await withDbLock(async () => {
        const db = await readDb();
        const idx = db.games.findIndex((g) => g.id === gameId);
        if (idx === -1) return null;
        db.games[idx] = {
          ...db.games[idx],
          downloadsCount: (db.games[idx].downloadsCount || 0) + 1,
        };
        await writeDbAtomic(db);
        return db.games[idx];
      });

      if (!updated) {
        res.status(404).json({ error: 'Không tìm thấy trò chơi.' });
        return;
      }
      res.json({ game: updated });
    } catch {
      res.status(500).json({ error: 'Không thể ghi nhận lượt tải.' });
    }
  });

  // Admin: Add new game (immediately resets server cycle & broadcasts update)
  app.post('/api/games', requireAdmin, async (req: Request, res: Response) => {
    const sanitized = sanitizeGameInput(req.body);
    if (!sanitized) {
      res.status(400).json({ error: 'Dữ liệu game không hợp lệ.' });
      return;
    }

    try {
      const result = await withDbLock(async () => {
        const db = await readDb();
        const newGame: GameItem = {
          id: `game-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          ...sanitized,
          updatedAt: new Date().toISOString(),
          downloadsCount: 0,
        };
        db.games.unshift(newGame);
        bumpServerCycle(db);
        await writeDbAtomic(db);
        return { db, game: newGame };
      });
      broadcastServerUpdate(result.db, 'game-added', result.game.title);
      res.status(201).json({
        game: result.game,
        countdownEndTime: result.db.countdownEndTime,
        serverRevision: result.db.serverRevision,
        lastUpdatedAt: result.db.lastUpdatedAt,
      });
    } catch {
      res.status(500).json({ error: 'Không thể lưu game mới.' });
    }
  });

  // Admin: Update existing game (immediately resets server cycle & broadcasts update)
  app.put('/api/games/:id', requireAdmin, async (req: Request, res: Response) => {
    const gameId = String(req.params.id || '');
    const sanitized = sanitizeGameInput(req.body);
    if (!sanitized) {
      res.status(400).json({ error: 'Dữ liệu cập nhật không hợp lệ.' });
      return;
    }

    try {
      const result = await withDbLock(async () => {
        const db = await readDb();
        const idx = db.games.findIndex((g) => g.id === gameId);
        if (idx === -1) return null;
        db.games[idx] = {
          ...db.games[idx],
          ...sanitized,
          updatedAt: new Date().toISOString(),
        };
        bumpServerCycle(db);
        await writeDbAtomic(db);
        return { db, game: db.games[idx] };
      });

      if (!result) {
        res.status(404).json({ error: 'Không tìm thấy game cần sửa.' });
        return;
      }
      broadcastServerUpdate(result.db, 'game-updated', result.game.title);
      res.json({
        game: result.game,
        countdownEndTime: result.db.countdownEndTime,
        serverRevision: result.db.serverRevision,
        lastUpdatedAt: result.db.lastUpdatedAt,
      });
    } catch {
      res.status(500).json({ error: 'Không thể cập nhật game.' });
    }
  });

  // Admin: Delete game (immediately resets server cycle & broadcasts update)
  app.delete('/api/games/:id', requireAdmin, async (req: Request, res: Response) => {
    const gameId = String(req.params.id || '');
    try {
      const result = await withDbLock(async () => {
        const db = await readDb();
        const target = db.games.find((g) => g.id === gameId);
        if (!target) return null;
        db.games = db.games.filter((g) => g.id !== gameId);
        bumpServerCycle(db);
        await writeDbAtomic(db);
        return { db, deletedTitle: target.title };
      });

      if (!result) {
        res.status(404).json({ error: 'Không tìm thấy game để xóa.' });
        return;
      }
      broadcastServerUpdate(result.db, 'game-deleted', result.deletedTitle);
      res.json({
        ok: true,
        countdownEndTime: result.db.countdownEndTime,
        serverRevision: result.db.serverRevision,
        lastUpdatedAt: result.db.lastUpdatedAt,
      });
    } catch {
      res.status(500).json({ error: 'Không thể xóa game.' });
    }
  });

  // Admin: Fetch full earn-links including secret verification codes across devices
  app.get('/api/admin/earn-links', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const db = await readDb();
      res.json({ earnLinks: db.earnLinks });
    } catch {
      res.status(500).json({ error: 'Không thể tải danh sách mã vượt link.' });
    }
  });

  // Authenticated: Complete an earn-link pass by verifying Admin's passCode and credit reward
  app.post(
    '/api/earn-links/:id/complete',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const linkId = String(req.params.id || '');
      const submittedCode = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
      const authUser = req.authUser!;

      try {
        const outcome = await withDbLock(async () => {
          const db = await readDb();
          const idx = db.earnLinks.findIndex((l) => l.id === linkId);
          if (idx === -1) return { status: 'not_found' as const };

          const target = db.earnLinks[idx];

          if (target.passCode && target.passCode.trim().length > 0) {
            if (!submittedCode) {
              return { status: 'missing_code' as const };
            }
            if (
              !timingSafeCompareText(
                submittedCode.toLowerCase(),
                target.passCode.trim().toLowerCase()
              )
            ) {
              return { status: 'invalid_code' as const };
            }
          }

          const txItem: TransactionItem = {
            id: `tx-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
            linkId: target.id,
            linkTitle: target.title,
            amount: target.rewardPerPass,
            type: 'earn',
            createdAt: new Date().toISOString(),
          };

          if (authUser.role === 'admin') {
            const currentPasses = db.adminEarnPasses[linkId] || 0;
            if (currentPasses >= target.maxPasses) {
              return { status: 'limit_reached' as const, maxPasses: target.maxPasses };
            }
            db.adminEarnPasses[linkId] = currentPasses + 1;
            db.adminBalance = (db.adminBalance || 0) + target.rewardPerPass;
            db.adminTransactions = [txItem, ...(db.adminTransactions || [])].slice(0, 200);
            db.earnLinks[idx] = {
              ...target,
              completedCount: (target.completedCount || 0) + 1,
            };
            bumpServerCycle(db);
            await writeDbAtomic(db);
            return {
              status: 'ok' as const,
              db,
              earnLink: db.earnLinks[idx],
              balance: db.adminBalance,
              earnPasses: { ...db.adminEarnPasses },
              transactions: db.adminTransactions,
            };
          }

          const userIdx = db.users.findIndex((u) => u.id === authUser.userId);
          if (userIdx === -1) return { status: 'user_not_found' as const };

          const user = db.users[userIdx];
          const passesMap = user.earnPasses ? { ...user.earnPasses } : {};
          const currentPasses = passesMap[linkId] || 0;
          if (currentPasses >= target.maxPasses) {
            return { status: 'limit_reached' as const, maxPasses: target.maxPasses };
          }

          passesMap[linkId] = currentPasses + 1;
          const nextBalance = (user.balance || 0) + target.rewardPerPass;
          const nextTransactions = [txItem, ...(user.transactions || [])].slice(0, 200);
          db.users[userIdx] = {
            ...user,
            balance: nextBalance,
            earnPasses: passesMap,
            transactions: nextTransactions,
          };
          db.earnLinks[idx] = {
            ...target,
            completedCount: (target.completedCount || 0) + 1,
          };
          bumpServerCycle(db);
          await writeDbAtomic(db);

          return {
            status: 'ok' as const,
            db,
            earnLink: db.earnLinks[idx],
            balance: nextBalance,
            earnPasses: passesMap,
            transactions: nextTransactions,
          };
        });

        if (outcome.status === 'not_found') {
          res.status(404).json({ error: 'Không tìm thấy liên kết vượt link.' });
          return;
        }
        if (outcome.status === 'missing_code') {
          res.status(400).json({ error: 'Vui lòng nhập mã xác nhận sau khi vượt link.' });
          return;
        }
        if (outcome.status === 'invalid_code') {
          res.status(403).json({
            error: 'Mã xác nhận không chính xác. Vui lòng kiểm tra lại mã sau khi vượt link.',
          });
          return;
        }
        if (outcome.status === 'user_not_found') {
          res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
          return;
        }
        if (outcome.status === 'limit_reached') {
          res.status(400).json({
            error: `Bạn đã vượt tối đa ${outcome.maxPasses}/${outcome.maxPasses} lần cho link này.`,
          });
          return;
        }

        broadcastServerUpdate(outcome.db, 'earn-links-updated', outcome.earnLink.title);
        res.json({
          earnLink: toPublicEarnLink(outcome.earnLink),
          balance: outcome.balance,
          earnPasses: outcome.earnPasses,
          transactions: outcome.transactions,
          countdownEndTime: outcome.db.countdownEndTime,
          serverRevision: outcome.db.serverRevision,
          lastUpdatedAt: outcome.db.lastUpdatedAt,
        });
      } catch {
        res.status(500).json({ error: 'Không thể ghi nhận lượt vượt link.' });
      }
    }
  );

  // Admin: Add new earn link (persists and broadcasts immediately like games)
  app.post('/api/earn-links', requireAdmin, async (req: Request, res: Response) => {
    const sanitized = sanitizeEarnLinkInput(req.body);
    if (!sanitized) {
      res.status(400).json({
        error:
          'Thông tin link không hợp lệ (cần tên, URL http/https, tiền thưởng, số lần vượt >= 1 và mã xác nhận >= 2 ký tự).',
      });
      return;
    }

    try {
      const result = await withDbLock(async () => {
        const db = await readDb();
        const newLink: EarnLinkItem = {
          id: `earn-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          ...sanitized,
          completedCount: 0,
          updatedAt: new Date().toISOString(),
        };
        db.earnLinks.unshift(newLink);
        bumpServerCycle(db);
        await writeDbAtomic(db);
        return { db, earnLink: newLink };
      });
      broadcastServerUpdate(result.db, 'earn-links-updated', result.earnLink.title);
      res.status(201).json({
        earnLink: result.earnLink,
        countdownEndTime: result.db.countdownEndTime,
        serverRevision: result.db.serverRevision,
        lastUpdatedAt: result.db.lastUpdatedAt,
      });
    } catch {
      res.status(500).json({ error: 'Không thể thêm link kiếm tiền mới.' });
    }
  });

  // Admin: Update earn link
  app.put('/api/earn-links/:id', requireAdmin, async (req: Request, res: Response) => {
    const linkId = String(req.params.id || '');
    const sanitized = sanitizeEarnLinkInput(req.body);
    if (!sanitized) {
      res.status(400).json({ error: 'Dữ liệu cập nhật link không hợp lệ.' });
      return;
    }

    try {
      const result = await withDbLock(async () => {
        const db = await readDb();
        const idx = db.earnLinks.findIndex((l) => l.id === linkId);
        if (idx === -1) return null;
        db.earnLinks[idx] = {
          ...db.earnLinks[idx],
          ...sanitized,
          updatedAt: new Date().toISOString(),
        };
        bumpServerCycle(db);
        await writeDbAtomic(db);
        return { db, earnLink: db.earnLinks[idx] };
      });

      if (!result) {
        res.status(404).json({ error: 'Không tìm thấy link cần sửa.' });
        return;
      }
      broadcastServerUpdate(result.db, 'earn-links-updated', result.earnLink.title);
      res.json({
        earnLink: result.earnLink,
        countdownEndTime: result.db.countdownEndTime,
        serverRevision: result.db.serverRevision,
        lastUpdatedAt: result.db.lastUpdatedAt,
      });
    } catch {
      res.status(500).json({ error: 'Không thể cập nhật link.' });
    }
  });

  // Admin: Delete earn link
  app.delete('/api/earn-links/:id', requireAdmin, async (req: Request, res: Response) => {
    const linkId = String(req.params.id || '');
    try {
      const result = await withDbLock(async () => {
        const db = await readDb();
        const target = db.earnLinks.find((l) => l.id === linkId);
        if (!target) return null;
        db.earnLinks = db.earnLinks.filter((l) => l.id !== linkId);
        bumpServerCycle(db);
        await writeDbAtomic(db);
        return { db, deletedTitle: target.title };
      });

      if (!result) {
        res.status(404).json({ error: 'Không tìm thấy link để xóa.' });
        return;
      }
      broadcastServerUpdate(result.db, 'earn-links-updated', result.deletedTitle);
      res.json({
        ok: true,
        countdownEndTime: result.db.countdownEndTime,
        serverRevision: result.db.serverRevision,
        lastUpdatedAt: result.db.lastUpdatedAt,
      });
    } catch {
      res.status(500).json({ error: 'Không thể xóa link.' });
    }
  });

  // Admin: Export Full Backup JSON (games, earnLinks, users with balances/tasks/transactions, admin earn state)
  app.get('/api/backup/export', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const db = await readDb();
      res.json({
        app: 'taigamekid',
        version: 3,
        exportedAt: new Date().toISOString(),
        games: db.games,
        earnLinks: db.earnLinks,
        users: db.users,
        adminBalance: db.adminBalance || 0,
        adminEarnPasses: db.adminEarnPasses || {},
        adminTransactions: db.adminTransactions || [],
      });
    } catch {
      res.status(500).json({ error: 'Không thể xuất tệp sao lưu.' });
    }
  });

  // Admin: Import Full Backup JSON (immediately resets server cycle & broadcasts update)
  app.post('/api/backup/import', requireAdmin, async (req: Request, res: Response) => {
    const rawGames = req.body?.games;
    if (!Array.isArray(rawGames)) {
      res.status(400).json({ error: 'Tệp JSON không hợp lệ hoặc thiếu danh sách game.' });
      return;
    }

    const sanitizeEarnPassesMap = (raw: unknown): Record<string, number> => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
      const out: Record<string, number> = {};
      for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
        const cleanKey = key.trim().slice(0, 120);
        const num = Number(val);
        if (cleanKey && Number.isFinite(num) && num > 0) {
          out[cleanKey] = Math.min(100_000, Math.floor(num));
        }
      }
      return out;
    };

    const sanitizeTransactionsList = (raw: unknown): TransactionItem[] => {
      if (!Array.isArray(raw)) return [];
      const out: TransactionItem[] = [];
      for (let i = 0; i < raw.length && out.length < 200; i++) {
        const item = raw[i];
        if (!item || typeof item !== 'object') continue;
        const obj = item as Record<string, unknown>;
        const amountNum = Number(obj.amount);
        if (!Number.isFinite(amountNum) || amountNum < 0) continue;
        out.push({
          id:
            typeof obj.id === 'string' && obj.id.trim()
              ? obj.id.trim().slice(0, 120)
              : `tx-imported-${Date.now()}-${i}`,
          linkId:
            typeof obj.linkId === 'string' && obj.linkId.trim()
              ? obj.linkId.trim().slice(0, 120)
              : 'unknown',
          linkTitle:
            typeof obj.linkTitle === 'string' && obj.linkTitle.trim()
              ? obj.linkTitle.trim().slice(0, 160)
              : 'Nhiệm vụ vượt link',
          amount: Math.min(10_000_000, Math.floor(amountNum)),
          type: 'earn',
          createdAt:
            typeof obj.createdAt === 'string' && obj.createdAt.trim()
              ? obj.createdAt.trim().slice(0, 64)
              : new Date().toISOString(),
        });
      }
      return out;
    };

    const sanitizedGames: GameItem[] = [];
    for (let i = 0; i < rawGames.length; i++) {
      const item = rawGames[i];
      const cleaned = sanitizeGameInput(item);
      if (!cleaned) continue;
      const obj = item as Record<string, unknown>;
      sanitizedGames.push({
        id:
          typeof obj.id === 'string' && obj.id.trim()
            ? obj.id.trim().slice(0, 120)
            : `game-imported-${Date.now()}-${i}`,
        ...cleaned,
        updatedAt:
          typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString(),
        downloadsCount:
          typeof obj.downloadsCount === 'number' && obj.downloadsCount >= 0
            ? Math.floor(obj.downloadsCount)
            : 0,
      });
    }

    const rawEarnLinks = req.body?.earnLinks;
    let sanitizedEarnLinks: EarnLinkItem[] | null = null;
    if (Array.isArray(rawEarnLinks)) {
      sanitizedEarnLinks = [];
      for (let i = 0; i < rawEarnLinks.length; i++) {
        const item = rawEarnLinks[i];
        const cleaned = sanitizeEarnLinkInput(item);
        if (!cleaned) continue;
        const obj = item as Record<string, unknown>;
        sanitizedEarnLinks.push({
          id:
            typeof obj.id === 'string' && obj.id.trim()
              ? obj.id.trim().slice(0, 120)
              : `earn-imported-${Date.now()}-${i}`,
          ...cleaned,
          updatedAt:
            typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString(),
          completedCount:
            typeof obj.completedCount === 'number' && obj.completedCount >= 0
              ? Math.floor(obj.completedCount)
              : 0,
        });
      }
    }

    const rawUsers = req.body?.users;
    let sanitizedUsers: StoredUser[] | null = null;
    if (Array.isArray(rawUsers)) {
      sanitizedUsers = [];
      const seenUsernames = new Set<string>();
      for (let i = 0; i < rawUsers.length; i++) {
        const item = rawUsers[i];
        if (!item || typeof item !== 'object') continue;
        const obj = item as Record<string, unknown>;
        const username = typeof obj.username === 'string' ? obj.username.trim() : '';
        if (
          username.length < 3 ||
          username.length > 40 ||
          !/^[a-zA-Z0-9_.-]+$/.test(username) ||
          username.toLowerCase() === 'admin'
        ) {
          continue;
        }
        const lowerName = username.toLowerCase();
        if (seenUsernames.has(lowerName)) continue;
        seenUsernames.add(lowerName);

        const passwordHash = typeof obj.passwordHash === 'string' ? obj.passwordHash.trim() : '';
        if (!passwordHash.includes(':')) continue;

        const balanceNum = Number(obj.balance);
        sanitizedUsers.push({
          id:
            typeof obj.id === 'string' && obj.id.trim()
              ? obj.id.trim().slice(0, 120)
              : `user-imported-${Date.now()}-${i}`,
          username,
          displayName:
            typeof obj.displayName === 'string' && obj.displayName.trim()
              ? obj.displayName.trim().slice(0, 60)
              : username,
          role: 'user',
          passwordHash,
          balance:
            Number.isFinite(balanceNum) && balanceNum >= 0 ? Math.floor(balanceNum) : 0,
          earnPasses: sanitizeEarnPassesMap(obj.earnPasses),
          transactions: sanitizeTransactionsList(obj.transactions),
          createdAt:
            typeof obj.createdAt === 'string' && obj.createdAt.trim()
              ? obj.createdAt.trim().slice(0, 64)
              : new Date().toISOString(),
        });
      }
    }

    const hasAdminBalance =
      typeof req.body?.adminBalance === 'number' &&
      Number.isFinite(req.body.adminBalance) &&
      req.body.adminBalance >= 0;
    const importedAdminEarnPasses =
      req.body?.adminEarnPasses !== undefined
        ? sanitizeEarnPassesMap(req.body.adminEarnPasses)
        : null;
    const importedAdminTransactions =
      req.body?.adminTransactions !== undefined
        ? sanitizeTransactionsList(req.body.adminTransactions)
        : null;

    try {
      const result = await withDbLock(async () => {
        const db = await readDb();
        db.games = sanitizedGames;
        if (sanitizedEarnLinks !== null) {
          db.earnLinks = sanitizedEarnLinks;
        }
        if (sanitizedUsers !== null) {
          db.users = sanitizedUsers;
        }
        if (hasAdminBalance) {
          db.adminBalance = Math.floor(req.body.adminBalance);
        }
        if (importedAdminEarnPasses !== null) {
          db.adminEarnPasses = importedAdminEarnPasses;
        }
        if (importedAdminTransactions !== null) {
          db.adminTransactions = importedAdminTransactions;
        }
        bumpServerCycle(db);
        await writeDbAtomic(db);
        return db;
      });
      broadcastServerUpdate(result, 'backup-imported');
      res.json({
        games: result.games,
        earnLinks: result.earnLinks,
        leaderboard: buildLeaderboard(result),
        usersCount: result.users.length + 1,
        countdownEndTime: result.countdownEndTime,
        serverRevision: result.serverRevision,
        lastUpdatedAt: result.lastUpdatedAt,
      });
    } catch {
      res.status(500).json({ error: 'Không thể khôi phục dữ liệu sao lưu.' });
    }
  });

  // Mount Vite middleware in dev, or serve static dist in production
  const { existsSync } = await import('node:fs');
  const distDir = path.resolve(process.cwd(), 'dist');
  const distIndex = path.resolve(distDir, 'index.html');
  const isDev = process.env.NODE_ENV === 'development' || !existsSync(distIndex);

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.use((_req: Request, res: Response) => {
      res.sendFile(distIndex);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`taigamekid server listening on http://0.0.0.0:${PORT}`);
  });
}

createApp();
