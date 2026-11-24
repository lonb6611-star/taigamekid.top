import { useState } from 'react';
import { Coins, Gamepad2, LogOut, Menu, Shield, User, X } from 'lucide-react';
import { UserAccount } from '../types/game';

export type ActiveView = 'home' | 'detail' | 'admin';
export type HomeTab = 'games' | 'earn' | 'account';

interface NavbarProps {
  currentUser: UserAccount | null;
  activeView: ActiveView;
  homeTab: HomeTab;
  gamesCount: number;
  earnLinksCount: number;
  onNavigateHome: () => void;
  onSelectHomeTab: (tab: HomeTab) => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export function Navbar({
  currentUser,
  activeView,
  homeTab,
  gamesCount,
  earnLinksCount,
  onNavigateHome,
  onSelectHomeTab,
  onScrollToSection,
  onOpenAuth,
  onOpenAdmin,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (sectionId?: string) => {
    setMobileMenuOpen(false);
    if (sectionId) {
      onScrollToSection(sectionId);
    } else {
      onNavigateHome();
    }
  };

  const handleTabSelect = (tab: HomeTab) => {
    setMobileMenuOpen(false);
    onSelectHomeTab(tab);
  };

  return (
    <header className="sticky top-8 sm:top-9 z-40 w-full border-b border-white/10 bg-[#07080D]/92 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-6 sm:gap-8 px-4 sm:px-6">
        {/* Zone 1: Brand logo & wordmark */}
        <button
          type="button"
          onClick={() => handleLinkClick()}
          className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg"
        >
          <img
            src="/assets/logo-taigamekid.jpeg"
            alt="Logo taigamekid"
            className="h-8 w-8 rounded-lg border border-cyan-400/45 object-cover shadow-[0_0_12px_-3px_rgba(34,211,238,0.45)]"
          />
          <span>
            taigame<span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">kid</span>
          </span>
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => handleTabSelect('games')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-cyan-300 ${
              activeView === 'home' && homeTab === 'games' ? 'text-white' : 'text-slate-400'
            }`}
          >
            Tải Game
          </button>
          <button
            type="button"
            onClick={() => handleTabSelect('earn')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-cyan-300 ${
              activeView === 'home' && homeTab === 'earn' ? 'text-white' : 'text-slate-400'
            }`}
          >
            Kiếm tiền
          </button>
          <button
            type="button"
            onClick={() => handleTabSelect('account')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-cyan-300 ${
              activeView === 'home' && homeTab === 'account' ? 'text-white' : 'text-slate-400'
            }`}
          >
            Tài khoản
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('guide-section')}
            className="whitespace-nowrap shrink-0 text-slate-400 transition-colors cursor-pointer hover:text-cyan-300"
          >
            Hướng dẫn
          </button>
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'admin'
                  ? 'border-purple-400/60 bg-purple-500/20 text-purple-200 neon-border-purple'
                  : 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20'
              }`}
            >
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Quản lý (Admin)</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Auth actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-200 whitespace-nowrap">
                <User className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <span className="max-w-[120px] truncate font-medium">
                  {currentUser.displayName}
                </span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="font-mono text-xs font-semibold text-cyan-300 tabular-nums">
                  {(currentUser.balance || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-white/30 hover:bg-white/10 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="neon-btn-primary rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              Đăng nhập Google
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          className="inline-flex md:hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Top Mode Switcher Bar: Tải Game, Kiếm tiền & Tài khoản (always visible at the top) */}
      <div className="border-t border-white/8 bg-[#070910]/95">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div
            role="tablist"
            aria-label="Chọn mục chính trên đầu trang"
            className="grid w-full grid-cols-3 gap-1 rounded-xl border border-white/10 bg-[#0D111C] p-1 sm:w-auto sm:min-w-[430px]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'home' && homeTab === 'games'}
              onClick={() => handleTabSelect('games')}
              className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'home' && homeTab === 'games'
                  ? 'border border-cyan-400/50 bg-cyan-500/15 text-cyan-200 shadow-[0_0_16px_-6px_rgba(34,211,238,0.65)]'
                  : 'border border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Tải Game</span>
              <span className="hidden sm:inline font-mono text-[11px] opacity-80 tabular-nums">
                ({gamesCount})
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'home' && homeTab === 'earn'}
              onClick={() => handleTabSelect('earn')}
              className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'home' && homeTab === 'earn'
                  ? 'border border-purple-400/55 bg-purple-500/20 text-purple-200 shadow-[0_0_16px_-6px_rgba(168,85,247,0.65)]'
                  : 'border border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Kiếm tiền</span>
              <span className="hidden sm:inline font-mono text-[11px] opacity-80 tabular-nums">
                ({earnLinksCount})
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'home' && homeTab === 'account'}
              onClick={() => handleTabSelect('account')}
              className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'home' && homeTab === 'account'
                  ? 'border border-cyan-400/50 bg-cyan-500/15 text-cyan-200 shadow-[0_0_16px_-6px_rgba(34,211,238,0.65)]'
                  : 'border border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Tài khoản</span>
            </button>
          </div>

          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>Số dư:</span>
              <span className="font-mono font-semibold text-cyan-300 tabular-nums">
                {(currentUser.balance || 0).toLocaleString('vi-VN')} đ
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0B0D16] px-4 py-4 space-y-3">
          <div className="flex flex-col gap-2 text-sm">
            <button
              type="button"
              onClick={() => handleTabSelect('games')}
              className="w-full rounded-lg px-3 py-2.5 text-left font-medium text-slate-200 hover:bg-white/5"
            >
              Tải Game
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('earn')}
              className="w-full rounded-lg px-3 py-2.5 text-left font-medium text-slate-200 hover:bg-white/5"
            >
              Kiếm tiền
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('account')}
              className="w-full rounded-lg px-3 py-2.5 text-left font-medium text-slate-200 hover:bg-white/5"
            >
              Tài khoản
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('guide-section')}
              className="w-full rounded-lg px-3 py-2.5 text-left font-medium text-slate-200 hover:bg-white/5"
            >
              Hướng dẫn
            </button>
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2.5 text-left font-semibold text-cyan-200"
              >
                <Shield className="h-4 w-4" />
                <span>Quản lý (Admin)</span>
              </button>
            )}
          </div>

          <div className="border-t border-white/10 pt-3">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <User className="h-4 w-4 text-cyan-400" />
                  <span className="font-medium">{currentUser.displayName}</span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="font-mono text-xs font-semibold text-cyan-300 tabular-nums">
                    {(currentUser.balance || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="neon-btn-primary w-full rounded-lg py-2.5 text-center text-xs font-semibold text-white cursor-pointer"
              >
                Đăng nhập với Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
