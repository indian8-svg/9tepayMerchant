import React from 'react';
import {
  Globe,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Terminal,
  Server,
  Layers,
} from 'lucide-react';

interface LiveScanData {
  url: string;
  success: boolean;
  status?: number;
  statusText?: string;
  responseTimeMs?: number;
  headers?: Record<string, string>;
  redirectChain?: { url: string; status: number; location?: string }[];
  securityAudit?: {
    hsts: { present: boolean; value: string; status: string; recommendation: string };
    xFrameOptions: { present: boolean; value: string; status: string; recommendation: string };
    xContentTypeOptions: { present: boolean; value: string; status: string; recommendation: string };
    csp: { present: boolean; value: string; status: string; recommendation: string };
    referrerPolicy: { present: boolean; value: string; status: string; recommendation: string };
    serverBanner: { present: boolean; value: string; status: string; recommendation: string };
  };
  score?: number;
  detectedTech?: string[];
  isHttps?: boolean;
  error?: string;
}

interface LiveCustomScanViewProps {
  data: LiveScanData;
  onBackToCaseStudy: () => void;
}

export const LiveCustomScanView: React.FC<LiveCustomScanViewProps> = ({
  data,
  onBackToCaseStudy,
}) => {
  const [showRaw, setShowRaw] = React.useState(false);

  if (!data.success) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <XCircle className="w-5 h-5" />
            <span>Connection / Inspection Failed</span>
          </div>
          <button
            onClick={onBackToCaseStudy}
            className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
          >
            Back to Case Study
          </button>
        </div>
        <p className="text-sm text-slate-300">
          Could not establish connection to <span className="font-mono text-white">{data.url}</span>.
        </p>
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-rose-300">
          Error: {data.error || 'Host unreachable or request timed out'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Live Endpoint Response</h3>
            <p className="text-xs font-mono text-slate-400 break-all">{data.url}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{data.responseTimeMs} ms</span>
          </div>
          <button
            onClick={onBackToCaseStudy}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors cursor-pointer"
          >
            View Full Case Study
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status Code</div>
          <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                (data.status || 0) < 400 ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span>{data.status} {data.statusText}</span>
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Security Grade</div>
          <div className="text-base font-bold text-emerald-400 mt-1">
            {data.score} / 100
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Protocol</div>
          <div className="text-base font-bold text-white mt-1">
            {data.isHttps ? 'HTTPS (Encrypted)' : 'HTTP (Plaintext)'}
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Redirects</div>
          <div className="text-base font-bold text-amber-400 mt-1">
            {data.redirectChain?.length ? `${data.redirectChain.length} Hop(s)` : 'Direct'}
          </div>
        </div>
      </div>

      {/* Redirect Chain Trace if any */}
      {data.redirectChain && data.redirectChain.length > 0 && (
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Redirect Chain Execution Trace
          </h4>
          {(data.redirectChain || []).map((hop, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-mono text-slate-400 break-all">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                {hop.status}
              </span>
              <span className="text-slate-300">{hop.url}</span>
              <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="text-emerald-400">{hop.location}</span>
            </div>
          ))}
        </div>
      )}

      {/* Detected Tech Stack */}
      {data.detectedTech && data.detectedTech.length > 0 && (
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Detected Technologies & Fingerprints</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {(data.detectedTech || []).map((tech, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-medium text-indigo-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Security Audit Breakdown */}
      {data.securityAudit && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Security Headers Evaluation
            </h4>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Terminal className="w-3 h-3" />
              <span>{showRaw ? 'Show Cards' : 'Show Raw Headers'}</span>
            </button>
          </div>

          {showRaw ? (
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              {JSON.stringify(data.headers, null, 2)}
            </pre>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(data.securityAudit).map(([key, item]: [string, { present: boolean; value: string; status: string; recommendation: string }]) => (
                <div
                  key={key}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        item.status === 'pass'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : item.status === 'warn'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 truncate bg-slate-900 px-2 py-1 rounded">
                    {item.value}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    <span className="text-slate-400 font-semibold">Guidance: </span>
                    {item.recommendation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
