import { useEffect, useState } from 'react';
import { AlertCircle, Cloud, ShieldCheck, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  noticeMessage?: string | null;
  onClose: () => void;
  onGoogleLogin: () => Promise<{ ok: boolean; error?: string }>;
}

export function AuthModal({
  isOpen,
  noticeMessage,
  onClose,
  onGoogleLogin,
}: AuthModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setError(null);
    setIsSubmitting(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    const res = await onGoogleLogin();
    setIsSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? 'Đăng nhập Google không thành công.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0D1019] p-6 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp thoại"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
          <Cloud className="h-5 w-5" aria-hidden="true" />
        </div>

        <h2 id="auth-modal-title" className="font-display text-xl font-bold text-white">
          Đăng nhập taigamekid
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
          Đăng nhập bằng tài khoản Google để tự động lưu và đồng bộ vĩnh viễn kho game, số dư tiền thưởng, nhiệm vụ vượt link và bảng xếp hạng trên mọi thiết bị.
        </p>

        {noticeMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 text-xs text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-rose-500/10 p-3 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleGoogleSignIn}
            className="neon-btn-primary flex w-full min-h-[46px] items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60 cursor-pointer"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.24-.92 2.29-1.97 2.99v2.48h3.18c1.86-1.71 2.69-4.24 2.69-7.24 0-.59-.06-1.17-.17-1.72l.17.51z"
              />
              <path
                fill="currentColor"
                d="M12.18 21.5c2.66 0 4.9-.88 6.53-2.39l-3.18-2.48c-.88.59-2.01.95-3.35.95-2.57 0-4.75-1.74-5.53-4.07H3.37v2.56c1.62 3.22 4.95 5.43 8.81 5.43z"
              />
              <path
                fill="currentColor"
                d="M6.65 13.51c-.2-.59-.31-1.22-.31-1.88s.11-1.29.31-1.88V7.19H3.37A9.82 9.82 0 0 0 2.34 11.63c0 1.59.38 3.09 1.03 4.44l3.28-2.56z"
              />
              <path
                fill="currentColor"
                d="M12.18 5.68c1.45 0 2.75.5 3.77 1.48l2.83-2.83C17.07 2.72 14.84 1.76 12.18 1.76c-3.86 0-7.19 2.21-8.81 5.43l3.28 2.56c.78-2.33 2.96-4.07 5.53-4.07z"
              />
            </svg>
            <span>{isSubmitting ? 'Đang kết nối Google...' : 'Đăng nhập với Google'}</span>
          </button>

          <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-[#07080D] p-3 text-[11px] leading-relaxed text-slate-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-300 mt-0.5" aria-hidden="true" />
            <span>
              Chỉ cần đăng nhập cùng một tài khoản Google ở bất kỳ máy tính hoặc điện thoại nào, toàn bộ số dư tiền, lịch sử vượt link và danh sách game đều giữ nguyên 100%.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
