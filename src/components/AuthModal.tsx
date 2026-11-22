import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  noticeMessage?: string | null;
  onClose: () => void;
  onLogin: (username: string, password: string) => { ok: boolean; error?: string };
  onRegister: (
    username: string,
    displayName: string,
    password: string
  ) => { ok: boolean; error?: string };
}

export function AuthModal({
  isOpen,
  initialMode,
  noticeMessage,
  onClose,
  onLogin,
  onRegister,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setUsername('');
    setDisplayName('');
    setPassword('');
    setConfirmPassword('');
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'login') {
      const res = onLogin(username, password);
      if (!res.ok) {
        setError(res.error ?? 'Đăng nhập không thành công.');
      }
      return;
    }

    if (username.trim().length < 3) {
      setError('Tên đăng nhập cần ít nhất 3 ký tự.');
      return;
    }
    if (password.length < 4) {
      setError('Mật khẩu cần ít nhất 4 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    const res = onRegister(username, displayName || username, password);
    if (!res.ok) {
      setError(res.error ?? 'Đăng ký không thành công.');
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

        {/* Mode Switch Tabs */}
        <div className="mb-5 flex w-fit items-center gap-1 rounded-lg border border-white/10 bg-[#07080D] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400 hover:text-white'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-purple-500/20 text-purple-200'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đăng ký
          </button>
        </div>

        <h2 id="auth-modal-title" className="font-display text-xl font-bold text-white">
          {mode === 'login' ? 'Đăng nhập taigamekid' : 'Tạo tài khoản mới'}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {mode === 'login'
            ? 'Đăng nhập để tải toàn bộ game miễn phí tốc độ cao.'
            : 'Đăng ký nhanh để mở khóa quyền tải game và lưu phiên làm việc.'}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="auth-username" className="block text-xs font-medium text-slate-300">
              Tên đăng nhập
            </label>
            <input
              id="auth-username"
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ví dụ: player01"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-displayname"
                className="block text-xs font-medium text-slate-300"
              >
                Tên hiển thị
              </label>
              <input
                id="auth-displayname"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ví dụ: Minh Tuấn"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-slate-300">
              Mật khẩu
            </label>
            <input
              id="auth-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-confirm-password"
                className="block text-xs font-medium text-slate-300"
              >
                Xác nhận mật khẩu
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
          )}

          <button
            type="submit"
            className="neon-btn-primary w-full rounded-xl py-3 text-sm font-semibold text-white transition-all cursor-pointer"
          >
            {mode === 'login' ? 'Đăng nhập ngay' : 'Hoàn tất đăng ký'}
          </button>
        </form>
      </div>
    </div>
  );
}
