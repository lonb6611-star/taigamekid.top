import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  Coins,
  Download,
  Edit3,
  Eye,
  Gamepad2,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Wrench,
} from 'lucide-react';
import { EarnLinkPayloadInput } from '../services/firestoreService';
import { EarnLinkItem, GAME_CATEGORY_LABELS, GameCategory, GameItem } from '../types/game';
import { EarnLinkFormModal } from './EarnLinkFormModal';
import { GameCoverImage } from './GameCoverImage';
import { GameFormInput, GameFormModal } from './GameFormModal';

interface AdminPanelProps {
  games: GameItem[];
  earnLinks: EarnLinkItem[];
  usersCount: number;
  maintenanceActive: boolean;
  maintenanceEndTime: number;
  maintenanceMessage: string;
  onBack: () => void;
  onAddGame: (data: GameFormInput) => Promise<void>;
  onUpdateGame: (id: string, data: GameFormInput) => Promise<void>;
  onDeleteGame: (id: string) => Promise<void>;
  onAddEarnLink: (data: EarnLinkPayloadInput) => Promise<void>;
  onUpdateEarnLink: (id: string, data: EarnLinkPayloadInput) => Promise<void>;
  onDeleteEarnLink: (id: string) => Promise<void>;
  onExportBackup: () => Promise<void>;
  onImportBackup: (jsonText: string) => Promise<{ ok: boolean; message: string }>;
  onResetServer: () => Promise<void>;
  onSaveMaintenance: (params: {
    active: boolean;
    endTimeMs: number;
    message: string;
  }) => Promise<void>;
  onPreviewMaintenance: () => void;
}

