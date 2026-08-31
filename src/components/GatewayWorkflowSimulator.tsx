import React from 'react';
import { Workflow, QrCode, ArrowRight, ShieldAlert, CheckCircle2, UserCheck, Send } from 'lucide-react';

interface GatewayWorkflowSimulatorProps {
  workflowSteps: {
    step: number;
    title: string;
    description: string;
    risks: string[];
  }[];
}

export const GatewayWorkflowSimulator: React.FC<GatewayWorkflowSimulatorProps> = ({ workflowSteps }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Payment Gateway Workflow & Risk Mechanics</h3>
            <p className="text-xs text-slate-400">
              Step-by-step transaction lifecycle of the 9tepay UPI routing engine
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {workflowSteps.map((step) => (
          <div
            key={step.step}
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-3 relative"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center">
                  0{step.step}
                </span>
                <span className="text-[10px] font-mono text-slate-500">Step {step.step}/4</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100 leading-snug">{step.title}</h4>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{step.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider">
                Vulnerabilities:
              </span>
              {step.risks.map((r, i) => (
                <div key={i} className="text-[10px] text-slate-400 flex items-start gap-1">
                  <span className="text-rose-400 shrink-0">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* UPI Intent & Regulatory comparison box */}
      <div className="bg-slate-950 rounded-xl p-4.5 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Regulatory Disconnect: Authorized Payment Aggregators vs. Turnkey Scripts
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
            <span className="text-emerald-400 font-bold block mb-1">
              Official Aggregators (Razorpay, Cashfree, PayU):
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Licensed by Reserve Bank of India (RBI), operate regulated nodal/escrow accounts, automated NPCI banking callbacks, strict KYC, and 99.99% uptime enterprise SLAs.
            </p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
            <span className="text-amber-400 font-bold block mb-1">
              Script Clones (Lolapay / PayIndia on demotry.shop):
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Typically rely on P2P UPI QR generation or merchant VPA forwarding. Lacks banking nodal guarantees, leaving merchants vulnerable to sudden UPI VPA blacklisting by banks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
