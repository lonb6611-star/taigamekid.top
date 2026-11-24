import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Đã xảy ra sự cố không mong muốn.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#07080D] p-6 text-slate-100">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/35 bg-[#0D1019] p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-300">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="font-display text-xl font-bold text-white">
              Không thể tải dữ liệu
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Kết nối tới Cloud Firestore gặp sự cố hoặc bị gián đoạn. Vui lòng tải lại trang để thử kết nối lại.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="neon-btn-primary mt-5 inline-flex min-h-[42px] items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold text-white cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Tải lại trang</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
