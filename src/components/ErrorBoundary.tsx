import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Uncaught component error in Gateway UI:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      this.setState({ hasError: false, error: null, errorInfo: null });
    } catch {
      window.location.reload();
    }
  };

  private handleClearAndReload = () => {
    try {
      localStorage.removeItem('9tepay_pristine_clean');
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[450px] flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900 font-sans">
                Interface Encountered a Recoverable Exception
              </h2>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                The gateway encountered a state rendering conflict. Your payment data and sessions are secure.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono text-slate-700 max-h-32 overflow-y-auto">
                <span className="font-bold text-rose-600">Error: </span>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recover Interface</span>
              </button>
              <button
                onClick={this.handleClearAndReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Reset &amp; Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
