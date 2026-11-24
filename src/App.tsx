import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { AlertTriangle, Eye, Power } from 'lucide-react';
import { AnnouncementBar } from './components/AnnouncementBar';
import { EarnSection } from './components/EarnSection';
import { GameCatalog } from './components/GameCatalog';
import { GameFormInput } from './components/GameFormModal';
import { GuideSection } from './components/GuideSection';
import { HeroSection } from './components/HeroSection';
import { LoadingOverlay } from './components/LoadingOverlay';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { ActiveView, HomeTab, Navbar } from './components/Navbar';
import { ToastData, ToastNotification } from './components/ToastNotification';
import { UserProfile } from './components/UserProfile';
import { auth } from './firebase';
import { EarnLinkPayloadInput, FirestoreService } from './services/firestoreService';
import {
  EarnLinkItem,
  GameItem,
  LeaderboardEntry,
  TransactionItem,
  UserAccount,
} from './types/game';

const AdminPanel = lazy(() =>
  import('./components/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);
const GameDetailView = lazy(() =>
  import('./components/GameDetailView').then((m) => ({ default: m.GameDetailView }))
);
const AuthModal = lazy(() =>
  import('./components/AuthModal').then((m) => ({ default: m.AuthModal }))
);

const THIRTY_HOURS_MS = 30 * 60 * 60 * 1000;

export default function App() {
  const [games, setGames] = useState<GameItem[]>([]);
  const [rawEarnLinks, setRawEarnLinks] = useState<EarnLinkItem[]>([]);
  const [adminCodesById, setAdminCodesById] = useState<Record<string, string>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [countdownEndTime, setCountdownEndTime] = useState<number>(
    () => Date.now() + THIRTY_HOURS_MS
  );
  const [serverRevision, setServerRevision] = useState<number>(1);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [maintenanceActive, setMaintenanceActive] = useState<boolean>(false);
  const [maintenanceEndTime, setMaintenanceEndTime] = useState<number>(0);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>('');
  const [previewMaintenance, setPreviewMaintenance] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [adminUsersCount, setAdminUsersCount] = useState<number>(1);

  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserAccount | null>(null);
  const [userTransactions, setUserTransactions] = useState<TransactionItem[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const prevRevisionRef = useRef<number | null>(null);

  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [homeTab, setHomeTab] = useState<HomeTab>('games');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const toastCounterRef = useRef(0);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const activeOpsRef = useRef(0);

  const runWithLoading = useCallback(
    async <T,>(message: string, task: () => Promise<T>): Promise<T> => {
      activeOpsRef.current += 1;
      setLoadingMessage(message);
      try {
        return await task();
      } finally {
        activeOpsRef.current = Math.max(0, activeOpsRef.current - 1);
        if (activeOpsRef.current === 0) {
          setLoadingMessage(null);
        }
      }
    },
    []
  );

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (
      msg: string,
      options?: { variant?: 'default' | 'reward'; rewardAmount?: number; newBalance?: number }
    ) => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      const nextId = ++toastCounterRef.current;
      setToast({
        id: nextId,
        message: msg,
        variant: options?.variant ?? 'default',
        rewardAmount: options?.rewardAmount,
        newBalance: options?.newBalance,
      });
      toastTimerRef.current = window.setTimeout(() => {
        setToast((prev) => (prev?.id === nextId ? null : prev));
        toastTimerRef.current = null;
      }, 4200);
    },
    []
  );

  const currentUser: UserAccount | null = useMemo(() => {
    if (!userProfile) return null;
    return {
      ...userProfile,
      transactions: userTransactions,
    };
  }, [userProfile, userTransactions]);

  const earnLinks: EarnLinkItem[] = useMemo(() => {
    if (currentUser?.role !== 'admin') return rawEarnLinks;
    return rawEarnLinks.map((link) => ({
      ...link,
      passCode: adminCodesById[link.id] ?? link.passCode,
    }));
  }, [rawEarnLinks, currentUser?.role, adminCodesById]);

  const usersCount = useMemo(() => {
    if (currentUser?.role === 'admin') {
      return Math.max(1, adminUsersCount);
    }
    return Math.max(1, leaderboard.length);
  }, [currentUser?.role, adminUsersCount, leaderboard.length]);

  // 1. Track Firebase Auth state readiness
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUserProfile(null);
        setUserTransactions([]);
        setAdminCodesById({});
        setIsAuthReady(true);
        return;
      }

      try {
        const profile = await FirestoreService.ensureUserProfile(fbUser);
        setUserProfile(profile);
        if (profile.role === 'admin') {
          const seeded = await FirestoreService.seedInitialCatalogIfEmpty();
          if (seeded) {
            showToast('Đã khởi tạo dữ liệu mẫu lên Firebase Cloud Firestore!');
          }
        }
      } catch (err) {
        console.error('Failed to sync user profile:', err);
      } finally {
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [showToast]);

  // 2. Attach public Cloud Firestore real-time listeners once auth is ready
  useEffect(() => {
    if (!isAuthReady) return;

    let gamesLoaded = false;
    let linksLoaded = false;
    const markInitialDone = () => {
      if (gamesLoaded && linksLoaded) {
        setIsLoadingInitial(false);
      }
    };

    const unsubGames = FirestoreService.subscribeGames((list) => {
      setGames(list);
      gamesLoaded = true;
      markInitialDone();
    });

    const unsubLinks = FirestoreService.subscribeEarnLinks((list) => {
      setRawEarnLinks(list);
      linksLoaded = true;
      markInitialDone();
    });

    const unsubLeaderboard = FirestoreService.subscribeLeaderboard((entries) => {
      setLeaderboard(entries);
    });

    const unsubMeta = FirestoreService.subscribeSiteMeta((meta) => {
      if (!meta) return;
      setCountdownEndTime(meta.countdownEndTime);
      setServerRevision(meta.serverRevision);
      setLastUpdatedAt(meta.lastUpdatedAt);
      setMaintenanceActive(meta.maintenanceActive);
      setMaintenanceEndTime(meta.maintenanceEndTime);
      setMaintenanceMessage(meta.maintenanceMessage);
      setNowMs(Date.now());
      if (prevRevisionRef.current !== null && meta.serverRevision > prevRevisionRef.current) {
        showToast('Dữ liệu đám mây vừa được đồng bộ phiên bản mới nhất!');
      }
      prevRevisionRef.current = meta.serverRevision;
    });

    const fallbackTimer = window.setTimeout(() => {
      setIsLoadingInitial(false);
    }, 3500);

    return () => {
      window.clearTimeout(fallbackTimer);
      unsubGames();
      unsubLinks();
      unsubLeaderboard();
      unsubMeta();
    };
  }, [isAuthReady, showToast]);

  // 3. Attach private user & admin Firestore real-time listeners ONLY when authenticated
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) return;

    const uid = firebaseUser.uid;
    const email = firebaseUser.email || '';

    const unsubUser = FirestoreService.subscribeUserProfile(uid, email, (partial) => {
      setUserProfile((prev) =>
        prev
          ? { ...prev, ...partial }
          : {
              id: uid,
              username: email.split('@')[0] || uid.slice(0, 12),
              email,
              displayName: partial.displayName || 'Thành viên',
              role: partial.role || 'user',
              balance: partial.balance ?? 0,
              earnPasses: partial.earnPasses ?? {},
              transactions: [],
            }
      );
    });

    const unsubTx = FirestoreService.subscribeUserTransactions(uid, (txList) => {
      setUserTransactions(txList);
    });

    return () => {
      unsubUser();
      unsubTx();
    };
  }, [isAuthReady, firebaseUser]);

  // 4. Attach Admin-only listeners (earnLinkSecrets + users count) ONLY for verified Admin
  useEffect(() => {
    if (!isAuthReady || !firebaseUser || userProfile?.role !== 'admin') {
      setAdminCodesById({});
      return;
    }

    const unsubSecrets = FirestoreService.subscribeAdminEarnLinkSecrets((codes) => {
      setAdminCodesById(codes);
    });
    const unsubUsersCount = FirestoreService.subscribeAdminUsersCount((count) => {
      setAdminUsersCount(count);
    });

    return () => {
      unsubSecrets();
      unsubUsersCount();
    };
  }, [isAuthReady, firebaseUser, userProfile?.role]);

  // 5. Real-time 1-second ticker during scheduled maintenance so the site auto-reopens on time
  useEffect(() => {
    if (!(maintenanceActive && maintenanceEndTime > 0) && !previewMaintenance) {
      return;
    }
    setNowMs(Date.now());
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [maintenanceActive, maintenanceEndTime, previewMaintenance]);

  const isSiteInMaintenance = useMemo(() => {
    if (!maintenanceActive) return false;
    if (maintenanceEndTime <= 0) return true;
    return nowMs < maintenanceEndTime;
  }, [maintenanceActive, maintenanceEndTime, nowMs]);

  const selectedGame: GameItem | null = useMemo(() => {
    if (!selectedGameId) return null;
    return games.find((g) => g.id === selectedGameId) ?? null;
  }, [games, selectedGameId]);

  useEffect(() => {
    if (activeView === 'detail' && !selectedGame && !isLoadingInitial) {
      setActiveView('home');
    }
    if (activeView === 'admin' && currentUser?.role !== 'admin') {
      setActiveView('home');
    }
  }, [activeView, selectedGame, currentUser, isLoadingInitial]);

  const handleResetCountdown = useCallback(async () => {
    if (currentUser?.role === 'admin' || firebaseUser) {
      try {
        await FirestoreService.resetServerCycle(serverRevision);
        return;
      } catch {
        // Fallback to local display update
      }
    }
    setCountdownEndTime(Date.now() + THIRTY_HOURS_MS);
  }, [currentUser?.role, firebaseUser, serverRevision]);

  const handleSelectHomeTab = useCallback((tab: HomeTab) => {
    setActiveView('home');
    setSelectedGameId(null);
    setHomeTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleScrollToSection = useCallback((sectionId: string) => {
    setActiveView('home');
    setSelectedGameId(null);
    if (sectionId === 'earn-section') {
      setHomeTab('earn');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setHomeTab('games');
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
    setHomeTab('games');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectGame = useCallback((game: GameItem) => {
    setSelectedGameId(game.id);
    setActiveView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenAuth = useCallback((_mode: 'login' | 'register', notice: string | null = null) => {
    setAuthNotice(notice);
    setAuthModalOpen(true);
  }, []);

  const handleRequireAuthForDownload = useCallback(() => {
    showToast('Vui lòng đăng nhập Google để tải game miễn phí!');
    handleOpenAuth('login', 'Bạn cần đăng nhập tài khoản Google trước khi tải game về máy.');
  }, [handleOpenAuth, showToast]);

  const handleRequireAuthForEarn = useCallback(() => {
    showToast('Vui lòng đăng nhập Google để vượt link kiếm tiền!');
    handleOpenAuth('login', 'Đăng nhập bằng Google để lưu vĩnh viễn tiền thưởng & nhiệm vụ trên mọi máy.');
  }, [handleOpenAuth, showToast]);

  const handleGoogleLogin = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const fbUser = await runWithLoading('Đang kết nối tài khoản Google...', () =>
        FirestoreService.signInWithGoogle()
      );
      const profile = await FirestoreService.ensureUserProfile(fbUser);
      setUserProfile(profile);
      setAuthModalOpen(false);
      setAuthNotice(null);
      showToast(`Chào mừng ${profile.displayName} đã kết nối đám mây thành công!`);
      return { ok: true };
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      let friendly = 'Đăng nhập Google không thành công. Vui lòng thử lại.';
      if (raw.includes('popup-closed-by-user')) {
        friendly = 'Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.';
      } else if (raw.includes('popup-blocked')) {
        friendly = 'Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép popup để đăng nhập.';
      } else if (raw.includes('unauthorized-domain')) {
        friendly = 'Tên miền hiện tại chưa được cấp phép đăng nhập trong Firebase.';
      }
      return { ok: false, error: friendly };
    }
  }, [runWithLoading, showToast]);

  const handleLogout = useCallback(() => {
    void FirestoreService.signOutUser().catch(() => undefined);
    setUserProfile(null);
    setUserTransactions([]);
    setAdminCodesById({});
    setPreviewMaintenance(false);
    if (activeView === 'admin') {
      setActiveView('home');
    }
    showToast('Bạn đã đăng xuất khỏi tài khoản.');
  }, [activeView, showToast]);

  const handleRecordDownload = useCallback(
    async (gameId: string) => {
      if (!firebaseUser) return;
      const target = games.find((g) => g.id === gameId);
      if (!target) return;
      try {
        await runWithLoading('Đang mở khóa liên kết tải xuống...', () =>
          FirestoreService.recordGameDownload(gameId, target.downloadsCount)
        );
        showToast('Đã mở khóa liên kết tải xuống tốc độ cao.');
      } catch {
        showToast('Không thể ghi nhận lượt tải lúc này.');
      }
    },
    [firebaseUser, games, runWithLoading, showToast]
  );

  const handleAddGame = useCallback(
    async (input: GameFormInput) => {
      if (currentUser?.role !== 'admin') throw new Error('Bạn không có quyền quản trị.');
      await runWithLoading('Đang lưu game lên Firebase Cloud Firestore...', () =>
        FirestoreService.addGame(input, serverRevision)
      );
      showToast(`Đã lưu "${input.title}" lên đám mây — mọi máy đều thấy ngay!`);
    },
    [currentUser?.role, runWithLoading, serverRevision, showToast]
  );

  const handleUpdateGame = useCallback(
    async (id: string, input: GameFormInput) => {
      if (currentUser?.role !== 'admin') throw new Error('Bạn không có quyền quản trị.');
      const target = games.find((g) => g.id === id);
      await runWithLoading('Đang cập nhật game lên Firebase Cloud Firestore...', () =>
        FirestoreService.updateGame(id, input, target?.downloadsCount ?? 0, serverRevision)
      );
      showToast(`Đã cập nhật "${input.title}" trên đám mây!`);
    },
    [currentUser?.role, games, runWithLoading, serverRevision, showToast]
  );

  const handleDeleteGame = useCallback(
    async (id: string) => {
      if (currentUser?.role !== 'admin') throw new Error('Bạn không có quyền quản trị.');
      await runWithLoading('Đang xóa game khỏi Firebase...', () =>
        FirestoreService.deleteGame(id, serverRevision)
      );
      showToast('Đã xóa game khỏi cơ sở dữ liệu đám mây!');
    },
    [currentUser?.role, runWithLoading, serverRevision, showToast]
  );

  const handleCompleteEarnLink = useCallback(
    async (linkId: string, code: string): Promise<{ ok: boolean; error?: string }> => {
      if (!firebaseUser || !currentUser) {
        handleRequireAuthForEarn();
        return { ok: false, error: 'Bạn cần đăng nhập Google trước.' };
      }
      const targetLink = earnLinks.find((l) => l.id === linkId);
      if (!targetLink) {
        return { ok: false, error: 'Không tìm thấy nhiệm vụ vượt link.' };
      }

      try {
        const res = await runWithLoading('Đang kiểm tra mã & lưu tiền lên đám mây...', () =>
          FirestoreService.claimEarnLink(firebaseUser.uid, currentUser, targetLink, code)
        );
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate([35, 45, 70]);
        }
        showToast(`Hoàn thành nhiệm vụ "${targetLink.title}"`, {
          variant: 'reward',
          rewardAmount: targetLink.rewardPerPass,
          newBalance: res.newBalance,
        });
        return { ok: true };
      } catch (err) {
        const raw = err instanceof Error ? err.message : '';
        let errorMsg = raw;
        if (
          raw.includes('Missing or insufficient permissions') ||
          raw.includes('PERMISSION_DENIED')
        ) {
          errorMsg = 'Mã xác nhận không chính xác hoặc bạn đã hết lượt vượt cho link này.';
        } else if (!errorMsg) {
          errorMsg = 'Không thể xác nhận mã vượt link.';
        }
        showToast(errorMsg);
        return { ok: false, error: errorMsg };
      }
    },
    [currentUser, earnLinks, firebaseUser, handleRequireAuthForEarn, runWithLoading, showToast]
  );

  const handleAddEarnLink = useCallback(
    async (input: EarnLinkPayloadInput) => {
      if (currentUser?.role !== 'admin') throw new Error('Bạn không có quyền quản trị.');
      await runWithLoading('Đang lưu nhiệm vụ vượt link lên Firebase...', () =>
        FirestoreService.addEarnLink(input, serverRevision)
      );
      showToast(`Đã lưu link "${input.title}" lên đám mây!`);
    },
    [currentUser?.role, runWithLoading, serverRevision, showToast]
  );

  const handleUpdateEarnLink = useCallback(
    async (id: string, input: EarnLinkPayloadInput) => {
      if (currentUser?.role !== 'admin') throw new Error('Bạn không có quyền quản trị.');
      const target = earnLinks.find((l) => l.id === id);
      await runWithLoading('Đang cập nhật link kiếm tiền lên Firebase...', () =>
        FirestoreService.updateEarnLink(id, input, target?.completedCount ?? 0, serverRevision)
      );
      showToast(`Đã cập nhật link "${input.title}" trên đám mây!`);
    },
    [currentUser?.role, earnLinks, runWithLoading, serverRevision, showToast]
  );

  const handleDeleteEarnLink = useCallback(
    async (id: string) => {
      if (currentUser?.role !== 'admin') throw new Error('Bạn không có quyền quản trị.');
      await runWithLoading('Đang xóa link kiếm tiền khỏi Firebase...', () =>
        FirestoreService.deleteEarnLink(id, serverRevision)
      );
      showToast('Đã xóa link kiếm tiền khỏi đám mây!');
    },
    [currentUser?.role, runWithLoading, serverRevision, showToast]
  );

  const handleResetServer = useCallback(async () => {
    if (currentUser?.role !== 'admin') throw new Error('Bạn không có quyền quản trị.');
    await runWithLoading('Đang đồng bộ chu kỳ 30h lên Firebase...', () =>
      FirestoreService.resetServerCycle(serverRevision)
    );
    showToast('Đã đặt lại chu kỳ 30:00:00 và đồng bộ tức thì tới mọi thiết bị!');
  }, [currentUser?.role, runWithLoading, serverRevision, showToast]);

  const handleSaveMaintenance = useCallback(
    async (params: { active: boolean; endTimeMs: number; message: string }) => {
      if (currentUser?.role !== 'admin') throw new Error('Bạn không có quyền quản trị.');
      await runWithLoading('Đang lưu cấu hình bảo trì lên Firebase...', () =>
        FirestoreService.updateMaintenanceSettings({
          active: params.active,
          endTimeMs: params.endTimeMs,
          message: params.message,
          currentRevision: serverRevision,
          countdownEndTime,
        })
      );
      setNowMs(Date.now());
      if (params.active) {
        showToast('Đã bật chế độ bảo trì web và lưu lên Firebase!');
      } else {
        setPreviewMaintenance(false);
        showToast('Đã tắt bảo trì — trang web đã mở lại bình thường!');
      }
    },
    [countdownEndTime, currentUser?.role, runWithLoading, serverRevision, showToast]
  );

  const handleExportBackup = useCallback(async () => {
    if (currentUser?.role !== 'admin') throw new Error('Bạn không có quyền quản trị.');
    const jsonContent = FirestoreService.exportBackupJson(games, earnLinks);
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
  }, [currentUser?.role, earnLinks, games]);

  const handleImportBackup = useCallback(
    async (jsonText: string): Promise<{ ok: boolean; message: string }> => {
      if (currentUser?.role !== 'admin') {
        return { ok: false, message: 'Bạn không có quyền quản trị.' };
      }
      try {
        const res = await runWithLoading('Đang khôi phục dữ liệu lên Cloud Firestore...', () =>
          FirestoreService.importBackupJson(jsonText, games, earnLinks, serverRevision)
        );
        showToast(
          `Đã khôi phục ${res.gamesCount} game & ${res.earnLinksCount} link lên Cloud Firestore!`
        );
        return {
          ok: true,
          message: `Đã lưu thành công ${res.gamesCount} tựa game và ${res.earnLinksCount} link kiếm tiền lên Cloud Firestore.`,
        };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : 'Tệp sao lưu JSON không hợp lệ.',
        };
      }
    },
    [currentUser?.role, earnLinks, games, runWithLoading, serverRevision, showToast]
  );

  const shouldShowMaintenanceScreen =
    (isSiteInMaintenance && currentUser?.role !== 'admin') ||
    (previewMaintenance && currentUser?.role === 'admin');

  if (shouldShowMaintenanceScreen) {
    return (
      <>
        <MaintenanceScreen
          maintenanceEndTime={maintenanceEndTime}
          maintenanceMessage={maintenanceMessage}
          nowMs={nowMs}
          isAdminPreview={previewMaintenance && currentUser?.role === 'admin'}
          onExitPreview={() => setPreviewMaintenance(false)}
          onOpenAdminLogin={
            currentUser?.role !== 'admin'
              ? () =>
                  handleOpenAuth(
                    'login',
                    'Đăng nhập tài khoản Google Quản trị viên (Admin) để quản lý hoặc mở lại web.'
                  )
              : undefined
          }
        />

        <ToastNotification toast={toast} onDismiss={dismissToast} />

        {authModalOpen && (
          <Suspense fallback={null}>
            <AuthModal
              isOpen={authModalOpen}
              noticeMessage={authNotice}
              onClose={() => {
                setAuthModalOpen(false);
                setAuthNotice(null);
              }}
              onGoogleLogin={handleGoogleLogin}
            />
          </Suspense>
        )}

        <LoadingOverlay
          isVisible={isLoadingInitial || Boolean(loadingMessage)}
          message={loadingMessage ?? 'Đang tải & đồng bộ dữ liệu Firebase...'}
          subMessage="Đồng bộ đám mây Cloud Firestore giữa mọi thiết bị"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#07080D] text-slate-100">
      {/* Fixed Top Announcement Countdown Bar */}
      <AnnouncementBar
        countdownEndTime={countdownEndTime}
        lastUpdatedAt={lastUpdatedAt}
        onResetCountdown={handleResetCountdown}
      />

      {/* Admin Maintenance Warning Banner */}
      {isSiteInMaintenance && currentUser?.role === 'admin' && (
        <div className="border-b border-rose-500/35 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-100">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
              <span>
                <strong className="text-white">Chế độ bảo trì đang BẬT:</strong> Người dùng vào web
                đang thấy màn hình dấu X đỏ.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMaintenance(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-white/10 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Xem trước dấu X</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSaveMaintenance({
                    active: false,
                    endTimeMs: 0,
                    message: maintenanceMessage,
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 cursor-pointer"
              >
                <Power className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Mở lại web ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Navigation & Top Switcher Bar */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        homeTab={homeTab}
        gamesCount={games.length}
        earnLinksCount={earnLinks.length}
        onNavigateHome={handleNavigateHome}
        onSelectHomeTab={handleSelectHomeTab}
        onScrollToSection={handleScrollToSection}
        onOpenAuth={(mode) => handleOpenAuth(mode, null)}
        onOpenAdmin={() => {
          setActiveView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLogout={handleLogout}
      />

      {/* Animated Toast Notification */}
      <ToastNotification toast={toast} onDismiss={dismissToast} />

      {/* Main Content View Router */}
      <div className="flex-1">
        {activeView === 'admin' && currentUser?.role === 'admin' ? (
          <Suspense fallback={null}>
            <AdminPanel
              games={games}
              earnLinks={earnLinks}
              usersCount={usersCount}
              maintenanceActive={maintenanceActive}
              maintenanceEndTime={maintenanceEndTime}
              maintenanceMessage={maintenanceMessage}
              onBack={handleNavigateHome}
              onAddGame={handleAddGame}
              onUpdateGame={handleUpdateGame}
              onDeleteGame={handleDeleteGame}
              onAddEarnLink={handleAddEarnLink}
              onUpdateEarnLink={handleUpdateEarnLink}
              onDeleteEarnLink={handleDeleteEarnLink}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetServer={handleResetServer}
              onSaveMaintenance={handleSaveMaintenance}
              onPreviewMaintenance={() => setPreviewMaintenance(true)}
            />
          </Suspense>
        ) : activeView === 'detail' && selectedGame ? (
          <Suspense fallback={null}>
            <GameDetailView
              game={selectedGame}
              currentUser={currentUser}
              onBack={handleNavigateHome}
              onRequireAuth={handleRequireAuthForDownload}
              onRecordDownload={handleRecordDownload}
            />
          </Suspense>
        ) : homeTab === 'earn' ? (
          <main>
            <EarnSection
              earnLinks={earnLinks}
              currentUser={currentUser}
              onRequireAuth={handleRequireAuthForEarn}
              onCompleteEarnLink={handleCompleteEarnLink}
            />
          </main>
        ) : homeTab === 'account' ? (
          <main>
            <UserProfile
              currentUser={currentUser}
              earnLinks={earnLinks}
              leaderboard={leaderboard}
              onOpenAuth={(mode) => handleOpenAuth(mode, null)}
              onNavigateEarn={() => handleSelectHomeTab('earn')}
              onNavigateGames={() => handleSelectHomeTab('games')}
              onOpenAdmin={() => {
                setActiveView('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onLogout={handleLogout}
            />
          </main>
        ) : (
          <main>
            <HeroSection
              totalGames={games.length}
              featuredGame={games[0] ?? null}
              onExploreCatalog={() => handleScrollToSection('catalog-section')}
              onSelectFeatured={handleSelectGame}
            />
            <GameCatalog games={games} onSelectGame={handleSelectGame} />
            <GuideSection />
          </main>
        )}
      </div>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-white/10 bg-[#06070B] py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo-taigamekid.jpeg"
              alt="Logo taigamekid"
              className="h-7 w-7 rounded-lg border border-cyan-400/35 object-cover"
            />
            <span className="font-display text-sm font-bold text-slate-200">
              taigame<span className="text-cyan-400">kid</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Kho tải game PC miễn phí & an toàn</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
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
              onClick={() => handleScrollToSection('earn-section')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Kiếm tiền
            </button>
            <button
              type="button"
              onClick={() => handleSelectHomeTab('account')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Tài khoản
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

      {/* Google Login Modal */}
      {authModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={authModalOpen}
            noticeMessage={authNotice}
            onClose={() => {
              setAuthModalOpen(false);
              setAuthNotice(null);
            }}
            onGoogleLogin={handleGoogleLogin}
          />
        </Suspense>
      )}

      {/* Global Loading / Sync Overlay */}
      <LoadingOverlay
        isVisible={isLoadingInitial || Boolean(loadingMessage)}
        message={loadingMessage ?? 'Đang tải & đồng bộ dữ liệu Firebase...'}
        subMessage="Đồng bộ đám mây Cloud Firestore giữa mọi thiết bị"
      />
    </div>
  );
}
