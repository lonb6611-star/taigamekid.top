import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface AnnouncementBarProps {
  countdownEndTime: number;
  onResetCountdown: () => void;
}

function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function AnnouncementBar({ countdownEndTime, onResetCountdown }: AnnouncementBarProps) {
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    Math.max(0, countdownEndTime - Date.now())
  );

  useEffect(() => {
    const update = () => {
      const diff = countdownEndTime - Date.now();
      if (diff <= 0) {
        onResetCountdown();
      } else {
        setRemainingMs(diff);
      }
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [countdownEndTime, onResetCountdown]);

  return (
    <div className="sticky top-0 z-50 h-9 w-full border-b border-cyan-500/20 bg-[#080A12]/95 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-center gap-2.5 px-4 text-xs sm:text-sm">
        <Clock className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
        <span className="truncate font-medium text-slate-200">
          Thông báo: Game sẽ cập nhật sau 30 giờ
        </span>
        <span className="text-slate-500" aria-hidden="true">
          ·
        </span>
        <span
          className="font-mono font-semibold tracking-wider text-cyan-300 tabular-nums shrink-0"
          aria-label="Đồng hồ đếm ngược cập nhật game"
        >
          {formatRemainingTime(remainingMs)}
        </span>
      </div>
    </div>
  );
}
