import React from 'react';
import { ShieldAlert, Search, RefreshCw, Globe, ArrowRight } from 'lucide-react';

interface HeaderProps {
  currentUrl: string;
  onUrlSubmit: (url: string) => void;
  isLoading: boolean;
  onResetToDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUrl,
  onUrlSubmit,
  isLoading,
  onResetToDemo,
}) => {
  const [inputUrl, setInputUrl] = React.useState(currentUrl);

  React.useEffect(() => {
    setInputUrl(currentUrl);
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onUrlSubmit(inputUrl.trim());
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & Target Identifier */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Merchant Gateway & URL Inspector
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Audit
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Security triage & technical intelligence for web services and payment panels
              </p>
            </div>
          </div>

          {/* Search / Live Scan Bar */}
          <form onSubmit={handleSubmit} className="flex-1 max-w-xl flex items-center gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter URL to inspect (e.g. https://demotry.shop/merchant/dashboard.php)"
                className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs sm:text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Analyze</span>
            </button>
            <button
              type="button"
              onClick={onResetToDemo}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs px-2.5 py-2 rounded-lg transition-colors shrink-0 cursor-pointer"
              title="Reset to demotry.shop analysis"
            >
              Target Case
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};
