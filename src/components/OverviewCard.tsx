import React from 'react';
import {
  AlertTriangle,
  Server,
  Shield,
  ArrowRight,
  Lock,
  Zap,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Code2,
  Cookie,
} from 'lucide-react';
import { TargetAnalysisData } from '../types';

interface OverviewCardProps {
  data: TargetAnalysisData;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      
      {/* Top Tag & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {data.riskRating}
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
            HTTP 302 Redirect
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Lock className="w-3 h-3" /> HTTPS Enforced
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Risk Assessment:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                style={{ width: `${data.riskScore}%` }}
              />
            </div>
            <span className="text-xs font-bold text-amber-400">{data.riskScore}/100</span>
          </div>
        </div>
      </div>

      {/* Target Details & Direct Answer */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/70 shrink-0 text-slate-300">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {data.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 font-mono text-xs text-slate-400 break-all">
                <span className="text-slate-500">Requested:</span>
                <span className="text-slate-200">{data.url}</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-amber-400 font-semibold">{data.canonicalUrl}</span>
              </div>
            </div>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            {data.summary}
          </p>

          {/* Quick classification pill boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Classification</div>
              <div className="text-sm font-bold text-white mt-0.5">UPI Gateway Clone</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Host Infrastructure</div>
              <div className="text-sm font-bold text-white mt-0.5">Hostinger hCDN</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Session Token</div>
              <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">payindia_session</div>
            </div>
          </div>
        </div>

        {/* Server & Environment snapshot box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                Runtime & Hosting
              </div>
              <span className="text-[11px] font-mono text-slate-500">Hostinger Edge</span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Backend Engine:</span>
                <span className="font-mono text-emerald-400 font-medium">{data.hosting.phpVersion}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Control Panel:</span>
                <span className="text-slate-200 font-medium">{data.hosting.panel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Server Edge:</span>
                <span className="text-slate-200 font-medium">{data.hosting.server}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Primary Domain:</span>
                <span className="font-mono text-slate-300">{data.domain}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Auth Gatekeeper:</span>
                <span className="text-amber-400 font-semibold">CSRF & Session Lock</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 leading-normal flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Unauthenticated access is halted at the gate. Accessing the dashboard requires valid merchant credentials.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
