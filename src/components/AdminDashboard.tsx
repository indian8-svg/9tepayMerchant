import React, { useState, useEffect } from 'react';
import {
  Shield,
  Server,
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sliders,
  Check,
  X,
  Database,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { AdminStats, MerchantListItem, Order } from '../types';
import { formatCurrency } from '../utils/upi';

interface AdminDashboardProps {
  orders: Order[];
  onRefreshOrders?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, onRefreshOrders }) => {
  const [stats, setStats] = useState<AdminStats>({
    totalMerchants: 4,
    totalGmv: 54448.0,
    totalTransactions: 33,
    webhookSuccessRate: 99.4,
    activeVpas: 3,
    serverUptime: '99.98% (Hostinger hCDN Edge)',
    phpVersion: 'PHP/8.3.31 (FPM/FastCGI)',
    hostingerNode: 'hcdn-nme-edge-2a02',
    reconciliationQueue: 0,
  });

  const [merchants, setMerchants] = useState<MerchantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reconciliationMsg, setReconciliationMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'suspended' | 'pending_kyc'>('ALL');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, merchRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/merchants'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (merchRes.ok) {
        const merchData = await merchRes.json();
        setMerchants(merchData);
      }
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleStatus = async (merchant: MerchantListItem) => {
    const nextStatus = merchant.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/merchants/${merchant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setMerchants((prev) =>
          prev.map((m) => (m.id === merchant.id ? { ...m, status: nextStatus } : m))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveKyc = async (merchantId: string) => {
    try {
      const res = await fetch(`/api/admin/merchants/${merchantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      if (res.ok) {
        setMerchants((prev) =>
          prev.map((m) => (m.id === merchantId ? { ...m, status: 'active' } : m))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReconcileAll = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/reconcile-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setReconciliationMsg(data.message);
        if (onRefreshOrders) onRefreshOrders();
        fetchAdminData();
        setTimeout(() => setReconciliationMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.vpa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                demotry.shop/admin/dashboard.php
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Master Superadmin Console
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>Platform Administration & Merchant Governance</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Global oversight across all registered merchant VPAs, automated banking SMS reconciliation engine, and Hostinger server runtime.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleReconcileAll}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Radio className="w-4 h-4 text-emerald-200 animate-pulse" />
              <span>Trigger SMS Reconciliation</span>
            </button>

            <button
              onClick={fetchAdminData}
              disabled={isLoading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {reconciliationMsg && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reconciliationMsg}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Platform GMV</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {formatCurrency(stats.totalGmv)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            All Onboarded Merchants
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Active Merchants</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats.totalMerchants} Accounts
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <span>{stats.activeVpas} Active VPAs Routing</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Webhook Reliability</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats.webhookSuccessRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Avg Latency: 142ms
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Hostinger Server Runtime</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-white mt-2 truncate font-mono">
            {stats.phpVersion}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Edge: {stats.hostingerNode}
          </div>
        </div>
      </div>

      {/* Merchant Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Registered Merchant Accounts &amp; Settlements</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage merchant statuses, custom fee rates, and receiver UPI virtual payment addresses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search merchant or VPA..."
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_kyc">Pending KYC</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Merchant / Business</th>
                <th className="py-3 px-4">Receiver UPI VPA</th>
                <th className="py-3 px-4">Settled Volume</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredMerchants.map((merchant) => (
                <tr key={merchant.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{merchant.businessName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {merchant.ownerName} &bull; {merchant.email}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                      {merchant.vpa}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-white font-mono">
                    {formatCurrency(merchant.totalVolume)}
                    <span className="text-[10px] text-slate-500 font-normal ml-1">
                      ({merchant.totalOrders} txs)
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {merchant.commissionRate.toFixed(1)}%
                  </td>

                  <td className="py-3.5 px-4">
                    {merchant.status === 'active' && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}
                    {merchant.status === 'pending_kyc' && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Pending KYC</span>
                      </span>
                    )}
                    {merchant.status === 'suspended' && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <X className="w-3 h-3" />
                        <span>Suspended</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-2">
                    {merchant.status === 'pending_kyc' && (
                      <button
                        onClick={() => handleApproveKyc(merchant.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow"
                      >
                        Approve KYC
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleStatus(merchant)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        merchant.status === 'active'
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {merchant.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Server & SMS Scraping Reconciliation Engine Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>SMS Scraping &amp; UTR Reconciliation Engine</span>
          </h4>
          <p className="text-xs text-slate-400">
            How turnkey scripts like Lolapay/PayIndia verify UPI settlements without formal banking API access:
          </p>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2">
              <span className="text-emerald-400 font-bold">1.</span>
              <span className="text-slate-300">Android app or GSM SMS scraper parses incoming bank credit SMS (ICICI, HDFC, SBI).</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2">
              <span className="text-emerald-400 font-bold">2.</span>
              <span className="text-slate-300">Matches 12-digit UTR and INR amount against pending order token.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2">
              <span className="text-emerald-400 font-bold">3.</span>
              <span className="text-slate-300">Fires signed webhook (HMAC-SHA256) to merchant backend.</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <Server className="w-4 h-4 text-amber-400" />
            <span>Hostinger Environment Specifications</span>
          </h4>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800 font-mono">
              <span className="text-slate-500">Web Engine</span>
              <span>Hostinger hCDN Edge / Apache / LiteSpeed</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800 font-mono">
              <span className="text-slate-500">PHP Version</span>
              <span className="text-emerald-400 font-bold">PHP 8.3.31 FPM</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800 font-mono">
              <span className="text-slate-500">Database Engine</span>
              <span>MySQL 8.0.35 (InnoDB Engine)</span>
            </div>
            <div className="flex justify-between py-1 font-mono">
              <span className="text-slate-500">QR Generator API</span>
              <span>api.qrserver.com v1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