function toDatetimeLocalValue(ms: number): string {
  if (!ms || ms <= 0) return '';
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminPanel({
  games,
  earnLinks,
  usersCount,
  maintenanceActive,
  maintenanceEndTime,
  maintenanceMessage,
  onBack,
  onAddGame,
  onUpdateGame,
  onDeleteGame,
  onAddEarnLink,
  onUpdateEarnLink,
  onDeleteEarnLink,
  onExportBackup,
  onImportBackup,
  onResetServer,
  onSaveMaintenance,
  onPreviewMaintenance,
}: AdminPanelProps) {
  const [adminTab, setAdminTab] = useState<'games' | 'earn' | 'maintenance'>('games');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | GameCategory>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameItem | null>(null);
  const [earnFormOpen, setEarnFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<EarnLinkItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteLinkId, setConfirmDeleteLinkId] = useState<string | null>(null);
  const [resettingServer, setResettingServer] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [draftMaintActive, setDraftMaintActive] = useState<boolean>(maintenanceActive);
  const [draftMaintDateTime, setDraftMaintDateTime] = useState<string>(() =>
    toDatetimeLocalValue(maintenanceEndTime)
  );
  const [draftMaintMsg, setDraftMaintMsg] = useState<string>(maintenanceMessage);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraftMaintActive(maintenanceActive);
    setDraftMaintDateTime(toDatetimeLocalValue(maintenanceEndTime));
    setDraftMaintMsg(maintenanceMessage);
  }, [maintenanceActive, maintenanceEndTime, maintenanceMessage]);

  const totalDownloads = useMemo(
    () => games.reduce((sum, g) => sum + (g.downloadsCount || 0), 0),
    [games]
  );

  const totalEarnPasses = useMemo(
    () => earnLinks.reduce((sum, l) => sum + (l.completedCount || 0), 0),
    [earnLinks]
  );

  const filteredGames = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return games.filter((g) => {
      const matchesCat = categoryFilter === 'all' || g.category === categoryFilter;
      const matchesSearch =
        !q || g.title.toLowerCase().includes(q) || g.genre.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [games, searchTerm, categoryFilter]);

  const filteredLinks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return earnLinks;
    return earnLinks.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        (l.passCode || '').toLowerCase().includes(q)
    );
  }, [earnLinks, searchTerm]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const handleFormSubmit = async (data: GameFormInput) => {
    try {
      if (editingGame) {
        await onUpdateGame(editingGame.id, data);
        showFeedback(
          'success',
          `Đã cập nhật "${data.title}", reset toàn máy chủ và đồng bộ ngay lập tức (không cần chờ 30h).`
        );
      } else {
        await onAddGame(data);
        showFeedback(
          'success',
          `Đã thêm "${data.title}", reset toàn máy chủ và cập nhật ngay cho mọi thiết bị.`
        );
      }
      setFormOpen(false);
      setEditingGame(null);
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Không thể lưu thay đổi.');
    }
  };

  const handleEarnFormSubmit = async (data: EarnLinkPayloadInput) => {
    if (editingLink) {
      await onUpdateEarnLink(editingLink.id, data);
      showFeedback(
        'success',
        `Đã cập nhật link "${data.title}" (+${data.rewardPerPass.toLocaleString('vi-VN')} đ/lần, tối đa ${data.maxPasses} lần) lên máy chủ.`
      );
    } else {
      await onAddEarnLink(data);
      showFeedback(
        'success',
        `Đã thêm link "${data.title}" (+${data.rewardPerPass.toLocaleString('vi-VN')} đ/lần) và đồng bộ ngay cho mọi thiết bị.`
      );
    }
    setEarnFormOpen(false);
    setEditingLink(null);
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = await onImportBackup(text);
      showFeedback(result.ok ? 'success' : 'error', result.message);
    } catch {
      showFeedback('error', 'Không thể đọc tệp JSON đã chọn.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:py-10">
      {/* Admin Top Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Quay lại kho game</span>
          </button>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Quản lý Game (Admin)
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Khi thêm, sửa hoặc xóa game, hệ thống lập tức reset máy chủ và cập nhật ngay lên mọi thiết bị (không cần chờ 30 giờ).
          </p>
        </div>

        {/* Action Toolbar: Instant Reset + Backup JSON Export/Import + Add */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={resettingServer}
            onClick={async () => {
              setResettingServer(true);
              try {
                await onResetServer();
                showFeedback(
                  'success',
                  'Đã reset toàn máy chủ, đặt lại chu kỳ 30:00:00 và cập nhật ngay cho mọi thiết bị!'
                );
              } catch (err) {
                showFeedback(
                  'error',
                  err instanceof Error ? err.message : 'Không thể reset máy chủ.'
                );
              } finally {
                setResettingServer(false);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3.5 py-2.5 text-xs font-medium text-cyan-200 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/20 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-cyan-300 ${resettingServer ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{resettingServer ? 'Đang reset...' : 'Reset & Cập nhật máy chủ'}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                await onExportBackup();
                showFeedback('success', 'Đã xuất tệp sao lưu JSON cho toàn bộ kho game.');
              } catch (err) {
                showFeedback('error', err instanceof Error ? err.message : 'Lỗi xuất backup.');
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#0D1019] px-3.5 py-2.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
            <span>Xuất Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#0D1019] px-3.5 py-2.5 text-xs font-medium text-slate-200 transition-colors hover:border-purple-400/50 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-purple-300" aria-hidden="true" />
            <span>Nhập Backup JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              if (adminTab === 'earn') {
                setEditingLink(null);
                setEarnFormOpen(true);
              } else {
                setEditingGame(null);
                setFormOpen(true);
              }
            }}
            className="neon-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{adminTab === 'earn' ? 'Thêm Link kiếm tiền' : 'Thêm Game mới'}</span>
          </button>
        </div>
      </div>

      {/* Section Switcher: Kho Game / Vượt Link Kiếm Tiền */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setAdminTab('games');
            setSearchTerm('');
          }}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
            adminTab === 'games'
              ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
              : 'border-white/10 bg-[#0D1019] text-slate-400 hover:text-white'
          }`}
        >
          <Gamepad2 className="h-4 w-4" aria-hidden="true" />
          <span>Quản lý Kho Game ({games.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAdminTab('earn');
            setSearchTerm('');
          }}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
            adminTab === 'earn'
              ? 'border-purple-400/60 bg-purple-500/20 text-purple-200'
              : 'border-white/10 bg-[#0D1019] text-slate-400 hover:text-white'
          }`}
        >
          <Coins className="h-4 w-4" aria-hidden="true" />
          <span>Kiếm tiền / Vượt Link ({earnLinks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAdminTab('maintenance');
            setSearchTerm('');
          }}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
            adminTab === 'maintenance'
              ? 'border-rose-400/65 bg-rose-500/20 text-rose-200'
              : maintenanceActive
                ? 'border-rose-500/45 bg-rose-500/10 text-rose-300'
                : 'border-white/10 bg-[#0D1019] text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="h-4 w-4" aria-hidden="true" />
          <span>{maintenanceActive ? 'Bảo trì Web (ĐANG BẬT)' : 'Bảo trì Web'}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`mt-5 rounded-xl border px-4 py-3 text-xs font-medium ${
            feedback.type === 'success'
              ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Compact Metric Strip */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0D1019] p-4">
          <p className="text-xs text-slate-400">
            {adminTab === 'earn' ? 'Tổng số link vượt kiếm tiền' : 'Tổng số game trong kho'}
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-white tabular-nums">
            {adminTab === 'earn' ? earnLinks.length : games.length}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0D1019] p-4">
          <p className="text-xs text-slate-400">
            {adminTab === 'earn' ? 'Tổng lượt vượt thành công' : 'Tổng lượt tải tích lũy'}
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-cyan-300 tabular-nums">
            {(adminTab === 'earn' ? totalEarnPasses : totalDownloads).toLocaleString('vi-VN')}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0D1019] p-4">
          <p className="text-xs text-slate-400">Tài khoản thành viên</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-purple-300 tabular-nums">
            {usersCount}
          </p>
        </div>
      </div>

      {adminTab === 'maintenance' ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0D1019] p-6 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                Dừng Website để Bảo trì (Lưu trên Firebase)
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Khi bật, tất cả người dùng vào web sẽ thấy biểu tượng dấu X lớn cùng thông báo bảo trì và thời gian tự động mở lại.
              </p>
            </div>
            <button
              type="button"
              onClick={onPreviewMaintenance}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
              <span>Xem trước màn hình dấu X</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-300">Trạng thái hoạt động của Website</p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDraftMaintActive(false)}
                    className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      !draftMaintActive
                        ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200'
                        : 'border-white/10 bg-[#07080D] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Power className="h-4 w-4" aria-hidden="true" />
                    <span>Đang mở bình thường</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftMaintActive(true)}
                    className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      draftMaintActive
                        ? 'border-rose-500/70 bg-rose-500/20 text-rose-200'
                        : 'border-white/10 bg-[#07080D] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Wrench className="h-4 w-4" aria-hidden="true" />
                    <span>Dừng web để bảo trì</span>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="maint-end-datetime"
                  className="block text-xs font-medium text-slate-300"
                >
                  Ngày &amp; giờ tự động mở lại web (tùy chọn)
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="relative flex-1">
                    <CalendarClock
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300"
                      aria-hidden="true"
                    />
                    <input
                      id="maint-end-datetime"
                      type="datetime-local"
                      value={draftMaintDateTime}
                      onChange={(e) => setDraftMaintDateTime(e.target.value)}
                      className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#07080D] py-2 pl-9 pr-3 font-mono text-base sm:text-xs text-white focus:border-cyan-400/60 focus:outline-none"
                    />
                  </div>
                  {draftMaintDateTime && (
                    <button
                      type="button"
                      onClick={() => setDraftMaintDateTime('')}
                      className="min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-3 text-xs text-slate-300 hover:text-white cursor-pointer"
                    >
                      Xóa ngày
                    </button>
                  )}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[
                    { label: '+1 giờ', ms: 60 * 60 * 1000 },
                    { label: '+6 giờ', ms: 6 * 60 * 60 * 1000 },
                    { label: '+24 giờ', ms: 24 * 60 * 60 * 1000 },
                    { label: '+3 ngày', ms: 3 * 24 * 60 * 60 * 1000 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setDraftMaintDateTime(toDatetimeLocalValue(Date.now() + preset.ms))
                      }
                      className="rounded-lg border border-white/10 bg-[#07080D] px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200 cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Nếu đặt ngày giờ, khi đúng tới thời điểm đó trang web sẽ tự động mở lại cho mọi người dùng. Nếu để trống, web sẽ tạm khóa cho tới khi bạn bấm mở lại.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-4">
              <div>
                <label htmlFor="maint-message" className="block text-xs font-medium text-slate-300">
                  Thông báo bảo trì (tối đa 300 ký tự)
                </label>
                <textarea
                  id="maint-message"
                  rows={4}
                  maxLength={300}
                  value={draftMaintMsg}
                  onChange={(e) => setDraftMaintMsg(e.target.value)}
                  placeholder="Ví dụ: Hệ thống đang nâng cấp máy chủ và thêm game mới, sẽ mở lại đúng lịch hẹn bên dưới."
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#07080D] p-3 text-base sm:text-xs text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={savingMaintenance}
                onClick={async () => {
                  const parsedMs = draftMaintDateTime
                    ? new Date(draftMaintDateTime).getTime()
                    : 0;
                  if (draftMaintDateTime && (!Number.isFinite(parsedMs) || parsedMs <= Date.now())) {
                    showFeedback(
                      'error',
                      'Thời gian tự động mở lại phải lớn hơn thời điểm hiện tại.'
                    );
                    return;
                  }
                  setSavingMaintenance(true);
                  try {
                    await onSaveMaintenance({
                      active: draftMaintActive,
                      endTimeMs: parsedMs > 0 ? parsedMs : 0,
                      message: draftMaintMsg,
                    });
                    showFeedback(
                      'success',
                      draftMaintActive
                        ? 'Đã bật chế độ Bảo trì và đồng bộ lên Firebase Cloud Firestore!'
                        : 'Đã tắt chế độ Bảo trì — trang web đang mở bình thường!'
                    );
                  } catch (err) {
                    showFeedback(
                      'error',
                      err instanceof Error ? err.message : 'Không thể lưu cài đặt bảo trì.'
                    );
                  } finally {
                    setSavingMaintenance(false);
                  }
                }}
                className="neon-btn-primary min-h-[46px] w-full rounded-xl px-5 py-3 text-xs font-semibold text-white disabled:opacity-60 cursor-pointer"
              >
                {savingMaintenance
                  ? 'Đang lưu lên Firebase...'
                  : 'Lưu chế độ bảo trì lên Firebase'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Table Filter & Search */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-lg font-semibold text-white">
                {adminTab === 'earn' ? 'Danh sách Link kiếm tiền' : 'Danh sách Game hiện có'}
              </h2>
              {adminTab === 'games' && (
                <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#0A0D15] p-1">
                  {(
                    [
                      { id: 'all', label: 'Tất cả' },
                      { id: 'hack', label: 'Mục 1: Hack' },
                      { id: 'normal', label: 'Mục 2: Game thường' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategoryFilter(tab.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        categoryFilter === tab.id
                          ? 'bg-white/10 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Lọc nhanh trong bảng..."
                aria-label="Lọc game trong bảng quản trị"
                className="w-full rounded-xl border border-white/10 bg-[#0D1019] py-2 pl-9 pr-3 text-base sm:text-xs text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
              />
            </div>
          </div>

          {/* High-Density Data Grid */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0D1019]">
            <div className="overflow-x-auto">
              {adminTab === 'earn' ? (
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#090B12] text-xs font-medium text-slate-400">
                      <th className="px-4 py-3.5">Tên nhiệm vụ &amp; Link</th>
                      <th className="px-4 py-3.5">Mã xác nhận</th>
                      <th className="px-4 py-3.5 text-right">Tiền / 1 lần</th>
                      <th className="px-4 py-3.5 text-right">Số lần vượt</th>
                      <th className="px-4 py-3.5 text-right">Đã vượt</th>
                      <th className="px-4 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {filteredLinks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                          Chưa có link kiếm tiền nào. Hãy nhấn &ldquo;Thêm Link kiếm tiền&rdquo; để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      filteredLinks.map((link) => (
                        <tr key={link.id} className="transition-colors hover:bg-white/[0.03]">
                          <td className="px-4 py-3">
                            <p className="max-w-[240px] truncate font-medium text-white">
                              {link.title}
                            </p>
                            <p className="mt-0.5 max-w-[240px] truncate font-mono text-[11px] text-slate-400">
                              {link.url}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-amber-300 whitespace-nowrap">
                            {link.passCode || '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-cyan-300 tabular-nums whitespace-nowrap">
                            +{link.rewardPerPass.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-purple-300 tabular-nums whitespace-nowrap">
                            {link.maxPasses} lần
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-slate-300 tabular-nums whitespace-nowrap">
                            {link.completedCount.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {confirmDeleteLinkId === link.id ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await onDeleteEarnLink(link.id);
                                      setConfirmDeleteLinkId(null);
                                      showFeedback('success', `Đã xóa "${link.title}" khỏi máy chủ.`);
                                    } catch (err) {
                                      showFeedback(
                                        'error',
                                        err instanceof Error ? err.message : 'Không thể xóa link.'
                                      );
                                    }
                                  }}
                                  className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer"
                                >
                                  Xác nhận xóa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteLinkId(null)}
                                  className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10 cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingLink(link);
                                    setEarnFormOpen(true);
                                  }}
                                  aria-label={`Sửa ${link.title}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400/50 hover:text-cyan-200 cursor-pointer"
                                >
                                  <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>Sửa</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteLinkId(link.id)}
                                  aria-label={`Xóa ${link.title}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:border-rose-400/50 hover:bg-rose-500/20 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>Xóa</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#090B12] text-xs font-medium text-slate-400">
                      <th className="px-4 py-3.5">Trò chơi</th>
                      <th className="px-4 py-3.5">Phân mục</th>
                      <th className="px-4 py-3.5">Thể loại</th>
                      <th className="px-4 py-3.5">Phiên bản</th>
                      <th className="px-4 py-3.5">Dung lượng</th>
                      <th className="px-4 py-3.5 text-right">Lượt tải</th>
                      <th className="px-4 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {filteredGames.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                          Chưa có game nào phù hợp. Hãy nhấn &ldquo;Thêm Game mới&rdquo; để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      filteredGames.map((game) => (
                        <tr key={game.id} className="transition-colors hover:bg-white/[0.03]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#07080D]">
                                <GameCoverImage
                                  src={game.coverUrl}
                                  alt={game.title}
                                  title={game.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <span className="max-w-[200px] truncate font-medium text-white">
                                {game.title}
                              </span>
                            </div>
                          </td>
                          <td
                            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap ${
                              game.category === 'hack' ? 'text-purple-300' : 'text-cyan-300'
                            }`}
                          >
                            {GAME_CATEGORY_LABELS[game.category]}
                          </td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{game.genre}</td>
                          <td className="px-4 py-3 font-mono text-xs text-cyan-300 whitespace-nowrap">
                            {game.version}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-300 whitespace-nowrap">
                            {game.size}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-slate-300 tabular-nums whitespace-nowrap">
                            {game.downloadsCount.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {confirmDeleteId === game.id ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await onDeleteGame(game.id);
                                      setConfirmDeleteId(null);
                                      showFeedback('success', `Đã xóa "${game.title}" khỏi máy chủ.`);
                                    } catch (err) {
                                      showFeedback(
                                        'error',
                                        err instanceof Error ? err.message : 'Không thể xóa game.'
                                      );
                                    }
                                  }}
                                  className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer"
                                >
                                  Xác nhận xóa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10 cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingGame(game);
                                    setFormOpen(true);
                                  }}
                                  aria-label={`Sửa ${game.title}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400/50 hover:text-cyan-200 cursor-pointer"
                                >
                                  <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>Sửa</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(game.id)}
                                  aria-label={`Xóa ${game.title}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:border-rose-400/50 hover:bg-rose-500/20 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>Xóa</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      <GameFormModal
        isOpen={formOpen}
        editingGame={editingGame}
        onClose={() => {
          setFormOpen(false);
          setEditingGame(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <EarnLinkFormModal
        isOpen={earnFormOpen}
        editingLink={editingLink}
        onClose={() => {
          setEarnFormOpen(false);
          setEditingLink(null);
        }}
        onSubmit={handleEarnFormSubmit}
      />
    </main>
  );
}
