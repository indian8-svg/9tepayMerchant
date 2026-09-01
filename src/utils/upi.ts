import { UpilinkConfig } from '../types';

/**
 * Builds the standard NPCI UPI Payment URI string
 * Spec: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
 * Note: We explicitly omit mc, mode, orgid, tr to prevent GPay/Paytm 'unverified merchant' intent blocks
 */
export function generateUpiString(config: UpilinkConfig): string {
  const { merchantVpa, merchantName, amount, orderNumber, note } = config;
  const cleanVpa = (merchantVpa || '').trim();
  // Sanitize merchant name: keep letters, numbers, spaces only to avoid special character rejection
  const safeMerchantName = (merchantName || 'Merchant Services').replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const cleanName = encodeURIComponent(safeMerchantName || 'Merchant');
  const cleanAmount = Number(amount || 0).toFixed(2);
  const safeNote = (note?.trim() || `Order ${orderNumber || 'Pay'}`).replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const cleanNote = encodeURIComponent(safeNote || 'Payment');

  // Clean NPCI Standard UPI Link
  return `upi://pay?pa=${cleanVpa}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
}

export interface AppDeeplinks {
  generic: string;
  cleanP2p: string;
  gpay: string;
  phonepe: string;
  paytm: string;
  bhim: string;
  cred: string;
  whatsapp: string;
  gpayDirect: string;
  phonepeDirect: string;
  paytmDirect: string;
  bhimDirect: string;
  credDirect: string;
  // Package intents for Android Chrome fallback
  gpayIntent: string;
  phonepeIntent: string;
  paytmIntent: string;
  bhimIntent: string;
  credIntent: string;
}

/**
 * Generates app-specific intent deeplinks for 1-click mobile app launching.
 * Fixes the "Unverified merchant can't accept intent payments" bug by prioritizing
 * sanitized direct custom schemes (tez://, phonepe://, paytmmp://, upi://) over rigid package intents.
 */
export function generateAppDeeplinks(config: UpilinkConfig): AppDeeplinks {
  const { merchantVpa, merchantName, amount, orderNumber, note } = config;
  const cleanVpa = (merchantVpa || '').trim();
  const safeMerchantName = (merchantName || 'Merchant').replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const cleanName = encodeURIComponent(safeMerchantName || 'Merchant');
  const cleanAmount = Number(amount || 0).toFixed(2);
  const safeNote = (note?.trim() || `Payment for ${orderNumber || 'Order'}`).replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const cleanNote = encodeURIComponent(safeNote || 'Payment');
  
  // Standard params (no illegal mc/mode flags)
  const cleanParams = `pa=${cleanVpa}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
  
  // Pure P2P params (minimal parameters: strictly pa, pn, am, cu - highest compatibility with personal bank VPAs)
  const pureParams = `pa=${cleanVpa}&pn=${cleanName}&am=${cleanAmount}&cu=INR`;

  const universal = `upi://pay?${cleanParams}`;
  const pureUniversal = `upi://pay?${pureParams}`;

  // Native custom scheme URLs (Avoids Android Chrome strict Merchant Intent firewall that triggers 'unverified merchant' error in Paytm/GPay)
  const gpayUri = `tez://upi/pay?${cleanParams}`;
  const phonepeUri = `phonepe://pay?${cleanParams}`;
  const paytmUri = `paytmmp://pay?${cleanParams}`;
  const bhimUri = `in.org.npci.upiapp://pay?${cleanParams}`;
  const credUri = `cred://pay?${cleanParams}`;
  const whatsappUri = `whatsapp://pay?${cleanParams}`;

  return {
    generic: universal,
    cleanP2p: pureUniversal,
    // Primary Native App Deep Links
    gpay: gpayUri,
    phonepe: phonepeUri,
    paytm: paytmUri,
    bhim: bhimUri,
    cred: credUri,
    whatsapp: whatsappUri,
    // Direct references
    gpayDirect: gpayUri,
    phonepeDirect: phonepeUri,
    paytmDirect: paytmUri,
    bhimDirect: bhimUri,
    credDirect: credUri,
    // Package intent URLs (used only when direct scheme is unavailable)
    gpayIntent: `intent://pay?${cleanParams}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`,
    phonepeIntent: `intent://pay?${cleanParams}#Intent;scheme=upi;package=com.phonepe.app;end;`,
    paytmIntent: `intent://pay?${cleanParams}#Intent;scheme=upi;package=net.one97.paytm;end;`,
    bhimIntent: `intent://pay?${cleanParams}#Intent;scheme=upi;package=in.org.npci.upiapp;end;`,
    credIntent: `intent://pay?${cleanParams}#Intent;scheme=upi;package=com.dreamplug.androidapp;end;`,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

