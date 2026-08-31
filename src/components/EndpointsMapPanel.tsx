import React from 'react';
import { Network, Lock, Unlock, ArrowRight, ExternalLink } from 'lucide-react';
import { EndpointInfo } from '../types';

interface EndpointsMapPanelProps {
  endpoints: EndpointInfo[];
  domain: string;
}

export const EndpointsMapPanel: React.FC<EndpointsMapPanelProps> = ({ endpoints, domain }) => {
  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">GET</span>;
      case 'POST':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">POST</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">{method}</span>;
    }
  };

  const getStatusBadge = (status: number) => {
    if (status === 200) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">200 OK</span>;
    }
    if (status === 302) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">302 Redirect</span>;
    }
    if (status === 401) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">401 Auth Req</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">{status}</span>;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400 border border-teal-500/20">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Discovered Route & Endpoint Map</h3>
            <p className="text-xs text-slate-400">
              Structural layout of public, administrative, checkout, and API routes on {domain}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {endpoints.length} Routes Cataloged
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">Method</th>
              <th className="py-2.5 px-3">Path</th>
              <th className="py-2.5 px-3">HTTP Status</th>
              <th className="py-2.5 px-3">Auth Lock</th>
              <th className="py-2.5 px-3">Purpose & Target Function</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {endpoints.map((ep, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-3">{getMethodBadge(ep.method)}</td>
                <td className="py-3 px-3 font-mono text-emerald-400 font-medium">
                  {ep.path}
                </td>
                <td className="py-3 px-3">{getStatusBadge(ep.status)}</td>
                <td className="py-3 px-3">
                  {ep.authRequired ? (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                      <Lock className="w-3 h-3" /> Session Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Unlock className="w-3 h-3 text-slate-500" /> Public
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-slate-300">
                  <div className="font-semibold text-slate-200">{ep.purpose}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-normal">{ep.details}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
