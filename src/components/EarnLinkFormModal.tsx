import { FormEvent, useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { EarnLinkPayloadInput } from '../services/firestoreService';
import { EarnLinkItem } from '../types/game';

interface EarnLinkFormModalProps {
  isOpen: boolean;
  editingLink: EarnLinkItem | null;
  onClose: () => void;
  onSubmit: (data: EarnLinkPayloadInput) => Promise<void>;
}

function generateRandomPassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TK';
  for (let i = 0; i < 4; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function EarnLinkFormModal({
  isOpen,
  editingLink,
  onClose,
  onSubmit,
}: EarnLinkFormModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [rewardPerPass, setRewardPerPass] = useState('500');
  const [maxPasses, setMaxPasses] = useState('5');
  const [passCode, setPassCode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setError(null);
    setIsSubmitting(false);
    if (editingLink) {
      setTitle(editingLink.title);
      setUrl(editingLink.url);
      setRewardPerPass(String(editingLink.rewardPerPass));
      setMaxPasses(String(editingLink.maxPasses));
      setPassCode(editingLink.passCode || '');
      setDescription(editingLink.description);
    } else {
      setTitle('');
      setUrl('https://');
      setRewardPerPass('500');
      setMaxPasses('5');
      setPassCode(generateRandomPassCode());
      setDescription('Mở link, hoàn thành bước vượt link để lấy mã xác nhận rồi quay lại nhập mã nhận tiền.');
    }
  }, [editingLink, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedReward = Math.floor(Number(rewardPerPass));
    const parsedMax = Math.floor(Number(maxPasses));
    const cleanCode = passCode.trim();

    if (!title.trim()) {
      setError('Vui lòng nhập tên nhiệm vụ / link.');
      return;
    }
    if (!url.trim() || (!url.trim().startsWith('http://') && !url.trim().startsWith('https://') && !url.trim().startsWith('/'))) {
      setError('Đường dẫn link phải bắt đầu bằng https:// hoặc http://.');
      return;
    }
    if (!Number.isFinite(parsedReward) || parsedReward < 0) {
      setError('Số tiền thưởng mỗi lần vượt phải lớn hơn hoặc bằng 0.');
      return;
    }
    if (!Number.isFinite(parsedMax) || parsedMax < 1) {
      setError('Số lần vượt tối đa phải từ 1 trở lên.');
      return;
    }
    if (cleanCode.length < 2 || cleanCode.length > 64) {
      setError('Mã xác nhận vượt link phải dài từ 2 đến 64 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        url: url.trim(),
        rewardPerPass: parsedReward,
        maxPasses: parsedMax,
        passCode: cleanCode,
        description: description.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu link kiếm tiền.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="earn-link-form-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#0D1019] p-6 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 id="earn-link-form-title" className="font-display text-xl font-bold text-white">
            {editingLink ? 'Sửa link kiếm tiền' : 'Thêm link kiếm tiền mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng biểu mẫu"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="earn-field-title" className="block text-xs font-medium text-slate-300">
              Tên nhiệm vụ / Link *
            </label>
            <input
              id="earn-field-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Vượt link Link4M #1"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div>
            <label htmlFor="earn-field-url" className="block text-xs font-medium text-slate-300">
              Đường dẫn vượt link *
            </label>
            <input
              id="earn-field-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://link4m.com/..."
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 font-mono text-base sm:text-xs text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="earn-field-reward"
                className="block text-xs font-medium text-slate-300"
              >
                Số tiền 1 lần vượt (VNĐ) *
              </label>
              <input
                id="earn-field-reward"
                type="number"
                min={0}
                step={100}
                required
                value={rewardPerPass}
                onChange={(e) => setRewardPerPass(e.target.value)}
                placeholder="500"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 font-mono text-base sm:text-sm text-white focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div>
              <label htmlFor="earn-field-max" className="block text-xs font-medium text-slate-300">
                Số lần vượt tối đa *
              </label>
              <input
                id="earn-field-max"
                type="number"
                min={1}
                step={1}
                required
                value={maxPasses}
                onChange={(e) => setMaxPasses(e.target.value)}
                placeholder="5"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 font-mono text-base sm:text-sm text-white focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="earn-field-code" className="block text-xs font-medium text-slate-300">
                Mã xác nhận khi vượt xong (do Admin tạo) *
              </label>
              <button
                type="button"
                onClick={() => setPassCode(generateRandomPassCode())}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                <span>Tạo ngẫu nhiên</span>
              </button>
            </div>
            <input
              id="earn-field-code"
              type="text"
              required
              value={passCode}
              onChange={(e) => setPassCode(e.target.value)}
              placeholder="Ví dụ: KID500"
              autoCapitalize="none"
              autoCorrect="off"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 font-mono text-base sm:text-sm text-amber-200 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Thành viên phải nhập đúng mã này sau khi quay lại web mới nhận được tiền. Mã được lưu bảo mật trên máy chủ và đồng bộ cho Admin trên mọi thiết bị.
            </p>
          </div>

          <div>
            <label htmlFor="earn-field-desc" className="block text-xs font-medium text-slate-300">
              Hướng dẫn ngắn (tùy chọn)
            </label>
            <textarea
              id="earn-field-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú cách vượt link cho thành viên..."
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 text-base sm:text-sm leading-relaxed text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="neon-btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Đang lưu...' : editingLink ? 'Lưu cập nhật' : 'Thêm Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
