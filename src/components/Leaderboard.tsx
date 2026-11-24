import { Crown, Medal, Trophy } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string | null;
}

export function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0D1019]">
      <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-300" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold text-white">
              Leaderboard
            </h2>
            <span className="text-xs text-slate-400">
              · Top 10 người dùng số dư cao nhất
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Cập nhật trực tiếp theo số dư tích lũy từ các lượt vượt link thành công.
          </p>
        </div>
        <span className="font-mono text-xs text-cyan-300 tabular-nums">
          Top {Math.min(10, entries.length)} / 10
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-300">
            Chưa có thành viên nào trên bảng xếp hạng
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Hãy đăng ký tài khoản và vượt link kiếm tiền để giữ vị trí Top 1 đầu tiên.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#090B12] text-xs font-medium text-slate-400">
                <th className="px-5 py-3 w-20">Hạng</th>
                <th className="px-5 py-3">Thành viên</th>
                <th className="px-5 py-3 text-right">Nhiệm vụ đã vượt</th>
                <th className="px-5 py-3 text-right">Số dư hiện tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {entries.slice(0, 10).map((entry, idx) => {
                const rank = idx + 1;
                const isMe = Boolean(currentUserId && entry.id === currentUserId);

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isMe
                        ? 'bg-cyan-500/10 hover:bg-cyan-500/15'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold whitespace-nowrap">
                      {rank === 1 ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-300">
                          <Crown className="h-4 w-4" aria-hidden="true" />
                          <span>#1</span>
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-200">
                          <Medal className="h-4 w-4" aria-hidden="true" />
                          <span>#2</span>
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex items-center gap-1.5 text-orange-300">
                          <Medal className="h-4 w-4" aria-hidden="true" />
                          <span>#3</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">#{rank}</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            rank === 1
                              ? 'text-amber-200'
                              : isMe
                                ? 'text-cyan-200'
                                : 'text-white'
                          }`}
                        >
                          {entry.displayName}
                        </span>
                        {isMe && (
                          <span className="font-mono text-[11px] font-semibold text-cyan-300">
                            (Bạn)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-xs text-purple-300 tabular-nums whitespace-nowrap">
                      {entry.completedTasks.toLocaleString('vi-VN')} lượt
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold text-cyan-300 tabular-nums whitespace-nowrap">
                      {entry.balance.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
