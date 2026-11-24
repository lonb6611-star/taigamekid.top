import { CalendarClock, Shield, X } from 'lucide-react';

interface MaintenanceScreenProps {
  maintenanceEndTime: number;
  maintenanceMessage: string;
  nowMs: number;
  isAdminPreview?: boolean;
  onExitPreview?: () => void;
  onOpenAdminLogin?: () => void;
}

function formatReopenDateTime(ms: number): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleString('vi-VN');
  }
}

function formatRemaining(diffMs: number): {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
} {
  const totalSec = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

export function MaintenanceScreen({
  maintenanceEndTime,
  maintenanceMessage,
  nowMs,
  isAdminPreview = false,
  onExitPreview,
  onOpenAdminLogin,
}: MaintenanceScreenProps) {
  const hasSchedule = maintenanceEndTime > 0;
  const remainingMs = hasSchedule ? Math.max(0, maintenanceEndTime - nowMs) : 0;
  const countdown = formatRemaining(remainingMs);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#07080D] px-4 py-10 text-slate-100">
      <div className="w-full max-w-lg rounded-3xl border border-rose-500/35 bg-[#0D1019] p-7 text-center shadow-[0_0_60px_-18px_rgba(244,63,94,0.45)] sm:p-10">
        {/* Giant prominent X symbol */}
        <div
          className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-rose-500/70 bg-rose-500/15 shadow-[0_0_40px_-6px_rgba(244,63,94,0.75)] sm:h-36 sm:w-36"
          aria-hidden="true"
        >
          <X className="h-24 w-24 text-rose-400 sm:h-28 sm:w-28" strokeWidth={3.25} />
        </div>

        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Web đang bảo trì
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
          {maintenanceMessage.trim()
            ? maintenanceMessage
            : 'Hệ thống taigamekid đang tạm dừng để bảo trì và nâng cấp dữ liệu. Mong bạn thông cảm và quay lại sau!'}
        </p>

        {hasSchedule ? (
          <div className="mt-6 rounded-2xl border border-cyan-400/30 bg-[#080A11] p-5">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-cyan-300">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              <span>Tự động mở lại sau ngày:</span>
            </div>
            <p className="mt-1.5 font-mono text-base font-bold text-white sm:text-lg">
              {formatReopenDateTime(maintenanceEndTime)}
            </p>

            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl border border-white/10 bg-[#0D1019] py-2.5">
                <p className="font-mono text-xl font-bold text-rose-300 tabular-nums">
                  {countdown.days}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Ngày</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0D1019] py-2.5">
                <p className="font-mono text-xl font-bold text-rose-300 tabular-nums">
                  {countdown.hours}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Giờ</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0D1019] py-2.5">
                <p className="font-mono text-xl font-bold text-rose-300 tabular-nums">
                  {countdown.minutes}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Phút</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0D1019] py-2.5">
                <p className="font-mono text-xl font-bold text-cyan-300 tabular-nums">
                  {countdown.seconds}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Giây</p>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              Khi hết thời gian trên, trang web sẽ tự động mở lại ngay lập tức.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#080A11] p-4 text-xs text-slate-400">
            Trang web đang tạm khóa cho đến khi Quản trị viên hoàn tất bảo trì.
          </div>
        )}

        <div className="mt-7 flex flex-col items-center justify-center gap-3">
          {isAdminPreview && onExitPreview ? (
            <button
              type="button"
              onClick={onExitPreview}
              className="neon-btn-primary inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs font-semibold text-white cursor-pointer"
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              <span>Đóng xem trước (Quay lại Admin)</span>
            </button>
          ) : (
            onOpenAdminLogin && (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-cyan-400/40 hover:text-cyan-200 cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Đăng nhập Quản trị viên (Admin)</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
