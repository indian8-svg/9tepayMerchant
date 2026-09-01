import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  Smartphone,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Receipt,
  Download,
  Upload,
  Maximize2,
  ZoomIn,
  Building2,
  QrCode,
  Eye,
  X,
} from 'lucide-react';
import { Order, BankAccountQR, User } from '../types';
import { generateAppDeeplinks, formatCurrency } from '../utils/upi';
import { safeFetch } from '../utils/api';

interface HostedCheckoutProps {
  order: Order;
  bankAccounts?: BankAccountQR[];
  onPaymentSuccess: (updatedOrder: Order) => void;
  onBackToDashboard?: () => void;
  currentUser?: User | null;
}

export const HostedCheckout: React.FC<HostedCheckoutProps> = ({
  order: initialOrder,
  bankAccounts = [],
  onPaymentSuccess,
  onBackToDashboard,
  currentUser,
}) => {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedUpiString, setCopiedUpiString] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [verificationError, setVerificationError] = useState('');
  const [showFullscreenQr, setShowFullscreenQr] = useState(false);

  // Match corresponding bank account from bankAccounts fleet
  const matchingBank =
    bankAccounts.find((b) => b.id === order.bankAccountId) ||
    bankAccounts.find((b) => b.vpa.toLowerCase() === order.merchantVpa.toLowerCase()) ||
    bankAccounts.find((b) => b.isPrimary && b.customQrImage) ||
    bankAccounts.find((b) => Boolean(b.customQrImage));

  // Resolved uploaded QR image (prioritizing order.customQrImage, then matchingBank)
  const uploadedQrImage = order.customQrImage || matchingBank?.customQrImage;

  // Active QR Presentation mode
  const [qrViewMode, setQrViewMode] = useState<'uploaded_standee' | 'dynamic_vector'>(
    uploadedQrImage ? 'uploaded_standee' : 'dynamic_vector'
  );

  // Sync state if initialOrder changes
  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    if (uploadedQrImage) {
      setQrViewMode('uploaded_standee');
    }
  }, [uploadedQrImage]);

  // Countdown timer
  useEffect(() => {
    if (order.status === 'PAID') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [order.status]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const deeplinks = generateAppDeeplinks({
    merchantVpa: order.merchantVpa,
    merchantName: order.merchantName,
    amount: order.amount,
    orderNumber: order.orderNumber,
    note: order.note || `Order ${order.orderNumber}`,
  });

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(order.merchantVpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleCopyUpiString = () => {
    navigator.clipboard.writeText(order.upiString);
    setCopiedUpiString(true);
    setTimeout(() => setCopiedUpiString(false), 2000);
  };

  const handleDownloadQr = () => {
    if (uploadedQrImage) {
      const link = document.createElement('a');
      link.href = uploadedQrImage;
      link.download = `QR_${order.orderNumber}_${order.merchantName.replace(/\s+/g, '_')}.png`;
      link.click();
    }
  };

  const handleVerifyUtr = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsVerifying(true);
    setVerificationError('');

    try {
      const res = await safeFetch<{ success: boolean; order?: Order; error?: string }>(
        `/api/orders/${order.id}/verify`,
        {
          method: 'POST',
          body: JSON.stringify({ utr: utrInput.trim() }),
        }
      );
      if (res.ok && res.data?.success && res.data.order) {
        setOrder(res.data.order);
        onPaymentSuccess(res.data.order);
      } else {
        setVerificationError(res.error || res.data?.error || 'Could not verify transaction.');
      }
    } catch (err: any) {
      setVerificationError(err.message || 'Network error verifying transaction.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateInstantPay = async () => {
    const randomUtr = `4230${Math.floor(10000000 + Math.random() * 90000000)}`;
    setUtrInput(randomUtr);
    setIsVerifying(true);
    try {
      const res = await safeFetch<{ success: boolean; order?: Order; error?: string }>(
        `/api/orders/${order.id}/verify`,
        {
          method: 'POST',
          body: JSON.stringify({ utr: randomUtr }),
        }
      );
      if (res.ok && res.data?.success && res.data.order) {
        setOrder(res.data.order);
        onPaymentSuccess(res.data.order);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6">
      {order.status === 'PAID' ? (
        /* Payment Success Receipt View */
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Payment Successful & Verified
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              {formatCurrency(order.amount)}
            </h2>
            <p className="text-xs text-slate-400">
              Paid to <span className="text-slate-200 font-medium">{order.merchantName}</span>
            </p>
          </div>

          {/* Receipt Breakdown Card */}
          <div className="max-w-md mx-auto bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left text-xs space-y-3 font-mono">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-slate-400 font-sans">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" /> Payment Summary
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                SETTLED
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Order Reference:</span>
              <span className="text-slate-200 font-semibold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bank UTR / Ref No:</span>
              <span className="text-emerald-400 font-bold">{order.utrNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer Name:</span>
              <span className="text-slate-200">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Merchant VPA:</span>
              <span className="text-slate-300">{order.merchantVpa}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Paid Timestamp:</span>
              <span className="text-slate-300">
                {order.paidAt ? new Date(order.paidAt).toLocaleTimeString() : 'Just now'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {currentUser && onBackToDashboard ? (
              <button
                onClick={onBackToDashboard}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center gap-1.5"
              >
                <span>Return to Merchant Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="text-xs text-slate-400 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800">
                Transaction Completed. You can safely close this window.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Active Checkout Interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: QR Code & Intent Deeplink Actions */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between space-y-6">
            {/* Header with Merchant & Amount */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" /> NPCI Verified Gateway
                  </span>
                  {(order.bankAccountName || matchingBank?.qrTitle) && (
                    <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40 font-mono flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {order.bankAccountName || matchingBank?.qrTitle}
                    </span>
                  )}
                  {uploadedQrImage && (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40 flex items-center gap-1">
                      <Upload className="w-3 h-3 text-emerald-400" />
                      Standee Attached
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white">{order.merchantName}</h3>
                <p className="text-xs text-slate-400 font-mono">Ref: {order.orderNumber}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {formatCurrency(order.amount)}
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-400 font-mono justify-end mt-0.5">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>Expires in {formatTimer(timeLeft)}</span>
                </div>
              </div>
            </div>

            {/* QR Code Presentation Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center space-y-3 relative">
              {/* Mode Toggle Tabs (if custom uploaded QR exists) */}
              {uploadedQrImage && (
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs w-full max-w-xs justify-center mb-1">
                  <button
                    type="button"
                    onClick={() => setQrViewMode('uploaded_standee')}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                      qrViewMode === 'uploaded_standee'
                        ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Merchant Standee QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrViewMode('dynamic_vector')}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                      qrViewMode === 'dynamic_vector'
                        ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Dynamic Vector QR</span>
                  </button>
                </div>
              )}

              {/* QR Image Display Canvas */}
              <div className="relative group">
                <div className="bg-white p-3.5 rounded-2xl shadow-2xl relative flex items-center justify-center min-w-[220px] min-h-[220px] max-w-[260px] overflow-hidden border-2 border-slate-800">
                  {uploadedQrImage && qrViewMode === 'uploaded_standee' ? (
                    <div className="relative flex items-center justify-center">
                      <img
                        src={uploadedQrImage}
                        alt="Merchant Uploaded QR Standee"
                        className="w-[210px] h-[210px] object-contain rounded-xl cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
                        onClick={() => setShowFullscreenQr(true)}
                      />
                    </div>
                  ) : (
                    <QRCodeSVG
                      value={order.upiString}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  )}
                </div>

                {/* Quick Action Overlay Buttons for Uploaded QR */}
                {uploadedQrImage && qrViewMode === 'uploaded_standee' && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setShowFullscreenQr(true)}
                      className="p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg backdrop-blur-sm border border-slate-700 shadow-md transition-colors cursor-pointer"
                      title="Expand / Fullscreen QR"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg backdrop-blur-sm border border-slate-700 shadow-md transition-colors cursor-pointer"
                      title="Download QR Image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* QR Subtitle & Instructions */}
              <div className="text-center space-y-1.5">
                <p className="text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5">
                  <span>Scan with any UPI App (GPay, PhonePe, Paytm, BHIM, Cred)</span>
                </p>

                {uploadedQrImage && qrViewMode === 'uploaded_standee' ? (
                  <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Merchant Verified Standee Active • Amount: {formatCurrency(order.amount)}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-[11px] text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-500/20 font-medium">
                    <QrCode className="w-3 h-3" />
                    <span>Dynamic Auto-Embedded Amount Intent</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400 pt-0.5">
                  <span>VPA: <strong className="text-slate-200">{order.merchantVpa}</strong></span>
                  <button
                    onClick={handleCopyVpa}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 1-Click Mobile UPI Deeplink Intent Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  Option A: 1-Click Mobile App Intents
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Opens installed UPI app</span>
              </div>

              {/* Primary Universal Intent */}
              <a
                href={deeplinks.generic}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer active:scale-[0.99]"
              >
                <Smartphone className="w-4 h-4" />
                <span>Pay ₹{order.amount.toFixed(2)} with Any UPI App</span>
                <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
              </a>

              {/* App-Specific Intent Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {/* Google Pay */}
                <a
                  href={deeplinks.gpay}
                  className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-200 transition-all cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-[10px]">
                    G
                  </div>
                  <span>Google Pay</span>
                </a>

                {/* PhonePe */}
                <a
                  href={deeplinks.phonepe}
                  className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-200 transition-all cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-[10px]">
                    Pe
                  </div>
                  <span>PhonePe</span>
                </a>

                {/* Paytm */}
                <a
                  href={deeplinks.paytm}
                  className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-200 transition-all cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-[10px]">
                    Py
                  </div>
                  <span>Paytm</span>
                </a>

                {/* BHIM / Cred */}
                <a
                  href={deeplinks.bhim}
                  className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-200 transition-all cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-[10px]">
                    BH
                  </div>
                  <span>BHIM UPI</span>
                </a>
              </div>

              {/* Direct VPA Fallback Card if Paytm / PhonePe blocks intent */}
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 space-y-2 mt-3">
                <div className="flex items-start gap-2 text-amber-300 font-semibold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span>Paytm / PhonePe Intent Error Solution</span>
                    <p className="text-[11px] text-amber-200/80 font-normal mt-0.5 leading-relaxed">
                      If Paytm says <em>"Unverified merchant can't accept intent payments"</em>, copy the VPA below and send money directly via <strong>"Pay to UPI ID"</strong> in your bank app:
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-950/80 border border-amber-500/30 rounded-xl px-3 py-2">
                  <div className="font-mono text-xs text-amber-200 font-bold truncate">
                    {order.merchantVpa}
                  </div>
                  <button
                    onClick={handleCopyVpa}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                  >
                    {copiedVpa ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied VPA</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy VPA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: UTR Confirmation & Fast Simulator */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            {/* Step 2: UTR Reference Submission */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h4 className="text-sm font-bold text-white">
                  Confirm Payment via 12-Digit UTR
                </h4>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                After completing the UPI transfer, enter the 12-digit UPI Transaction Reference (UTR / Ref ID) from your bank app to instantly confirm.
              </p>

              <form onSubmit={handleVerifyUtr} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    12-Digit UTR / Transaction ID
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value.replace(/\s+/g, ''))}
                    placeholder="e.g. 423019827361"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                  />
                </div>

                {verificationError && (
                  <div className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{verificationError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || !utrInput}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs py-2.5 rounded-xl border border-slate-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Submit & Verify UTR</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen QR Modal */}
      {showFullscreenQr && uploadedQrImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setShowFullscreenQr(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="text-left">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Merchant Standee QR Code</span>
                </h4>
                <p className="text-xs text-slate-400">{order.merchantName} • {order.merchantVpa}</p>
              </div>
              <button
                onClick={() => setShowFullscreenQr(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
              <img
                src={uploadedQrImage}
                alt="Enlarged Merchant Standee QR"
                className="max-h-[360px] w-auto object-contain mx-auto rounded-lg"
              />
            </div>

            <div className="text-xs text-slate-300 font-mono">
              Amount to Transfer: <strong className="text-emerald-400 text-sm font-bold">{formatCurrency(order.amount)}</strong>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save / Download QR</span>
              </button>
              <button
                type="button"
                onClick={() => setShowFullscreenQr(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
