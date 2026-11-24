import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Coins,
  Gamepad2,
  History,
  Lock,
  LogOut,
  Search,
  Shield,
  User,
  Wallet,
} from 'lucide-react';
import { EarnLinkItem, LeaderboardEntry, UserAccount } from '../types/game';
import { Leaderboard } from './Leaderboard';

interface UserProfileProps {
  currentUser: UserAccount | null;
  earnLinks: EarnLinkItem[];
  leaderboard: LeaderboardEntry[];
  onOpenAuth: (mode: 'login' | 'register') => void;
  onNavigateEarn: () => void;
  onNavigateGames: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
}

function formatDetailedDateTime(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    const date = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
    const time = new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
    return { date, time };
  } catch {
    return { date: iso, time: '' };
  }
}

export function UserProfile({
  currentUser,
  earnLinks,
  leaderboard,
  onOpenAuth,
  onNavigateEarn,
  onNavigateGames,
  onOpenAdmin,
  onLogout,
}: UserProfileProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLinkId, setSelectedLinkId] = useState<string>('all');

  const totalCompletedTasks = useMemo(() => {
    if (!currentUser?.earnPasses) return currentUser?.transactions?.length ?? 0;
    return Object.values(currentUser.earnPasses).reduce(
      (sum, count) => sum + (typeof count === 'number' && count > 0 ? count : 0),
      0
    );
  }, [currentUser]);

  const participatedLinksCount = useMemo(() => {
    if (!currentUser?.earnPasses) return 0;
    return Object.values(currentUser.earnPasses).filter((count) => count > 0).length;
  }, [currentUser]);

  const transactions = useMemo(
    () => (Array.isArray(currentUser?.transactions) ? currentUser.transactions : []),
    [currentUser]
  );

  const uniqueTaskFilters = useMemo(() => {
    const map = new Map<string, string>();
    for (const tx of transactions) {
      if (!map.has(tx.linkId)) {
        map.set(tx.linkId, tx.linkTitle);
      }
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchesLink = selectedLinkId === 'all' || tx.linkId === selectedLinkId;
      const matchesSearch =
        !q ||
        tx.linkTitle.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q);
      return matchesLink && matchesSearch;
    });
  }, [transactions, searchQuery, selectedLinkId]);

  const filteredTotalReward = useMemo(
    () => filteredTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0),
    [filteredTransactions]
  );

  if (!currentUser) {
    return (
      <section id="account-section" className="bg-[#07080D] py-10 lg:py-14">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#0D1019] p-7 text-center sm:p-9">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-500/10 text-cyan-300">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              Tài khoản của bạn
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Đăng nhập bằng Google để theo dõi số dư tích lũy, tổng số nhiệm vụ vượt link đã hoàn thành và bảng chi tiết lịch sử nhận thưởng đồng bộ trên mọi thiết bị.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="neon-btn-primary min-h-[44px] rounded-xl px-6 py-2.5 text-sm font-semibold text-white cursor-pointer"
              >
                Đăng nhập với Google
              </button>
            </div>
          </div>

          <Leaderboard entries={leaderboard} currentUserId={null} />
        </div>
      </section>
    );
  }

  const userBalance = currentUser.balance ?? 0;

  return (
    <section id="account-section" className="bg-[#07080D] py-8 lg:py-10">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        {/* Profile Header */}
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
              <User className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {currentUser.displayName}
                </h1>
                <span className="font-mono text-xs text-slate-400">
                  {currentUser.email || `@${currentUser.username}`}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                {currentUser.role === 'admin'
                  ? 'Tài khoản Quản trị viên · Đồng bộ đám mây Firebase mọi thiết bị'
                  : 'Thành viên taigamekid · Số dư & lịch sử được lưu vĩnh viễn trên đám mây'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentUser.role === 'admin' && onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-purple-400/45 bg-purple-500/15 px-4 py-2 text-xs font-semibold text-purple-200 transition-colors hover:border-purple-400/70 hover:bg-purple-500/25 cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Vào trang Admin</span>
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-white/30 hover:bg-white/10 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Account Summary Metrics */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-cyan-400/30 bg-[#0D111C] p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Số dư hiện tại</span>
              <Wallet className="h-4 w-4 text-cyan-300" aria-hidden="true" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-cyan-300 tabular-nums sm:text-3xl">
              {userBalance.toLocaleString('vi-VN')} đ
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Tích lũy tự động sau mỗi lần nhập đúng mã vượt link
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0D1019] p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Nhiệm vụ đã hoàn thành</span>
              <CheckCircle2 className="h-4 w-4 text-purple-300" aria-hidden="true" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-white tabular-nums sm:text-3xl">
              {totalCompletedTasks.toLocaleString('vi-VN')}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Đã tham gia {participatedLinksCount}/{earnLinks.length} liên kết hiện có
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0D1019] p-5">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Thao tác nhanh</span>
                <Coins className="h-4 w-4 text-amber-300" aria-hidden="true" />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-200">
                Tiếp tục vượt link hoặc tải game
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onNavigateEarn}
                className="neon-btn-primary inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                <Coins className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Kiếm tiền</span>
              </button>
              <button
                type="button"
                onClick={onNavigateGames}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white cursor-pointer"
              >
                <Gamepad2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Tải Game</span>
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Earn-Link Reward History Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0D1019]">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <History className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                <h2 className="font-display text-lg font-semibold text-white">
                  Transaction History
                </h2>
                <span className="text-xs text-slate-400">
                  · Bảng chi tiết nhận thưởng vượt link
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Ghi nhận chi tiết từng lần nhập mã thành công gồm ngày giờ và số tiền đã cộng.
              </p>
            </div>

            {transactions.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {uniqueTaskFilters.length > 1 && (
                  <select
                    value={selectedLinkId}
                    onChange={(e) => setSelectedLinkId(e.target.value)}
                    aria-label="Lọc theo nhiệm vụ vượt link"
                    className="min-h-[40px] rounded-xl border border-white/10 bg-[#07080D] px-3 py-2 text-base sm:text-xs text-slate-200 focus:border-cyan-400/60 focus:outline-none"
                  >
                    <option value="all">Tất cả nhiệm vụ ({transactions.length})</option>
                    {uniqueTaskFilters.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                )}

                <div className="relative w-full sm:w-56">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên link hoặc mã..."
                    aria-label="Tìm kiếm lịch sử nhận thưởng"
                    className="min-h-[40px] w-full rounded-xl border border-white/10 bg-[#07080D] py-2 pl-8 pr-3 text-base sm:text-xs text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium text-slate-300">
                Chưa có giao dịch cộng thưởng nào
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Hãy hoàn thành nhiệm vụ vượt link và nhập mã xác nhận để ghi nhận giao dịch đầu tiên.
              </p>
              <button
                type="button"
                onClick={onNavigateEarn}
                className="neon-btn-primary mt-5 inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                <span>Đi tới mục Kiếm tiền</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-[#090B12] text-xs font-medium text-slate-400">
                    <th className="px-5 py-3">Mã GD</th>
                    <th className="px-5 py-3">Nhiệm vụ vượt link</th>
                    <th className="px-5 py-3">Ngày &amp; giờ nhận</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Số tiền nhận được</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-400">
                        Không tìm thấy lịch sử nhận thưởng phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx, idx) => {
                      const { date, time } = formatDetailedDateTime(tx.createdAt);
                      const shortCode = tx.id.replace(/^tx-/, '').slice(-6).toUpperCase();
                      return (
                        <tr key={tx.id} className="transition-colors hover:bg-white/[0.03]">
                          <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            #{filteredTransactions.length - idx} · {shortCode}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-white">
                            {tx.linkTitle}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300">
                              <CalendarClock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                              <span>{date}</span>
                              {time && (
                                <>
                                  <span className="text-slate-600" aria-hidden="true">·</span>
                                  <span className="text-slate-400">{time}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-medium text-emerald-300 whitespace-nowrap">
                            Đã cộng vào ví
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold text-cyan-300 tabular-nums whitespace-nowrap">
                            +{tx.amount.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredTransactions.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-white/10 bg-[#090B12] text-xs font-semibold">
                      <td colSpan={4} className="px-5 py-3 text-slate-300">
                        Tổng cộng ({filteredTransactions.length} lượt nhận thưởng)
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-cyan-300 tabular-nums whitespace-nowrap">
                        +{filteredTotalReward.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* Top 10 Balance Leaderboard */}
        <Leaderboard entries={leaderboard} currentUserId={currentUser.id} />
      </div>
    </section>
  );
}

