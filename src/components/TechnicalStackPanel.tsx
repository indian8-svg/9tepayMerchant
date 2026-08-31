import React from 'react';
import { Layers, CheckCircle, Cpu, FileCode2, Globe2 } from 'lucide-react';
import { TechStackItem } from '../types';

interface TechnicalStackPanelProps {
  techStack: TechStackItem[];
  hosting: {
    provider: string;
    server: string;
    cdn: string;
    phpVersion: string;
    panel: string;
    ipAddresses: string[];
  };
}

export const TechnicalStackPanel: React.FC<TechnicalStackPanelProps> = ({ techStack, hosting }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Infrastructural & Technology Fingerprint</h3>
            <p className="text-xs text-slate-400">
              Deconstructed software layers, runtime engines, CDN edge, and library footprints
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          6 Detected Technologies
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {techStack.map((tech, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2.5"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {tech.category}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {tech.confidence} Confidence
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100 mt-1 flex items-center gap-1.5">
                <span>{tech.name}</span>
                {tech.version && (
                  <span className="text-xs font-mono font-normal text-slate-400">({tech.version})</span>
                )}
              </div>
            </div>

            <div className="bg-slate-900/90 rounded p-2 text-[11px] font-mono text-slate-300 border border-slate-800/80 break-words">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Evidence:</span>
              {tech.evidence}
            </div>
          </div>
        ))}
      </div>

      {/* Network & Routing Box */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
          <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
          Resolved IP & Edge Routing Nodes
        </h4>
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          {hosting.ipAddresses.map((ip, i) => (
            <span key={i} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              IPv6: {ip}
            </span>
          ))}
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-indigo-300">
            CDN: Hostinger nme-edge
          </span>
        </div>
      </div>
    </div>
  );
};
