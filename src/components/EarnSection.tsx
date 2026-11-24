import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Coins, ExternalLink, KeyRound, Lock, Wallet } from 'lucide-react';
import { EarnLinkItem, UserAccount } from '../types/game';
import { sanitizeHref } from '../utils/url';

interface EarnSectionProps {
  earnLinks: EarnLinkItem[];
  currentUser: UserAccount | null;
  onRequireAuth: () => void;
  onCompleteEarnLink: (linkId: string, code: string) => Promise<{ ok: boolean; error?: string }>;
}

const PASS_VERIFY_SECONDS = 5;

export function EarnSection({
  earnLinks,
  currentUser,
  onRequireAuth,
  onCompleteEarnLink,
}: EarnSectionProps) {
  const [activePasses, setActivePasses] = useState<Record<string, number>>({});
  const [codeById, setCodeById] = useState<Record<string, string>>({});
  const [errorById, setErrorById] = useState<Record<string, string | null>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const hasActiveTimers = Object.keys(activePasses).length > 0;

  useEffect(() => {
    if (!hasActiveTimers) return;
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 500);
    return () => window.clearInterval(id);
  }, [hasActiveTimers]);

  const handleStartLink = (linkId: string) => {
    setNowMs(Date.now());
    setErrorById((prev) => ({ ...prev, [linkId]: null }));
    setActivePasses((prev) => ({
      ...prev,
      [linkId]: Date.now() + PASS_VERIFY_SECONDS * 1000,
    }));
  };

  const handleClaim = async (e: FormEvent, linkId: string) => {
    e.preventDefault();
    const enteredCode = (codeById[linkId] ?? '').trim();
    if (!enteredCode) {
      setErrorById((prev) => ({
        ...prev,
        [linkId]: 'Vui lòng nhập mã xác nhận do Admin tạo sau khi vượt link.',
      }));
      return;
    }

    setErrorById((prev) => ({ ...prev, [linkId]: null }));
    setClaimingId(linkId);
    try {
      const result = await onCompleteEarnLink(linkId, enteredCode);
      if (result.ok) {
        setActivePasses((prev) => {
          const next = { ...prev };
          delete next[linkId];
          return next;
        });
        setCodeById((prev) => {
          const next = { ...prev };
          delete next[linkId];
          return next;
        });
        setErrorById((prev) => {
          const next = { ...prev };
          delete next[linkId];
          return next;
        });
      } else {
        setErrorById((prev) => ({
          ...prev,
          [linkId]: result.error || 'Mã xác nhận không chính xác.',
        }));
      }
    } finally {
      setClaimingId(null);
    }
  };

  const userBalance = currentUser?.balance ?? 0;

  return (
    <section
      id="earn-section"
      className="bg-[#07080D] py-8 lg:py-10"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Kiếm tiền online (Vượt link)
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Mở liên kết để vượt link, lấy mã do Admin tạo rồi quay lại nhập mã để nhận tiền vào tài khoản.
            </p>
          </div>

          {/* Account Balance Summary */}
          <div className="flex items-center gap-3 rounded-xl border border-cyan-400/30 bg-[#0D111C] px-4 py-3 shrink-0">
            <Wallet className="h-5 w-5 text-cyan-300 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-[11px] text-slate-400">Số dư tích lũy</p>
              {currentUser ? (
                <p className="font-mono text-base font-bold text-cyan-300 tabular-nums">
                  {userBalance.toLocaleString('vi-VN')} đ
                </p>
              ) : (
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 cursor-pointer"
                >
                  Đăng nhập để tích lũy →
                </button>
              )}
            </div>
          </div>
        </div>

        {earnLinks.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0C0F18] px-6 py-12 text-center">
            <Coins className="mb-3 h-7 w-7 text-slate-400" aria-hidden="true" />
            <h3 className="font-display text-base font-semibold text-white">
              Chưa có nhiệm vụ vượt link nào
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Quản trị viên có thể thêm link kiếm tiền mới trong Bảng điều khiển Admin.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {earnLinks.map((link) => {
              const userPasses = currentUser?.earnPasses?.[link.id] ?? 0;
              const remainingPasses = Math.max(0, link.maxPasses - userPasses);
              const limitReached = Boolean(currentUser) && remainingPasses <= 0;
              const safeHref = sanitizeHref(link.url);

              const readyAt = activePasses[link.id];
              const isStarted = typeof readyAt === 'number';
              const secondsLeft = isStarted ? Math.max(0, Math.ceil((readyAt - nowMs) / 1000)) : 0;
              const cardCode = codeById[link.id] ?? '';
              const cardError = errorById[link.id];

              return (
                <article
                  key={link.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0D1019] p-5 transition-colors hover:border-cyan-400/40"
                >
                  <div>
                    {/* Unboxed Metadata */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                      <span className="font-mono font-semibold text-cyan-300">
                        +{link.rewardPerPass.toLocaleString('vi-VN')} đ / lần
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-purple-300">
                        {currentUser
                          ? `Đã vượt ${userPasses}/${link.maxPasses} lần`
                          : `Tối đa ${link.maxPasses} lần`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-500">
                        {link.completedCount.toLocaleString('vi-VN')} lượt
                      </span>
                    </div>

                    <h3 className="mt-2.5 font-display text-lg font-semibold leading-snug text-white">
                      {link.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
                      {link.description ||
                        'Mở link, hoàn thành bước vượt link và nhập mã xác nhận khi quay lại.'}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-white/8 pt-4">
                    {!currentUser ? (
                      <button
                        type="button"
                        onClick={onRequireAuth}
                        className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 cursor-pointer"
                      >
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Đăng nhập để vượt link (+{link.rewardPerPass.toLocaleString('vi-VN')} đ)</span>
                      </button>
                    ) : limitReached ? (
                      <button
                        type="button"
                        disabled
                        className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          Đã hết lượt vượt ({userPasses}/{link.maxPasses})
                        </span>
                      </button>
                    ) : isStarted ? (
                      <form onSubmit={(e) => handleClaim(e, link.id)} className="flex flex-col gap-2.5">
                        <div className="relative">
                          <KeyRound
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-300"
                            aria-hidden="true"
                          />
                          <input
                            type="text"
                            value={cardCode}
                            onChange={(e) => {
                              setCodeById((prev) => ({ ...prev, [link.id]: e.target.value }));
                              if (cardError) {
                                setErrorById((prev) => ({ ...prev, [link.id]: null }));
                              }
                            }}
                            placeholder="Nhập mã xác nhận sau khi vượt..."
                            aria-label={`Nhập mã xác nhận cho ${link.title}`}
                            autoCapitalize="none"
                            autoCorrect="off"
                            className="w-full min-h-[44px] rounded-xl border border-white/15 bg-[#07080D] py-2.5 pl-9 pr-3 font-mono text-base sm:text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                          />
                        </div>

                        {cardError && (
                          <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                            {cardError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={secondsLeft > 0 || claimingId === link.id || !cardCode.trim()}
                          className="neon-btn-primary flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60 cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {claimingId === link.id
                              ? 'Đang kiểm tra mã...'
                              : secondsLeft > 0
                                ? `Chờ xác nhận (${secondsLeft}s)...`
                                : `Xác nhận mã & Nhận (+${link.rewardPerPass.toLocaleString('vi-VN')} đ)`}
                          </span>
                        </button>
                        <a
                          href={safeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center text-[11px] font-medium text-cyan-300 hover:underline"
                        >
                          Mở lại liên kết vừa rồi
                        </a>
                      </form>
                    ) : (
                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleStartLink(link.id)}
                        className="neon-btn-primary flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          Vượt link ngay (+{link.rewardPerPass.toLocaleString('vi-VN')} đ)
                        </span>
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
