import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { AnnouncementBar } from './components/AnnouncementBar';
import { AuthModal } from './components/AuthModal';
import { GameCatalog } from './components/GameCatalog';
import { GameDetailView } from './components/GameDetailView';
import { GameFormInput } from './components/GameFormModal';
import { GuideSection } from './components/GuideSection';
import { HeroSection } from './components/HeroSection';
import { ActiveView, Navbar } from './components/Navbar';
import { DataSave } from './services/dataSave';
import { DataSavePayload, GameItem, UserAccount } from './types/game';

const THIRTY_HOURS_MS = 30 * 60 * 60 * 1000;

export default function App() {
  const [dataState, setDataState] = useState<DataSavePayload>(() => DataSave.loadInitialSync());
  const [sessionUserId, setSessionUserId] = useState<string | null>(() =>
    DataSave.loadSessionUserId()
  );

  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hydrate from IndexedDB on mount so large/durable DataSave overrides stale state if needed
  useEffect(() => {
    let mounted = true;
    DataSave.hydrateFromDurableStore().then((hydrated) => {
      if (mounted) {
        setDataState(hydrated);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const currentUser: UserAccount | null = useMemo(() => {
    if (!sessionUserId) return null;
    return dataState.users.find((u) => u.id === sessionUserId) ?? null;
  }, [dataState.users, sessionUserId]);

  const selectedGame: GameItem | null = useMemo(() => {
    if (!selectedGameId) return null;
    return dataState.games.find((g) => g.id === selectedGameId) ?? null;
  }, [dataState.games, selectedGameId]);

  // If selected game was deleted or admin logged out while on admin panel, return home cleanly
  useEffect(() => {
    if (activeView === 'detail' && !selectedGame) {
      setActiveView('home');
    }
    if (activeView === 'admin' && currentUser?.role !== 'admin') {
      setActiveView('home');
    }
  }, [activeView, selectedGame, currentUser]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  const persistState = useCallback((updater: (prev: DataSavePayload) => DataSavePayload) => {
    setDataState((prev) => {
      const next = updater(prev);
      void DataSave.saveState(next);
      return next;
    });
  }, []);

  const handleResetCountdown = useCallback(() => {
    persistState((prev) => ({
      ...prev,
      countdownEndTime: Date.now() + THIRTY_HOURS_MS,
    }));
  }, [persistState]);

  const handleScrollToSection = useCallback((sectionId: string) => {
    setActiveView('home');
    setSelectedGameId(null);
    window.setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }, []);

  const handleNavigateHome = useCallback(() => {
    setActiveView('home');
    setSelectedGameId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectGame = useCallback((game: GameItem) => {
    setSelectedGameId(game.id);
    setActiveView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenAuth = useCallback((mode: 'login' | 'register', notice: string | null = null) => {
    setAuthModalMode(mode);
    setAuthNotice(notice);
    setAuthModalOpen(true);
  }, []);

  const handleRequireAuthForDownload = useCallback(() => {
    showToast('Vui lòng đăng nhập để tải game miễn phí!');
    handleOpenAuth('login', 'Bạn cần đăng nhập tài khoản trước khi tải game về máy.');
  }, [handleOpenAuth, showToast]);

  const handleLogin = useCallback(
    (username: string, password: string): { ok: boolean; error?: string } => {
      const cleanUsername = username.trim().toLowerCase();
      const matched = dataState.users.find(
        (u) => u.username.toLowerCase() === cleanUsername && u.password === password
      );
      if (!matched) {
        return { ok: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
      }
      setSessionUserId(matched.id);
      DataSave.saveSessionUserId(matched.id);
      setAuthModalOpen(false);
      setAuthNotice(null);
      showToast(`Chào mừng ${matched.displayName} đã quay trở lại!`);
      return { ok: true };
    },
    [dataState.users, showToast]
  );

  const handleRegister = useCallback(
    (
      username: string,
      displayName: string,
      password: string
    ): { ok: boolean; error?: string } => {
      const cleanUsername = username.trim();
      const exists = dataState.users.some(
        (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (exists) {
        return { ok: false, error: 'Tên đăng nhập này đã được sử dụng.' };
      }
      const newUser: UserAccount = {
        id: `user-${Date.now()}`,
        username: cleanUsername,
        password,
        displayName: displayName.trim() || cleanUsername,
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      persistState((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
      }));
      setSessionUserId(newUser.id);
      DataSave.saveSessionUserId(newUser.id);
      setAuthModalOpen(false);
      setAuthNotice(null);
      showToast('Đăng ký thành công! Bạn đã có thể tải game ngay.');
      return { ok: true };
    },
    [dataState.users, persistState, showToast]
  );

  const handleLogout = useCallback(() => {
    setSessionUserId(null);
    DataSave.saveSessionUserId(null);
    if (activeView === 'admin') {
      setActiveView('home');
    }
    showToast('Bạn đã đăng xuất khỏi tài khoản.');
  }, [activeView, showToast]);

  const handleRecordDownload = useCallback(
    (gameId: string) => {
      persistState((prev) => ({
        ...prev,
        games: prev.games.map((g) =>
          g.id === gameId ? { ...g, downloadsCount: (g.downloadsCount || 0) + 1 } : g
        ),
      }));
      showToast('Đã mở khóa liên kết tải xuống tốc độ cao.');
    },
    [persistState, showToast]
  );

  const handleAddGame = useCallback(
    (input: GameFormInput) => {
      const newGame: GameItem = {
        id: `game-${Date.now()}`,
        ...input,
        updatedAt: new Date().toISOString(),
        downloadsCount: 0,
      };
      persistState((prev) => ({
        ...prev,
        games: [newGame, ...prev.games],
      }));
    },
    [persistState]
  );

  const handleUpdateGame = useCallback(
    (id: string, input: GameFormInput) => {
      persistState((prev) => ({
        ...prev,
        games: prev.games.map((g) =>
          g.id === id
            ? {
                ...g,
                ...input,
                updatedAt: new Date().toISOString(),
              }
            : g
        ),
      }));
    },
    [persistState]
  );

  const handleDeleteGame = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        games: prev.games.filter((g) => g.id !== id),
      }));
    },
    [persistState]
  );

  const handleExportBackup = useCallback(() => {
    const jsonContent = DataSave.createBackupBlob(dataState);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `taigamekid-backup-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [dataState]);

  const handleImportBackup = useCallback(
    (jsonText: string): { ok: boolean; message: string } => {
      try {
        const nextState = DataSave.parseAndValidateBackup(jsonText, dataState);
        setDataState(nextState);
        void DataSave.saveState(nextState);
        return {
          ok: true,
          message: `Đã khôi phục thành công ${nextState.games.length} tựa game từ tệp sao lưu.`,
        };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : 'Tệp sao lưu JSON không hợp lệ.',
        };
      }
    },
    [dataState]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#07080D] text-slate-100">
      {/* Fixed Top Announcement Countdown Bar */}
      <AnnouncementBar
        countdownEndTime={dataState.countdownEndTime}
        onResetCountdown={handleResetCountdown}
      />

      {/* Sticky 3-Zone Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onNavigateHome={handleNavigateHome}
        onScrollToSection={handleScrollToSection}
        onOpenAuth={(mode) => handleOpenAuth(mode, null)}
        onOpenAdmin={() => {
          setActiveView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLogout={handleLogout}
      />

      {/* Non-intrusive Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-cyan-400/45 bg-[#0D111C]/95 px-4 py-3 text-xs font-medium text-cyan-100 shadow-2xl backdrop-blur-md neon-border-cyan"
        >
          {toastMessage}
        </div>
      )}

      {/* Main Content View Router */}
      <div className="flex-1">
        {activeView === 'admin' && currentUser?.role === 'admin' ? (
          <AdminPanel
            games={dataState.games}
            users={dataState.users}
            onBack={handleNavigateHome}
            onAddGame={handleAddGame}
            onUpdateGame={handleUpdateGame}
            onDeleteGame={handleDeleteGame}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        ) : activeView === 'detail' && selectedGame ? (
          <GameDetailView
            game={selectedGame}
            currentUser={currentUser}
            onBack={handleNavigateHome}
            onRequireAuth={handleRequireAuthForDownload}
            onRecordDownload={handleRecordDownload}
          />
        ) : (
          <main>
            <HeroSection
              totalGames={dataState.games.length}
              featuredGame={dataState.games[0] ?? null}
              onExploreCatalog={() => handleScrollToSection('catalog-section')}
              onSelectFeatured={handleSelectGame}
            />
            <GameCatalog games={dataState.games} onSelectGame={handleSelectGame} />
            <GuideSection />
          </main>
        )}
      </div>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-white/10 bg-[#06070B] py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/IMG_5174_5bb3bb64.jpeg"
              alt="Logo taigamekid"
              className="h-7 w-7 rounded-lg border border-cyan-400/35 object-cover"
            />
            <span className="font-display text-sm font-bold text-slate-200">
              taigame<span className="text-cyan-400">kid</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Kho tải game PC miễn phí & an toàn</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={handleNavigateHome}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Trang chủ
            </button>
            <button
              type="button"
              onClick={() => handleScrollToSection('catalog-section')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Kho Game
            </button>
            <button
              type="button"
              onClick={() => handleScrollToSection('guide-section')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Hướng dẫn
            </button>
          </div>
        </div>
      </footer>

      {/* Login / Register Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        noticeMessage={authNotice}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthNotice(null);
        }}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}
