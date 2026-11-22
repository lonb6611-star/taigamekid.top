import { ArrowDownRight, ShieldCheck } from 'lucide-react';
import { HERO_BANNER_IMAGE } from '../data/seedGames';
import { GameItem } from '../types/game';
import { GameCoverImage } from './GameCoverImage';

interface HeroSectionProps {
  totalGames: number;
  featuredGame: GameItem | null;
  onExploreCatalog: () => void;
  onSelectFeatured: (game: GameItem) => void;
}

export function HeroSection({
  totalGames,
  featuredGame,
  onExploreCatalog,
  onSelectFeatured,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#07080D]">
      {/* Subtle ambient cyan & purple radial lighting */}
      <div
        className="pointer-events-none absolute -top-28 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-1/5 h-72 w-72 rounded-full bg-purple-600/10 blur-[110px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left column: Headline & primary CTA */}
          <div className="flex flex-col justify-between lg:col-span-6">
            <div className="space-y-5">
              <p className="text-xs font-medium tracking-wide text-cyan-300">
                Kho Game PC Miễn Phí · Kiểm duyệt an toàn · {totalGames} tựa game sẵn sàng
              </p>

              <h1 className="font-display text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.85rem] [text-wrap:balance]">
                Tải game chất lượng cao,{' '}
                <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-purple-400 bg-clip-text text-transparent">
                  nhanh gọn và an toàn
                </span>
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Khám phá kho trò chơi được tuyển chọn kỹ lưỡng tại taigamekid. Mỗi tựa game đều đi
                kèm bài đánh giá chi tiết, hướng dẫn cài đặt từng bước dễ hiểu và liên kết tải tốc
                độ cao.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={onExploreCatalog}
                className="neon-btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all cursor-pointer"
              >
                <span>Khám phá kho game</span>
                <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              </button>

              {featuredGame && (
                <button
                  type="button"
                  onClick={() => onSelectFeatured(featuredGame)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-purple-400/50 hover:bg-purple-500/10 hover:text-white cursor-pointer"
                >
                  <span>Game nổi bật: {featuredGame.title}</span>
                </button>
              )}
            </div>

            <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
              <span>
                Tất cả tệp cài đặt được kiểm tra mã toàn vẹn trước khi đăng tải lên hệ thống.
              </span>
            </div>
          </div>

          {/* Right column: Full-height visual showcase */}
          <div className="lg:col-span-6">
            <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0E111A] neon-border-cyan sm:h-80 lg:h-full lg:min-h-[340px]">
              <GameCoverImage
                src={HERO_BANNER_IMAGE}
                alt="Không gian trải nghiệm game hiện đại taigamekid"
                title="taigamekid Showcase"
                className="h-full w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07080D]/80 via-transparent to-transparent"
                aria-hidden="true"
              />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-200">
                <span className="font-medium">Tối ưu tốc độ tải trực tiếp</span>
                <span className="font-mono text-cyan-300">PC · Windows 10/11</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
