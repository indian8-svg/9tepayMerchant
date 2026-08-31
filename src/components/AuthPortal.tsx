import React, { useState } from 'react';
import {
  Lock,
  UserCheck,
  ShieldAlert,
  Building,
  Mail,
  Phone,
  CreditCard,
  KeyRound,
  ArrowRight,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { User } from '../types';

interface AuthPortalProps {
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'request_otp' | 'verify_otp'>('request_otp');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sandboxHint, setSandboxHint] = useState('');

  // Register fields
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regVpa, setRegVpa] = useState('');
  const [regBankAccount, setRegBankAccount] = useState('');
  const [regIfsc, setRegIfsc] = useState('');

  const handleSendOtp = async (e: React.FormEvent, targetEmail?: string, roleType: 'merchant' | 'admin' = 'merchant') => {
    e.preventDefault();
    const emailToUse = targetEmail || loginEmail;
    if (!emailToUse || !emailToUse.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, role: roleType }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || 'OTP sent successfully to your email.');
        if (data.sandboxOtp) {
          setSandboxHint(data.sandboxOtp);
          setOtpCode(data.sandboxOtp); // Auto-fill for convenience
        }
        setOtpStep('verify_otp');
      } else {
        setErrorMsg(data.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error sending OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, otp: otpCode }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setSuccessMsg(`Welcome, ${data.user.name}! 2FA Authentication verified.`);
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.error || 'Invalid or expired OTP code.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Verification error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regBusinessName || !regEmail || !regVpa) {
      setErrorMsg('Please fill in business name, email, and UPI VPA.');
      return;
    }

    if (!regVpa.includes('@')) {
      setErrorMsg('Invalid UPI VPA format. Must be like name@bank (e.g. store@icici)');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: regBusinessName,
          ownerName: regOwnerName || regBusinessName,
          email: regEmail,
          phone: regPhone,
          vpa: regVpa,
          bankAccount: regBankAccount,
          ifsc: regIfsc,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setSuccessMsg('Account registered successfully! Direct UPI settlement activated.');
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Target Origin Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                Secure 2FA Login Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Email OTP Verification Required
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>Merchant &amp; Administrator Gateway Login</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your registered email address to receive a 6-digit two-factor authentication (2FA) code.
            </p>
          </div>

          {currentUser && (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-right shrink-0">
              <div className="text-xs font-semibold text-white flex items-center justify-end gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{currentUser.name}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Role: <span className="text-emerald-400 uppercase font-bold">{currentUser.role}</span>
              </div>
              <button
                onClick={onLogout}
                className="mt-2 text-xs text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer"
              >
                Sign Out / Switch Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Authentication Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        {/* Mode Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6">
          <button
            onClick={() => { setAuthMode('login'); setOtpStep('request_otp'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'login'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Merchant 2FA Login</span>
          </button>

          <button
            onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'register'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Register Merchant</span>
          </button>

          <button
            onClick={() => {
              setAuthMode('admin');
              setLoginEmail('admin@demotry.shop');
              setOtpStep('request_otp');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'admin'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </button>
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div>{successMsg}</div>
              {sandboxHint && (
                <div className="text-[11px] font-mono bg-emerald-950/80 px-2 py-1 rounded border border-emerald-500/30 text-emerald-300">
                  🔑 Sandbox 2FA OTP Code: <strong className="text-white tracking-widest text-sm">{sandboxHint}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form: Merchant or Admin 2FA Login */}
        {(authMode === 'login' || authMode === 'admin') && (
          <div className="space-y-5">
            {otpStep === 'request_otp' ? (
              <form
                onSubmit={(e) =>
                  handleSendOtp(
                    e,
                    authMode === 'admin' ? 'admin@demotry.shop' : loginEmail,
                    authMode === 'admin' ? 'admin' : 'merchant'
                  )
                }
                className="space-y-4"
              >
                {authMode === 'admin' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                    Master Administrator 2FA login requires verification code sent to <code className="font-bold">admin@demotry.shop</code>.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email Address for 2FA Verification *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={authMode === 'admin' ? 'admin@demotry.shop' : loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      readOnly={authMode === 'admin'}
                      placeholder="e.g. merchant@yourbusiness.com"
                      className="w-full bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full font-bold text-xs sm:text-sm py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                    authMode === 'admin'
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/60'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending 2FA OTP Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit Email OTP Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                  <span>Enter the 6-digit code sent to <strong className="text-white">{loginEmail}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpStep('request_otp')}
                    className="text-[11px] underline text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    6-Digit Email OTP Code *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="123456"
                      className="w-full bg-slate-800 border border-emerald-500 text-white font-mono text-lg tracking-widest text-center rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Verify 2FA Code &amp; Sign In</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Form: Merchant Registration */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  value={regBusinessName}
                  onChange={(e) => setRegBusinessName(e.target.value)}
                  required
                  placeholder="e.g. Apex Digital Store"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Owner / Contact Name
                </label>
                <input
                  type="text"
                  value={regOwnerName}
                  onChange={(e) => setRegOwnerName(e.target.value)}
                  placeholder="e.g. Abhay Sharma"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  placeholder="owner@store.com"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Settlement UPI VPA */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-emerald-500/30 space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-emerald-400 mb-1 flex items-center justify-between">
                  <span>Receiver UPI VPA (Direct Settlement) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">0% Escrow Fee</span>
                </label>
                <input
                  type="text"
                  value={regVpa}
                  onChange={(e) => setRegVpa(e.target.value)}
                  required
                  placeholder="yourname@okaxis or business@icici"
                  className="w-full bg-slate-800 border border-slate-700 text-emerald-300 font-mono text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                All customer payments generated through this gateway will route directly to this UPI address.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Bank Account (Optional)
                </label>
                <input
                  type="text"
                  value={regBankAccount}
                  onChange={(e) => setRegBankAccount(e.target.value)}
                  placeholder="919876543210"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  IFSC Code (Optional)
                </label>
                <input
                  type="text"
                  value={regIfsc}
                  onChange={(e) => setRegIfsc(e.target.value)}
                  placeholder="ICIC0000102"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Create Merchant Account &amp; Get API Keys</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
