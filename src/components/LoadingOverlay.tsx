import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
}

export function LoadingOverlay({
  isVisible,
  message = 'Đang đồng bộ dữ liệu...',
  subMessage = 'Vui lòng chờ trong giây lát',
}: LoadingOverlayProps) {
  const [imgError, setImgError] = useState(false);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#07080D]/80 px-6 backdrop-blur-md touch-none select-none transition-opacity duration-200"
    >
      <div className="flex max-w-xs flex-col items-center justify-center gap-4 text-center">
        {/* Cyan spinning ring wrapping the loading emblem */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute inset-1 rounded-full bg-cyan-400/20 blur-xl"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2 border-cyan-400/15"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-cyan-400 border-r-cyan-300/80 animate-spin motion-reduce:animate-none"
          />

          <div className="relative h-[74px] w-[74px] overflow-hidden rounded-full border border-cyan-400/45 bg-[#0D1019] shadow-2xl">
            {!imgError ? (
              <img
                src="/assets/aistudio/IMG_5174_5bb3bb64.jpeg"
                alt="Đang tải dữ liệu taigamekid"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500/25 to-purple-500/25 text-cyan-300">
                <Gamepad2 className="h-8 w-8" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-display text-sm font-semibold tracking-wide text-white sm:text-base">
            {message}
          </p>
          {subMessage && (
            <p className="text-xs text-cyan-200/80">{subMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
