import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  LayoutDashboard,
  Code2,
  Lock,
  LogOut,
  Shield,
  UserCheck,
  Building,
  QrCode,
  Link2,
} from 'lucide-react';
import { Order, MerchantProfile, WebhookLog, User, BankAccountQR, BankRoutingStrategy, SecurityEvent } from './types';
import { safeFetch, fetchJson, api } from './utils/api';
import { MerchantDashboard } from './components/MerchantDashboard';
import { PaymentLinksManager } from './components/PaymentLinksManager';
import { HostedCheckout } from './components/HostedCheckout';
import { DeveloperApiDocs } from './components/DeveloperApiDocs';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthPortal } from './components/AuthPortal';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('9tepay_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [activeView, setActiveView] = useState<
    'dashboard' | 'payment_links' | 'checkout' | 'admin' | 'auth' | 'docs'
  >(() => {
    try {
      const saved = localStorage.getItem('9tepay_user');
      if (saved) {
        const u = JSON.parse(saved);
        return u.role === 'admin' ? 'admin' : 'dashboard';
      }
    } catch {
      // ignore
    }
    return 'auth';
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
        safeFetch<Order[]>('/api/orders'),
        safeFetch<MerchantProfile>('/api/merchant/profile'),
        safeFetch<WebhookLog[]>('/api/webhooks/logs'),
        safeFetch<{ success: boolean; user: User }>('/api/auth/me'),
        safeFetch<BankAccountQR[]>('/api/merchant/bank-accounts'),
        safeFetch<SecurityEvent[]>('/api/security/events'),
      ]);

      if (ordersRes.ok && Array.isArray(ordersRes.data)) {
        setOrders(ordersRes.data);
        if (ordersRes.data.length > 0 && !selectedOrder) {
          const pending = ordersRes.data.find((o: Order) => o.status === 'PENDING') || ordersRes.data[0];
          setSelectedOrder(pending);
        }
      }

      if (profileRes.ok && profileRes.data) {
        setProfile(profileRes.data);
      }

      if (webhookRes.ok && Array.isArray(webhookRes.data)) {
        setWebhookLogs(webhookRes.data);
      }

      if (banksRes.ok && Array.isArray(banksRes.data)) {
        setBankAccounts(banksRes.data);
      }

      if (secRes.ok && Array.isArray(secRes.data)) {
        setSecurityEvents(secRes.data);
      }

      if (authRes.ok) {
        if (authRes.data?.user) {
          setCurrentUser(authRes.data.user);
          try {
            localStorage.setItem('9tepay_user', JSON.stringify(authRes.data.user));
          } catch {}
        } else {
          const saved = localStorage.getItem('9tepay_user');
          if (!saved) {
            setCurrentUser(null);
          }
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

  const handlePaymentSuccess = async (updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    setSelectedOrder(updatedOrder);
    
    const [whRes, banksRes] = await Promise.all([
      safeFetch<WebhookLog[]>('/api/webhooks/logs'),
      safeFetch<BankAccountQR[]>('/api/merchant/bank-accounts'),
    ]);
    if (whRes.ok && Array.isArray(whRes.data)) {
      setWebhookLogs(whRes.data);
    }
    if (banksRes.ok && Array.isArray(banksRes.data)) {
      setBankAccounts(banksRes.data);
    }
  };

  const handleCreateOrder = async (orderPayload: any): Promise<Order> => {
    try {
      const data = await api.post<{ success: boolean; order: Order; error?: string }>('/api/orders', orderPayload);
      if (data.success && data.order) {
        setOrders((prev) => [data.order, ...prev]);
        return data.order;
      }
    } catch (err) {
      console.warn('API create order failed, generating reliable local payment link', err);
    }

    const numAmount = Number(orderPayload.amount) || 100;
    const finalOrderNumber = orderPayload.orderId?.trim() || `PL-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalCustomerName = orderPayload.customerName?.trim() || "Guest Customer";
    const finalNote = orderPayload.note?.trim() || `Payment for ${finalOrderNumber}`;
    const orderUniqueId = `ord_live_${Math.random().toString(36).substring(2, 9)}`;

    // Target bank VPA selection
    let targetVpa = profile.vpa || "merchant.settle@hdfcbank";
    let targetBankName = "Settlement Bank";
    let targetQrImage: string | undefined = undefined;

    if (orderPayload.bankAccountId) {
      const b = bankAccounts.find((x) => x.id === orderPayload.bankAccountId);
      if (b) {
        targetVpa = b.vpa;
        targetBankName = b.bankName;
        targetQrImage = b.customQrImage;
      }
    } else if (bankAccounts.length > 0) {
      const primary = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0];
      targetVpa = primary.vpa;
      targetBankName = primary.bankName;
      targetQrImage = primary.customQrImage;
    }

    const upiUri = `upi://pay?pa=${targetVpa.trim()}&pn=${encodeURIComponent(profile.businessName || 'Merchant Services')}&am=${numAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(finalNote)}&tr=${encodeURIComponent(finalOrderNumber)}`;

    const fallbackOrder: Order = {
      id: orderUniqueId,
      orderNumber: finalOrderNumber,
      amount: numAmount,
      currency: "INR",
      customerName: finalCustomerName,
      customerEmail: orderPayload.customerEmail,
      customerPhone: orderPayload.customerPhone,
      note: finalNote,
      merchantVpa: targetVpa,
      merchantName: profile.businessName || "Merchant Services",
      bankAccountId: orderPayload.bankAccountId,
      bankName: targetBankName,
      customQrImage: targetQrImage,
      status: "PENDING",
      upiString: upiUri,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
      callbackUrl: orderPayload.callbackUrl || "https://shop.example.com/order/success",
      webhookDelivered: false,
    };

    setOrders((prev) => [fallbackOrder, ...prev]);
    return fallbackOrder;
  };

  const handleCancelOrder = async (orderIdToCancel: string) => {
    try {
      await api.post(`/api/orders/${orderIdToCancel}/cancel`, {});
      setOrders((prev) =>
        prev.map((o) => (o.id === orderIdToCancel ? { ...o, status: 'EXPIRED' as const } : o))
      );
    } catch (err) {
      console.error('Failed to cancel order', err);
    }
  };

  const handleUpdateProfile = async (updated: Partial<MerchantProfile>) => {
    const data = await api.put<{ success: boolean; profile: MerchantProfile; error?: string }>(
      '/api/merchant/profile',
      updated
    );
    if (data.success && data.profile) {
      setProfile(data.profile);
    }
  };

  // Multi-Bank Handlers
  const handleAddBank = async (bankData: Partial<BankAccountQR>) => {
    try {
      const data = await api.post<{ success: boolean; bankAccount: BankAccountQR; error?: string }>(
        '/api/merchant/bank-accounts',
        bankData
      );
      if (data.success && data.bankAccount) {
        setBankAccounts((prev) => [...prev, data.bankAccount]);
        return;
      }
    } catch (err) {
      console.warn('API bank add fallback to local storage', err);
    }

    // Client-side fallback if server is unreachable
    const fallbackBank: BankAccountQR = {
      id: `bank_${Math.random().toString(36).substring(2, 9)}`,
      bankName: bankData.bankName || 'HDFC Bank',
      accountHolder: bankData.accountHolder || profile.businessName,
      accountNumber: bankData.accountNumber || '',
      ifsc: (bankData.ifsc || 'HDFC0000060').toUpperCase(),
      vpa: (bankData.vpa || profile.vpa).toLowerCase().trim(),
      qrTitle: bankData.qrTitle || `${bankData.bankName || 'Bank'} Instant QR`,
      qrType: bankData.qrType || 'dynamic_intent',
      qrColor: bankData.qrColor || '#10b981',
      customQrImage: bankData.customQrImage,
      isPrimary: bankAccounts.length === 0,
      isActive: true,
      dailyLimit: Number(bankData.dailyLimit) || 500000,
      dailyVolume: 0,
      totalSettled: 0,
      routingWeight: Number(bankData.routingWeight) || 5,
      createdAt: new Date().toISOString(),
    };
    setBankAccounts((prev) => [...prev, fallbackBank]);
  };

  const handleUpdateBank = async (id: string, bankData: Partial<BankAccountQR>) => {
    try {
      const data = await api.put<{ success: boolean; bankAccount: BankAccountQR; error?: string }>(
        `/api/merchant/bank-accounts/${id}`,
        bankData
      );
      if (data.success && data.bankAccount) {
        setBankAccounts((prev) => prev.map((b) => (b.id === id ? data.bankAccount : b)));
        return;
      }
    } catch (err) {
      console.warn('API update bank fallback to local state', err);
    }
    setBankAccounts((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...bankData } : b))
    );
  };

  const handleDeleteBank = async (id: string) => {
    try {
      await api.delete<{ success: boolean; message?: string; error?: string }>(
        `/api/merchant/bank-accounts/${id}`
      );
    } catch (err) {
      console.warn('API delete bank fallback to local state', err);
    }
    setBankAccounts((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSetPrimaryBank = async (id: string) => {
    try {
      const data = await api.post<{ success: boolean; bankAccounts?: BankAccountQR[]; bankAccount?: BankAccountQR; error?: string }>(
        `/api/merchant/bank-accounts/${id}/set-primary`
      );
      if (data.success) {
        if (data.bankAccounts) {
          setBankAccounts(data.bankAccounts);
        } else {
          setBankAccounts((prev) =>
            prev.map((b) => ({ ...b, isPrimary: b.id === id }))
          );
        }
        const primaryBank = data.bankAccounts?.find((b) => b.id === id) || data.bankAccount;
        if (primaryBank) {
          setProfile((prev) => ({ ...prev, vpa: primaryBank.vpa }));
        }
        return;
      }
    } catch (err) {
      console.warn('API set primary fallback to local state', err);
    }

    setBankAccounts((prev) =>
      prev.map((b) => ({ ...b, isPrimary: b.id === id }))
    );
    const selected = bankAccounts.find((b) => b.id === id);
    if (selected) {
      setProfile((prev) => ({ ...prev, vpa: selected.vpa }));
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
    const data = await api.put<{ success: boolean; profile?: MerchantProfile; settings?: any; error?: string }>(
      '/api/merchant/routing-rules',
      {
        strategy,
        requireStrictUtrFormat: requireStrictUtr,
        preventDuplicateUtr,
      }
    );
    if (data.success) {
      setProfile((prev) => ({
        ...prev,
        routingStrategy: strategy,
        requireStrictUtrFormat: requireStrictUtr,
        preventDuplicateUtr,
      }));
    } else if (data.error) {
      throw new Error(data.error);
    }
  };

  const handleTriggerSecurityProbe = async (type: string, orderNumber: string, utr: string) => {
    const data = await api.post<{ success: boolean; event: SecurityEvent; error?: string }>(
      '/api/security/probe',
      { type, orderNumber, utr }
    );
    if (data.event) {
      setSecurityEvents((prev) => [data.event, ...prev]);
    }
  };

  const handleRegenerateKeys = async () => {
    const data = await api.post<{ success: boolean; apiKey: string; apiSecret: string; error?: string }>(
      '/api/merchant/keys/regenerate'
    );
    if (data.success) {
      setProfile((prev) => ({
        ...prev,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
      }));
    }
  };

  const handleTriggerTestWebhook = async () => {
    const data = await api.post<{ success: boolean; log: WebhookLog; error?: string }>(
      '/api/webhooks/test-dispatch',
      { webhookUrl: profile.webhookUrl }
    );
    if (data.success && data.log) {
      setWebhookLogs((prev) => [data.log, ...prev]);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('9tepay_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    if (user.role === 'admin') {
      setActiveView('admin');
    } else {
      setActiveView('dashboard');
    }
    refreshAll();
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('9tepay_user');
      await safeFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setActiveView('auth');
  };

  // Safe view resolution based on authentication state
  const isPublicCheckout = activeView === 'checkout' && selectedOrder;
  const effectiveView = !currentUser && !isPublicCheckout ? 'auth' : activeView;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Navbar */}
      <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                  9tepay Merchant Gateway
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hidden sm:inline-block">
                  NPCI Deeplink Intent
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans hidden md:block">
                9tepay.com &bull; Enterprise UPI Switching Engine &bull; GPay / PhonePe / Paytm / BHIM
              </p>
            </div>
          </div>

          {/* Navigation Bar & User Controls */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto max-w-full">
                {/* Superadmin Panel - ONLY SHOWN IF USER IS ADMIN */}
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => setActiveView('admin')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      effectiveView === 'admin'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    title="Superadmin Panel"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>Admin Panel</span>
                  </button>
                )}

                {/* Merchant Dashboard */}
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    effectiveView === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title="Merchant Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Merchant</span>
                </button>

                {/* Payment Links Manager */}
                <button
                  onClick={() => setActiveView('payment_links')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    effectiveView === 'payment_links'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title="Payment Links & Instant UPI URLs"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Payment Links</span>
                </button>

                {/* Developer API */}
                <button
                  onClick={() => setActiveView('docs')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    effectiveView === 'docs'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title="Developer API & Sandbox (/docs)"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>API</span>
                </button>
              </nav>
            ) : (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <div className="px-3 py-1.5 rounded-lg font-semibold bg-blue-600 text-white shadow-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </div>
              </div>
            )}

            {/* Quick User Badge & Sign Out Button */}
            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 shadow-2xs">
                  <span className={`w-2 h-2 rounded-full ${currentUser.role === 'admin' ? 'bg-indigo-500' : 'bg-blue-500'} animate-pulse`}></span>
                  <span className="font-semibold text-slate-800 truncate max-w-[120px]">{currentUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 shadow-2xs"
                  title="Sign out of current session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {!currentUser ? (
          /* When signed out: ONLY show Public Checkout if viewing order or AuthPortal Login */
          isPublicCheckout && selectedOrder ? (
            <HostedCheckout
              order={selectedOrder}
              bankAccounts={bankAccounts}
              onPaymentSuccess={handlePaymentSuccess}
              onBackToDashboard={() => setActiveView('auth')}
            />
          ) : (
            <AuthPortal
              currentUser={null}
              onLoginSuccess={handleLoginSuccess}
              onLogout={handleLogout}
            />
          )
        ) : (
          /* When logged in: Render selected authenticated view */
          <>
            {/* VIEW 1: Superadmin Control Panel (Accessible ONLY when role === 'admin') */}
            {effectiveView === 'admin' && currentUser.role === 'admin' && (
              <AdminDashboard
                orders={orders}
                onRefreshOrders={refreshAll}
              />
            )}

            {/* VIEW 2: Merchant Dashboard */}
            {effectiveView === 'dashboard' && (
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

            {/* VIEW 3: Payment Links Manager */}
            {effectiveView === 'payment_links' && (
              <PaymentLinksManager
                orders={orders}
                bankAccounts={bankAccounts}
                routingStrategy={profile.routingStrategy || 'smart_round_robin'}
                primaryVpa={profile.vpa}
                onCreateLink={handleCreateOrder}
                onOpenCheckout={handleOpenCheckout}
                onCancelOrder={handleCancelOrder}
              />
            )}

            {/* VIEW 4: Hosted Checkout */}
            {effectiveView === 'checkout' && selectedOrder && (
              <HostedCheckout
                order={selectedOrder}
                bankAccounts={bankAccounts}
                onPaymentSuccess={handlePaymentSuccess}
                onBackToDashboard={() => setActiveView(currentUser.role === 'admin' ? 'admin' : 'dashboard')}
              />
            )}

            {/* VIEW 5: Login & Account Portal */}
            {effectiveView === 'auth' && (
              <AuthPortal
                currentUser={currentUser}
                onLoginSuccess={handleLoginSuccess}
                onLogout={handleLogout}
              />
            )}

            {/* VIEW 6: Developer API Docs */}
            {effectiveView === 'docs' && (
              <DeveloperApiDocs profile={profile} />
            )}
          </>
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">9tepay Merchant Gateway</span>
            <span>&bull;</span>
            <span className="font-medium text-blue-700">Zero-Gateway-Fee UPI Processing Engine</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-3 font-sans">
            {currentUser ? (
              <>
                <span>Account: <strong className="text-slate-800">{currentUser.businessName}</strong></span>
                <span>Role: <strong className="text-blue-700 uppercase font-bold">{currentUser.role}</strong></span>
              </>
            ) : (
              <span>Session: <strong className="text-slate-600">Signed Out</strong></span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
