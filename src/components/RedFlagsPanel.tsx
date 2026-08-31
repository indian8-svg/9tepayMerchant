import React from 'react';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, ShieldX, Building2, HelpCircle } from 'lucide-react';
import { RedFlagItem } from '../types';

interface RedFlagsPanelProps {
  redFlags: RedFlagItem[];
}

export const RedFlagsPanel: React.FC<RedFlagsPanelProps> = ({ redFlags }) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertOctagon className="w-3 h-3" /> Critical Threat
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> High Risk
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Medium Risk
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-700 text-slate-300">
            Info
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
            <ShieldX className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Threat Matrix & Red Flag Intelligence</h3>
            <p className="text-xs text-slate-400">
              Audit of business legitimacy, script origin, compliance gaps, and infrastructural liabilities
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {redFlags.length} Identified Issues
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {redFlags.map((flag) => (
          <div
            key={flag.id}
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {flag.category}
                </span>
                <h4 className="text-sm font-bold text-slate-100">{flag.title}</h4>
              </div>
              {getSeverityBadge(flag.severity)}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {flag.description}
            </p>

            <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-xs flex items-start gap-2">
              <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mt-0.5">
                Impact / Hazard:
              </span>
              <span className="text-slate-300">{flag.impact}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
