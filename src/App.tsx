import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Smartphone,
  LayoutDashboard,
  Code2,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Sparkles,
  Lock,
  Layers,
  Shield,
  UserCheck,
  Building,
  RefreshCw,
  Sliders,
  Workflow,
  Globe,
  Radio,
} from 'lucide-react';
import { Order, MerchantProfile, WebhookLog, User, BankAccountQR, BankRoutingStrategy, SecurityEvent } from './types';
import { MerchantDashboard } from './components/MerchantDashboard';
import { HostedCheckout } from './components/HostedCheckout';
import { DeveloperApiDocs } from './components/DeveloperApiDocs';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthPortal } from './components/AuthPortal';
import { SecurityAuditPanel } from './components/SecurityAuditPanel';
import { OverviewCard } from './components/OverviewCard';
import { RedFlagsPanel } from './components/RedFlagsPanel';
import { TechnicalStackPanel } from './components/TechnicalStackPanel';
import { EndpointsMapPanel } from './components/EndpointsMapPanel';
import { GatewayWorkflowSimulator } from './components/GatewayWorkflowSimulator';
import { LiveCustomScanView } from './components/LiveCustomScanView';
import { demotryAnalysisData } from './data/demotryAnalysis';

export function App() {
  const [activeView, setActiveView] = useState<
    'dashboard' | 'checkout' | 'admin' | 'auth' | 'docs' | 'audit' | 'workflow' | 'live_scan'
  >('dashboard');

  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'usr_merchant_01',
    name: 'Abhay Sharma',
    email: 'merchant@9tepay.com',
    phone: '+91 98765 43210',
    role: 'merchant',
    businessName: '9tepay Merchant Services',
    vpa: '9tepay.business@icici',
    status: 'active',
    createdAt: '2026-08-01T10:00:00.000Z',
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountQR[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [profile, setProfile] = useState<MerchantProfile>({
    businessName: '9tepay Merchant Services',
    vpa: '9tepay.business@icici',
    phone: '+91 98765 43210',
    email: 'merchant@9tepay.com',
    apiKey: 'pi_live_9b4e872c019a8f23',
    apiSecret: 'sk_live_65a7d903e14fbc9081',
    webhookUrl: 'https://shop.example.com/api/webhook/upi-callback',
    webhookSecret: 'whsec_live_99a8b7c6d5e4f3a2',
    autoApproveUtr: true,
    settlementRate: 0.0,
    routingStrategy: 'smart_round_robin',
    requireStrictUtrFormat: true,
    preventDuplicateUtr: true,
  });
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch initial backend state
  const refreshAll = async () => {
    try {
      const [ordersRes, profileRes, webhookRes, authRes, banksRes, secRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/merchant/profile'),
        fetch('/api/webhooks/logs'),
        fetch('/api/auth/me'),
        fetch('/api/merchant/bank-accounts'),
        fetch('/api/security/events'),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
        if (ordersData.length > 0 && !selectedOrder) {
          const pending = ordersData.find((o: Order) => o.status === 'PENDING') || ordersData[0];
          setSelectedOrder(pending);
        }
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      if (webhookRes.ok) {
        const whData = await webhookRes.json();
        setWebhookLogs(whData);
      }

      if (banksRes.ok) {
        const banksData = await banksRes.json();
        setBankAccounts(banksData);
      }

      if (secRes.ok) {
        const secData = await secRes.json();
        setSecurityEvents(secData);
      }

      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.user) {
          setCurrentUser(authData.user);
        }
      }
    } catch (err) {
      console.error('Failed to load initial gateway data', err);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleOpenCheckout = (order: Order) => {
    setSelectedOrder(order);
    setActiveView('checkout');
  };

  const handlePaymentSuccess = (updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    setSelectedOrder(updatedOrder);
    fetch('/api/webhooks/logs')
      .then((res) => res.json())
      .then((data) => setWebhookLogs(data))
      .catch(console.error);
    fetch('/api/merchant/bank-accounts')
      .then((res) => res.json())
      .then((data) => setBankAccounts(data))
      .catch(console.error);
  };

  const handleCreateOrder = async (orderPayload: any): Promise<Order> => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    const data = await res.json();
    if (data.success && data.order) {
      setOrders((prev) => [data.order, ...prev]);
      return data.order;
    }
    throw new Error(data.error || 'Failed to create order');
  };

  const handleUpdateProfile = async (updated: Partial<MerchantProfile>) => {
    const res = await fetch('/api/merchant/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    const data = await res.json();
    if (data.success && data.profile) {
      setProfile(data.profile);
    }
  };

  // Multi-Bank Handlers
  const handleAddBank = async (bankData: Partial<BankAccountQR>) => {
    const res = await fetch('/api/merchant/bank-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bankData),
    });
    const data = await res.json();
    if (data.success && data.bankAccount) {
      setBankAccounts((prev) => [...prev, data.bankAccount]);
    }
  };

  const handleUpdateBank = async (id: string, bankData: Partial<BankAccountQR>) => {
    const res = await fetch(`/api/merchant/bank-accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bankData),
    });
    const data = await res.json();
    if (data.success && data.bankAccount) {
      setBankAccounts((prev) => prev.map((b) => (b.id === id ? data.bankAccount : b)));
    }
  };

  const handleDeleteBank = async (id: string) => {
    const res = await fetch(`/api/merchant/bank-accounts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setBankAccounts((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleSetPrimaryBank = async (id: string) => {
    const res = await fetch(`/api/merchant/bank-accounts/${id}/primary`, { method: 'PUT' });
    const data = await res.json();
    if (data.success && data.bankAccount) {
      setBankAccounts((prev) =>
        prev.map((b) => ({ ...b, isPrimary: b.id === id }))
      );
      setProfile((prev) => ({ ...prev, vpa: data.bankAccount.vpa }));
    }
  };

  const handleToggleActiveBank = async (id: string) => {
    const bank = bankAccounts.find((b) => b.id === id);
    if (!bank) return;
    await handleUpdateBank(id, { isActive: !bank.isActive });
  };

  const handleUpdateRoutingStrategy = async (
    strategy: BankRoutingStrategy,
    requireStrictUtr: boolean,
    preventDuplicateUtr: boolean
  ) => {
    const res = await fetch('/api/merchant/routing-rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routingStrategy: strategy,
        requireStrictUtrFormat: requireStrictUtr,
        preventDuplicateUtr,
      }),
    });
    const data = await res.json();
    if (data.success && data.profile) {
      setProfile(data.profile);
    }
  };

  const handleTriggerSecurityProbe = async (type: string, orderNumber: string, utr: string) => {
    const res = await fetch('/api/security/probe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, orderNumber, utr }),
    });
    const data = await res.json();
    if (data.event) {
      setSecurityEvents((prev) => [data.event, ...prev]);
    }
  };

  const handleRegenerateKeys = async () => {
    const res = await fetch('/api/merchant/keys/regenerate', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setProfile((prev) => ({
        ...prev,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
      }));
    }
  };

  const handleTriggerTestWebhook = async () => {
    const res = await fetch('/api/webhooks/test-dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: profile.webhookUrl }),
    });
    const data = await res.json();
    if (data.success && data.log) {
      setWebhookLogs((prev) => [data.log, ...prev]);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveView('admin');
    } else {
      setActiveView('dashboard');
    }
    refreshAll();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setActiveView('auth');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight">
                  9tepay Merchant Gateway
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline-block">
                  NPCI Deeplink Intent
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden md:block">
                9tepay.com &bull; Enterprise UPI Switching Engine &bull; GPay / PhonePe / Paytm / BHIM
              </p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto max-w-full">
            {/* Merchant Dashboard */}
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Merchant Dashboard (/merchant/dashboard.php)"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Merchant</span>
              <span className="sm:hidden">Merchant</span>
            </button>

            {/* Deeplink Checkout */}
            <button
              onClick={() => {
                if (!selectedOrder && orders.length > 0) {
                  setSelectedOrder(orders[0]);
                }
                setActiveView('checkout');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === 'checkout'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hosted Checkout Demo (/demo)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Checkout</span>
              <span className="sm:hidden">Pay</span>
            </button>

            {/* Superadmin Panel */}
            <button
              onClick={() => setActiveView('admin')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === 'admin'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Superadmin Panel (/admin/dashboard.php)"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
              <span className="sm:hidden">Admin</span>
            </button>

            {/* Auth Portal */}
            <button
              onClick={() => setActiveView('auth')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === 'auth'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Auth Gate & Onboarding (/auth/login.php)"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Auth/Onboard</span>
              <span className="sm:hidden">Auth</span>
            </button>

            {/* Developer API */}
            <button
              onClick={() => setActiveView('docs')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === 'docs'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Developer API & Sandbox (/docs)"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">API</span>
              <span className="sm:hidden">API</span>
            </button>

            {/* Security Audit */}
            <button
              onClick={() => setActiveView('audit')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === 'audit'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="demotry.shop Threat Audit & Intel"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Audit</span>
              <span className="sm:hidden">Audit</span>
            </button>

            {/* Workflow Simulator */}
            <button
              onClick={() => setActiveView('workflow')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === 'workflow'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Payment Flow Architecture"
            >
              <Workflow className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flow</span>
            </button>

            {/* Live URL Scanner */}
            <button
              onClick={() => setActiveView('live_scan')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === 'live_scan'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Live URL Inspector"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scanner</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* VIEW 1: Merchant Dashboard */}
        {activeView === 'dashboard' && (
          <MerchantDashboard
            orders={orders}
            profile={profile}
            webhookLogs={webhookLogs}
            bankAccounts={bankAccounts}
            onAddBank={handleAddBank}
            onUpdateBank={handleUpdateBank}
            onDeleteBank={handleDeleteBank}
            onSetPrimary={handleSetPrimaryBank}
            onToggleActive={handleToggleActiveBank}
            routingStrategy={profile.routingStrategy || 'smart_round_robin'}
            onUpdateRoutingStrategy={handleUpdateRoutingStrategy}
            securityEvents={securityEvents}
            onTriggerSecurityProbe={handleTriggerSecurityProbe}
            onOpenCheckout={handleOpenCheckout}
            onCreateOrder={handleCreateOrder}
            onUpdateProfile={handleUpdateProfile}
            onRegenerateKeys={handleRegenerateKeys}
            onTriggerTestWebhook={handleTriggerTestWebhook}
          />
        )}

        {/* VIEW 2: Hosted Checkout */}
        {activeView === 'checkout' && selectedOrder && (
          <HostedCheckout
            order={selectedOrder}
            bankAccounts={bankAccounts}
            onPaymentSuccess={handlePaymentSuccess}
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        )}

        {/* VIEW 3: Superadmin Control Panel */}
        {activeView === 'admin' && (
          <AdminDashboard
            orders={orders}
            onRefreshOrders={refreshAll}
          />
        )}

        {/* VIEW 4: Auth & Onboarding Portal */}
        {activeView === 'auth' && (
          <AuthPortal
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
        )}

        {/* VIEW 5: Developer API Docs */}
        {activeView === 'docs' && (
          <DeveloperApiDocs profile={profile} />
        )}

        {/* VIEW 6: Security Audit of demotry.shop */}
        {activeView === 'audit' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <span>Security Audit &amp; Technical Intelligence</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Target Analyzed: https://demotry.shop/merchant/dashboard.php
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Risk Level: High Risk (78/100)
                  </span>
                </div>
              </div>
            </div>

            <OverviewCard data={demotryAnalysisData} />
            <RedFlagsPanel redFlags={demotryAnalysisData.redFlags} />
            <SecurityAuditPanel
              securityChecks={demotryAnalysisData.securityChecks || []}
              headers={demotryAnalysisData.headers}
              cookieAnalysis={demotryAnalysisData.cookieAnalysis}
            />
            <TechnicalStackPanel
              techStack={demotryAnalysisData.techStack}
              hosting={demotryAnalysisData.hosting}
            />
            <EndpointsMapPanel
              endpoints={demotryAnalysisData.endpoints}
              domain={demotryAnalysisData.domain}
            />
          </div>
        )}

        {/* VIEW 7: Gateway Payment Workflow Diagram */}
        {activeView === 'workflow' && (
          <GatewayWorkflowSimulator />
        )}

        {/* VIEW 8: Live URL Custom Scanner */}
        {activeView === 'live_scan' && (
          <LiveCustomScanView defaultUrl="https://demotry.shop/merchant/dashboard.php" />
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">9tepay Merchant Gateway</span>
            <span>&bull;</span>
            <span className="font-mono text-emerald-400">Zero-Gateway-Fee UPI Processing Engine</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 flex items-center gap-3">
            <span>Primary VPA: <strong className="text-slate-200">{profile.vpa}</strong></span>
            <span>Session: <strong className="text-emerald-400">9tepay_session_active</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
