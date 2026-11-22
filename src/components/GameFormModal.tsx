import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { SAMPLE_COVER_OPTIONS } from '../data/seedGames';
import { GameCategory, GameItem } from '../types/game';
import { GameCoverImage } from './GameCoverImage';

export interface GameFormInput {
  title: string;
  coverUrl: string;
  category: GameCategory;
  genre: string;
  version: string;
  size: string;
  downloadUrl: string;
  review: string;
  installGuide: string[];
}

interface GameFormModalProps {
  isOpen: boolean;
  editingGame: GameItem | null;
  onClose: () => void;
  onSubmit: (data: GameFormInput) => void;
}

const GENRE_PRESETS = [
  'Hành động',
  'Sinh tồn',
  'Nhập vai',
  'Thể thao',
  'Phiêu lưu',
  'Chiến thuật',
  'Kinh dị',
  'Đua xe',
];

export function GameFormModal({ isOpen, editingGame, onClose, onSubmit }: GameFormModalProps) {
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [category, setCategory] = useState<GameCategory>('normal');
  const [genre, setGenre] = useState('Hành động');
  const [version, setVersion] = useState('v1.0.0');
  const [size, setSize] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [review, setReview] = useState('');
  const [installStepsText, setInstallStepsText] = useState('');

  useEffect(() => {
    if (editingGame) {
      setTitle(editingGame.title);
      setCoverUrl(editingGame.coverUrl);
      setCategory(editingGame.category || 'normal');
      setGenre(editingGame.genre);
      setVersion(editingGame.version);
      setSize(editingGame.size);
      setDownloadUrl(editingGame.downloadUrl);
      setReview(editingGame.review);
      setInstallStepsText(editingGame.installGuide.join('\n'));
    } else {
      setTitle('');
      setCoverUrl(SAMPLE_COVER_OPTIONS[0].url);
      setCategory('normal');
      setGenre('Hành động');
      setVersion('v1.0.0');
      setSize('12.5 GB');
      setDownloadUrl('https://cdn.taigamekid.vn/files/');
      setReview('');
      setInstallStepsText(
        'Tải tệp cài đặt từ liên kết trực tiếp.\nGiải nén tệp bằng WinRAR hoặc 7-Zip.\nChạy tệp thực thi (.exe) với quyền Administrator để bắt đầu chơi.'
      );
    }
  }, [editingGame, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const steps = installStepsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    onSubmit({
      title: title.trim(),
      coverUrl: coverUrl.trim(),
      category,
      genre: genre.trim() || 'Hành động',
      version: version.trim() || 'v1.0.0',
      size: size.trim() || 'Chưa rõ',
      downloadUrl: downloadUrl.trim() || '#',
      review: review.trim(),
      installGuide: steps,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-form-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[#0D1019] p-6 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 id="game-form-title" className="font-display text-xl font-bold text-white">
            {editingGame ? 'Cập nhật thông tin Game' : 'Thêm Game mới vào kho'}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="field-title" className="block text-xs font-medium text-slate-300">
                Tên game *
              </label>
              <input
                id="field-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Elden Ring: Shadow Edition"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div className="sm:col-span-2">
              <span className="block text-xs font-medium text-slate-300">Phân mục *</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCategory('hack')}
                  className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    category === 'hack'
                      ? 'border-purple-400/60 bg-purple-500/20 text-purple-200'
                      : 'border-white/10 bg-[#07080D] text-slate-400 hover:text-white'
                  }`}
                >
                  Mục 1: Hack
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('normal')}
                  className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    category === 'normal'
                      ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                      : 'border-white/10 bg-[#07080D] text-slate-400 hover:text-white'
                  }`}
                >
                  Mục 2: Game thường
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="field-genre" className="block text-xs font-medium text-slate-300">
                Thể loại *
              </label>
              <input
                id="field-genre"
                list="genre-presets-list"
                required
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Hành động"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
              <datalist id="genre-presets-list">
                {GENRE_PRESETS.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="field-version" className="block text-xs font-medium text-slate-300">
                  Phiên bản *
                </label>
                <input
                  id="field-version"
                  type="text"
                  required
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1.0.0"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 font-mono text-sm text-white focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              <div>
                <label htmlFor="field-size" className="block text-xs font-medium text-slate-300">
                  Dung lượng *
                </label>
                <input
                  id="field-size"
                  type="text"
                  required
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="24.5 GB"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 font-mono text-sm text-white focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>
            </div>
          </div>

          {/* Cover URL + Preview */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-8 space-y-2">
              <label htmlFor="field-cover" className="block text-xs font-medium text-slate-300">
                Link ảnh bìa
              </label>
              <input
                id="field-cover"
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://... hoặc chọn ảnh mẫu bên dưới"
                className="w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_COVER_OPTIONS.map((opt) => (
                  <button
                    key={opt.url}
                    type="button"
                    onClick={() => setCoverUrl(opt.url)}
                    className={`rounded-md border px-2 py-1 text-[11px] transition-colors cursor-pointer ${
                      coverUrl === opt.url
                        ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                        : 'border-white/10 bg-[#07080D] text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-4">
              <span className="block text-xs font-medium text-slate-300">Xem trước ảnh bìa</span>
              <div className="mt-1.5 aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-[#07080D]">
                <GameCoverImage
                  src={coverUrl}
                  alt="Xem trước ảnh bìa"
                  title={title || 'Ảnh bìa'}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="field-download-url" className="block text-xs font-medium text-slate-300">
              Link tải trực tiếp *
            </label>
            <input
              id="field-download-url"
              type="text"
              required
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="https://cdn.example.com/game-setup.zip"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 font-mono text-xs text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div>
            <label htmlFor="field-review" className="block text-xs font-medium text-slate-300">
              Bài đánh giá chi tiết *
            </label>
            <textarea
              id="field-review"
              rows={4}
              required
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Viết đánh giá về cốt truyện, đồ họa, lối chơi và cấu hình đề nghị..."
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div>
            <label htmlFor="field-guide" className="block text-xs font-medium text-slate-300">
              Hướng dẫn cài đặt từng bước (mỗi dòng là 1 bước) *
            </label>
            <textarea
              id="field-guide"
              rows={4}
              required
              value={installStepsText}
              onChange={(e) => setInstallStepsText(e.target.value)}
              placeholder="Bước 1: Tải file nén...&#10;Bước 2: Giải nén...&#10;Bước 3: Chạy file..."
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#07080D] px-3.5 py-2.5 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
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
              className="neon-btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold text-white cursor-pointer"
            >
              {editingGame ? 'Lưu cập nhật' : 'Thêm Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
