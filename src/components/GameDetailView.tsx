import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Lock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { GAME_CATEGORY_LABELS, GameItem, UserAccount } from '../types/game';
import { GameCoverImage } from './GameCoverImage';

interface GameDetailViewProps {
  game: GameItem;
  currentUser: UserAccount | null;
  onBack: () => void;
  onRequireAuth: () => void;
  onRecordDownload: (gameId: string) => void;
}

export function GameDetailView({
  game,
  currentUser,
  onBack,
  onRequireAuth,
  onRecordDownload,
}: GameDetailViewProps) {
  const [downloadUnlocked, setDownloadUnlocked] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownloadClick = () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    onRecordDownload(game.id);
    setDownloadUnlocked(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(game.downloadUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const reviewParagraphs = game.review
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:py-12">
      {/* Breadcrumb Back Action */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-white cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Quay lại kho game</span>
      </button>

      {/* Top Contiguous Showcase Module */}
      <section className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left: Cover Art + Fast & Safe Download Verification Seal */}
        <div className="space-y-4 lg:col-span-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0D1019] neon-border-cyan">
            <div className="aspect-[4/3] w-full">
              <GameCoverImage
                src={game.coverUrl}
                alt={`Ảnh bìa ${game.title}`}
                title={game.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Tem chứng nhận tải nhanh & an toàn */}
          <div className="flex flex-col gap-3 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 via-[#0D111C] to-purple-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 p-2.5 text-cyan-300 shrink-0">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Tem chứng nhận Tải Nhanh & An Toàn
                </p>
                <p className="mt-0.5 text-xs text-slate-300">
                  Đã kiểm duyệt mã sạch, không chứa phần mềm quảng cáo & hỗ trợ băng thông tối đa.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-cyan-300 shrink-0">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Đã xác thực</span>
            </div>
          </div>
        </div>

        {/* Right: Metadata, Specs Table & Primary Download CTA */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0D1019] p-6 sm:p-8 lg:col-span-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
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

            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl [text-wrap:balance]">
              {game.title}
            </h1>

            {/* Technical Specs Grid */}
            <dl className="mt-6 divide-y divide-white/8 border-y border-white/8 text-sm">
              <div className="flex items-center justify-between py-3">
                <dt className="text-slate-400">Phân mục</dt>
                <dd
                  className={`font-semibold ${
                    game.category === 'hack' ? 'text-purple-300' : 'text-cyan-300'
                  }`}
                >
                  {GAME_CATEGORY_LABELS[game.category]}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-slate-400">Thể loại</dt>
                <dd className="font-medium text-white">{game.genre}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-slate-400">Phiên bản</dt>
                <dd className="font-mono font-medium text-cyan-300">{game.version}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-slate-400">Dung lượng tệp</dt>
                <dd className="font-mono font-medium text-white">{game.size}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-slate-400">Lượt tải xuống</dt>
                <dd className="font-mono font-medium text-purple-300">
                  {game.downloadsCount.toLocaleString('vi-VN')}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-slate-400">Cập nhật lần cuối</dt>
                <dd className="font-mono text-slate-300">
                  {new Date(game.updatedAt).toLocaleDateString('vi-VN')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Download Action Area */}
          <div className="mt-7 space-y-4">
            <button
              type="button"
              onClick={handleDownloadClick}
              className="neon-btn-primary flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all cursor-pointer"
            >
              {currentUser ? (
                <Download className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Tải Miễn Phí ({game.size})</span>
            </button>

            {!currentUser && (
              <p className="text-center text-xs text-slate-400">
                Yêu cầu đăng nhập tài khoản thành viên để mở khóa liên kết tải trực tiếp.
              </p>
            )}

            {currentUser && downloadUnlocked && (
              <div className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-cyan-200">
                    Liên kết tải trực tiếp đã sẵn sàng
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">{game.version}</span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <a
                    href={game.downloadUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Bắt đầu tải xuống ngay</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#0A0D16] px-3.5 py-2.5 text-xs font-medium text-slate-200 hover:border-white/30 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                        <span>Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Sao chép link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom Editorial Review + Step-by-Step Installation Guide */}
      <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Detailed Review */}
        <article className="rounded-2xl border border-white/10 bg-[#0D1019] p-6 sm:p-8 lg:col-span-7">
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            Bài đánh giá chi tiết
          </h2>
          <div className="mt-4 max-w-[70ch] space-y-4 text-sm leading-7 text-slate-300 sm:text-[15px]">
            {reviewParagraphs.length > 0 ? (
              reviewParagraphs.map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
            ) : (
              <p className="text-slate-400">Chưa có bài đánh giá chi tiết cho tựa game này.</p>
            )}
          </div>
        </article>

        {/* Step-by-Step Installation Guide */}
        <aside className="rounded-2xl border border-white/10 bg-[#0D1019] p-6 sm:p-8 lg:col-span-5">
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            Hướng dẫn cài đặt từng bước
          </h2>
          <ol className="mt-5 space-y-4">
            {game.installGuide.length > 0 ? (
              game.installGuide.map((step, index) => (
                <li key={index} className="flex gap-3.5 border-b border-white/8 pb-4 last:border-none last:pb-0">
                  <span className="font-mono text-sm font-semibold text-purple-300 shrink-0 pt-0.5">
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  <p className="text-sm leading-relaxed text-slate-300">{step}</p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-400">
                Tải tệp nén, giải nén bằng WinRAR hoặc 7-Zip và chạy tệp khởi động game.
              </li>
            )}
          </ol>
        </aside>
      </section>
    </main>
  );
}
