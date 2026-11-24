import { useEffect, useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { isSafeHttpOrLocalUrl } from '../utils/url';

interface GameCoverImageProps {
  src: string;
  alt: string;
  title: string;
  className?: string;
  priority?: boolean;
}

export function GameCoverImage({
  src,
  alt,
  title,
  className = '',
  priority = false,
}: GameCoverImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || !isSafeHttpOrLocalUrl(src) || hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-[#0F1320] via-[#131829] to-[#1A122B] text-slate-300 select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="mb-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-cyan-300">
          <Gamepad2 className="h-7 w-7" />
        </div>
        <span className="max-w-[85%] truncate px-4 text-center text-sm font-medium text-slate-300">
          {title}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
