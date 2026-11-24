import { useEffect, useState } from 'react';
import { Clock, Zap } from 'lucide-react';

interface AnnouncementBarProps {
  countdownEndTime: number;
  lastUpdatedAt?: string | null;
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

export function AnnouncementBar({
  countdownEndTime,
  lastUpdatedAt,
  onResetCountdown,
}: AnnouncementBarProps) {
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    Math.max(0, countdownEndTime - Date.now())
  );
  const [justUpdated, setJustUpdated] = useState(false);

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

  useEffect(() => {
    if (!lastUpdatedAt) return;
    const updatedMs = Date.parse(lastUpdatedAt);
    if (!Number.isFinite(updatedMs)) return;
    const elapsed = Date.now() - updatedMs;
    if (elapsed >= 0 && elapsed < 12000) {
      setJustUpdated(true);
      const timeout = window.setTimeout(() => {
        setJustUpdated(false);
      }, 12000 - elapsed);
      return () => window.clearTimeout(timeout);
    }
    setJustUpdated(false);
  }, [lastUpdatedAt]);

  return (
    <div className="sticky top-0 z-50 h-8 sm:h-9 w-full border-b border-cyan-500/20 bg-[#080A12]/95 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-center gap-2 px-3 text-[11px] sm:px-4 sm:text-xs">
        {justUpdated ? (
          <>
            <Zap className="h-3.5 w-3.5 shrink-0 text-cyan-300" aria-hidden="true" />
            <span className="truncate font-semibold text-cyan-200">
              Đã reset &amp; cập nhật toàn máy chủ
            </span>
          </>
        ) : (
          <>
            <Clock className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
            <span className="truncate font-medium text-slate-200">
              Cập nhật game tức thì · Chu kỳ:
            </span>
          </>
        )}
        <span
          className="font-mono font-semibold tracking-wider text-cyan-300 tabular-nums shrink-0"
          aria-label="Đồng hồ đếm ngược chu kỳ máy chủ"
        >
          {formatRemainingTime(remainingMs)}
        </span>
      </div>
    </div>
  );
}
