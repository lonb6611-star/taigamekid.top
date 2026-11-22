import { ChangeEvent, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Edit3,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { GAME_CATEGORY_LABELS, GameCategory, GameItem, UserAccount } from '../types/game';
import { GameCoverImage } from './GameCoverImage';
import { GameFormInput, GameFormModal } from './GameFormModal';

interface AdminPanelProps {
  games: GameItem[];
  users: UserAccount[];
  onBack: () => void;
  onAddGame: (data: GameFormInput) => void;
  onUpdateGame: (id: string, data: GameFormInput) => void;
  onDeleteGame: (id: string) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonText: string) => { ok: boolean; message: string };
}

export function AdminPanel({
  games,
  users,
  onBack,
  onAddGame,
  onUpdateGame,
  onDeleteGame,
  onExportBackup,
  onImportBackup,
}: AdminPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | GameCategory>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalDownloads = useMemo(
    () => games.reduce((sum, g) => sum + (g.downloadsCount || 0), 0),
    [games]
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

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const handleFormSubmit = (data: GameFormInput) => {
    if (editingGame) {
      onUpdateGame(editingGame.id, data);
      showFeedback('success', `Đã cập nhật "${data.title}" và lưu vĩnh viễn vào DataSave.`);
    } else {
      onAddGame(data);
      showFeedback('success', `Đã thêm "${data.title}" vào kho game và lưu vĩnh viễn.`);
    }
    setFormOpen(false);
    setEditingGame(null);
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = onImportBackup(text);
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
            Mọi thay đổi được đồng bộ tự động vào hệ thống DataSave (IndexedDB & LocalStorage).
          </p>
        </div>

        {/* Action Toolbar: Add + Backup JSON Export/Import */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              onExportBackup();
              showFeedback('success', 'Đã xuất tệp sao lưu JSON cho toàn bộ kho game.');
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
              setEditingGame(null);
              setFormOpen(true);
            }}
            className="neon-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Thêm Game mới</span>
          </button>
        </div>
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
          <p className="text-xs text-slate-400">Tổng số game trong kho</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-white tabular-nums">
            {games.length}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0D1019] p-4">
          <p className="text-xs text-slate-400">Tổng lượt tải tích lũy</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-cyan-300 tabular-nums">
            {totalDownloads.toLocaleString('vi-VN')}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0D1019] p-4">
          <p className="text-xs text-slate-400">Tài khoản thành viên</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-purple-300 tabular-nums">
            {users.length}
          </p>
        </div>
      </div>

      {/* Table Filter & Search */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-white">Danh sách Game hiện có</h2>
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
            className="w-full rounded-xl border border-white/10 bg-[#0D1019] py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
          />
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0D1019]">
        <div className="overflow-x-auto">
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
                            onClick={() => {
                              onDeleteGame(game.id);
                              setConfirmDeleteId(null);
                              showFeedback('success', `Đã xóa "${game.title}" khỏi kho game.`);
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
        </div>
      </div>

      <GameFormModal
        isOpen={formOpen}
        editingGame={editingGame}
        onClose={() => {
          setFormOpen(false);
          setEditingGame(null);
        }}
        onSubmit={handleFormSubmit}
      />
    </main>
  );
}
