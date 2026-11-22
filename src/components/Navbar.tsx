import { useState } from 'react';
import { LogOut, Menu, Shield, User, X } from 'lucide-react';
import { UserAccount } from '../types/game';

export type ActiveView = 'home' | 'detail' | 'admin';

interface NavbarProps {
  currentUser: UserAccount | null;
  activeView: ActiveView;
  onNavigateHome: () => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export function Navbar({
  currentUser,
  activeView,
  onNavigateHome,
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

  return (
    <header className="sticky top-9 z-40 h-14 w-full border-b border-white/10 bg-[#07080D]/90 backdrop-blur-lg">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Brand logo & wordmark */}
        <button
          type="button"
          onClick={() => handleLinkClick()}
          className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg"
        >
          <img
            src="/assets/aistudio/IMG_5174_5bb3bb64.jpeg"
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
            onClick={() => handleLinkClick()}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-cyan-300 ${
              activeView === 'home' ? 'text-white' : 'text-slate-400'
            }`}
          >
            Trang chủ
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('catalog-section')}
            className="whitespace-nowrap shrink-0 text-slate-400 transition-colors cursor-pointer hover:text-cyan-300"
          >
            Kho Game
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
              <span>Quản lý Game (Admin)</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Auth actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-200 whitespace-nowrap">
                <User className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <span className="max-w-[140px] truncate font-medium">
                  {currentUser.displayName}
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
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="neon-btn-primary rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          className="inline-flex md:hidden items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0B0D16] px-4 py-4 space-y-3">
          <div className="flex flex-col gap-2 text-sm">
            <button
              type="button"
              onClick={() => handleLinkClick()}
              className="w-full rounded-lg px-3 py-2.5 text-left font-medium text-slate-200 hover:bg-white/5"
            >
              Trang chủ
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('catalog-section')}
              className="w-full rounded-lg px-3 py-2.5 text-left font-medium text-slate-200 hover:bg-white/5"
            >
              Kho Game
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
                <span>Quản lý Game (Admin)</span>
              </button>
            )}
          </div>

          <div className="border-t border-white/10 pt-3">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <User className="h-4 w-4 text-cyan-400" />
                  <span className="font-medium">{currentUser.displayName}</span>
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
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 py-2.5 text-center text-xs font-semibold text-slate-100"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  className="neon-btn-primary rounded-lg py-2.5 text-center text-xs font-semibold text-white"
                >
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
