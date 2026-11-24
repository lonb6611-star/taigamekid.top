import { useMemo, useState } from 'react';
import { ArrowRight, Gamepad2, Search } from 'lucide-react';
import { GAME_CATEGORY_LABELS, GameCategory, GameItem } from '../types/game';
import { GameCoverImage } from './GameCoverImage';

interface GameCatalogProps {
  games: GameItem[];
  onSelectGame: (game: GameItem) => void;
}

type CategoryFilter = 'all' | GameCategory;

export function GameCatalog({ games, onSelectGame }: GameCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('Tất cả');

  const genres = useMemo(() => {
    const baseGenres = ['Hành động', 'Sinh tồn', 'Nhập vai', 'Thể thao', 'Phiêu lưu'];
    const dynamicGenres = games.map((g) => g.genre.trim()).filter(Boolean);
    const merged = Array.from(new Set([...baseGenres, ...dynamicGenres]));
    return ['Tất cả', ...merged];
  }, [games]);

  const filteredGames = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return games.filter((game) => {
      const matchesCategory =
        selectedCategory === 'all' || game.category === selectedCategory;
      const matchesGenre =
        selectedGenre === 'Tất cả' ||
        game.genre.trim().toLowerCase() === selectedGenre.toLowerCase();
      const matchesQuery =
        !query ||
        game.title.toLowerCase().includes(query) ||
        game.genre.toLowerCase().includes(query);
      return matchesCategory && matchesGenre && matchesQuery;
    });
  }, [games, searchQuery, selectedCategory, selectedGenre]);

  const hackGames = useMemo(
    () => filteredGames.filter((g) => g.category === 'hack'),
    [filteredGames]
  );

  const normalGames = useMemo(
    () => filteredGames.filter((g) => g.category === 'normal'),
    [filteredGames]
  );

  const renderGameCard = (game: GameItem) => (
    <article
      key={game.id}
      onClick={() => onSelectGame(game)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectGame(game);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Xem chi tiết ${game.title}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1019] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/45 hover:shadow-[0_12px_32px_-12px_rgba(34,211,238,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer"
    >
      {/* 4:3 Cover Art */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#090B12]">
        <GameCoverImage
          src={game.coverUrl}
          alt={`Ảnh bìa ${game.title}`}
          title={game.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0D1019] via-transparent to-transparent opacity-70"
          aria-hidden="true"
        />
      </div>

      {/* Card Body — Clean Unboxed Metadata (Zero Pill Discipline) */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            <span
              className={`font-semibold ${
                game.category === 'hack' ? 'text-purple-300' : 'text-cyan-300'
              }`}
            >
              {GAME_CATEGORY_LABELS[game.category]}
            </span>
            <span aria-hidden="true">·</span>
            <span>{game.genre}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{game.version}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{game.size}</span>
          </div>

          <h4 className="mt-2 font-display text-lg font-semibold leading-snug text-white transition-colors group-hover:text-cyan-200">
            {game.title}
          </h4>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
            {game.review || 'Nhấp để xem bài đánh giá chi tiết và hướng dẫn cài đặt đầy đủ.'}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-xs">
          <span className="font-mono text-slate-500">
            {game.downloadsCount.toLocaleString('vi-VN')} lượt tải
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-purple-300 transition-colors group-hover:text-cyan-300">
            <span>Chi tiết & Tải</span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </article>
  );

  return (
    <section id="catalog-section" className="mx-auto max-w-[1200px] px-4 py-9 sm:px-6 lg:py-12">
      {/* Header + Search + Primary Section & Genre Filter Bar */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Kho Game Tuyển Chọn
          </h2>

          {/* Search box (text-base on mobile prevents iOS Safari auto-zoom) */}
          <div className="relative w-full md:w-80">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên game..."
              aria-label="Tìm kiếm tên game"
              className="w-full rounded-xl border border-white/10 bg-[#0D1019] py-2.5 pl-10 pr-4 text-base sm:text-sm text-white placeholder:text-slate-500 transition-colors focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>
        </div>

        {/* Primary Category Section Tabs (Mục 1: Hack / Mục 2: Game thường) + Single-Row Genre Strip */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="inline-flex w-fit max-w-full flex-nowrap overflow-x-auto no-scrollbar items-center gap-1 rounded-xl border border-white/10 bg-[#0A0D15] p-1"
            role="tablist"
            aria-label="Chọn phân mục game"
          >
            {(
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'hack', label: 'Mục 1: Hack' },
                { id: 'normal', label: 'Mục 2: Game thường' },
              ] as const
            ).map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? tab.id === 'hack'
                        ? 'bg-purple-500/20 text-purple-200 border border-purple-400/50'
                        : 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Genre segmented filter buttons (single scrollable row on mobile) */}
          <div
            className="flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0"
            role="tablist"
            aria-label="Lọc theo thể loại game"
          >
            {genres.map((genre) => {
              const isActive = selectedGenre === genre;
              return (
                <button
                  key={genre}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedGenre(genre)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                      : 'border border-white/10 bg-[#0D1019] text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Game Sections & Grids */}
      {filteredGames.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0C0F18] px-6 py-16 text-center">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3 text-slate-400">
            <Gamepad2 className="h-7 w-7" />
          </div>
          <h3 className="font-display text-lg font-semibold text-white">
            Không tìm thấy tựa game phù hợp
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-slate-400">
            {games.length === 0
              ? 'Kho game hiện đang trống. Quản trị viên có thể thêm game mới trong Bảng điều khiển Admin.'
              : 'Thử thay đổi từ khóa tìm kiếm, phân mục hoặc chọn lại thể loại "Tất cả".'}
          </p>
          {(searchQuery || selectedGenre !== 'Tất cả' || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedGenre('Tất cả');
              }}
              className="mt-5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="mt-10 space-y-14">
          {/* Mục 1: Hack */}
          {(selectedCategory === 'all' || selectedCategory === 'hack') && hackGames.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                  Mục 1: Hack
                </h3>
                <span className="font-mono text-xs text-purple-300">
                  {hackGames.length} tựa game
                </span>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {hackGames.map(renderGameCard)}
              </div>
            </div>
          )}

          {/* Mục 2: Game thường */}
          {(selectedCategory === 'all' || selectedCategory === 'normal') && normalGames.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                  Mục 2: Game thường
                </h3>
                <span className="font-mono text-xs text-cyan-300">
                  {normalGames.length} tựa game
                </span>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {normalGames.map(renderGameCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
