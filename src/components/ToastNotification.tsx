import { CheckCircle2, Coins, X } from 'lucide-react';

export interface ToastData {
  id: number;
  message: string;
  variant: 'default' | 'reward';
  rewardAmount?: number;
  newBalance?: number;
}

interface ToastNotificationProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export function ToastNotification({ toast, onDismiss }: ToastNotificationProps) {
  if (!toast) return null;

  const isReward = toast.variant === 'reward';

  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 right-4 z-50 overflow-hidden rounded-2xl border backdrop-blur-md shadow-2xl sm:bottom-5 sm:left-auto sm:right-5 sm:w-full sm:max-w-sm ${
        isReward
          ? 'animate-toast-reward border-cyan-400/60 bg-[#0D1324]/95 shadow-[0_14px_42px_-10px_rgba(34,211,238,0.5)]'
          : 'animate-toast-in border-cyan-400/40 bg-[#0D111C]/95 neon-border-cyan'
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
            isReward
              ? 'border-cyan-400/50 bg-gradient-to-br from-cyan-500/25 to-purple-500/25 text-cyan-300'
              : 'border-cyan-400/35 bg-cyan-500/10 text-cyan-300'
          }`}
        >
          {isReward ? (
            <Coins className="h-4 w-4" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {isReward ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-xs font-bold tracking-wide text-white">
                  Nhận thưởng thành công!
                </p>
                {typeof toast.rewardAmount === 'number' && (
                  <span className="font-mono text-xs font-bold text-cyan-300 tabular-nums">
                    +{toast.rewardAmount.toLocaleString('vi-VN')} đ
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-300">
                {toast.message}
              </p>
              {typeof toast.newBalance === 'number' && (
                <p className="mt-1 font-mono text-[11px] font-semibold text-purple-300 tabular-nums">
                  Số dư hiện tại: {toast.newBalance.toLocaleString('vi-VN')} đ
                </p>
              )}
            </>
          ) : (
            <p className="text-xs font-medium leading-relaxed text-cyan-100">
              {toast.message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Smooth countdown progress line */}
      <div className="h-0.5 w-full bg-white/5">
        <div
          className={`h-full w-full animate-toast-progress ${
            isReward
              ? 'bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400'
              : 'bg-cyan-400/75'
          }`}
        />
      </div>
    </div>
  );
}
