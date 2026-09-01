import { UpilinkConfig } from '../types';

/**
 * Builds the standard NPCI UPI Payment URI string
 * Spec: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE&tr=REF
 */
export function generateUpiString(config: UpilinkConfig): string {
  const { merchantVpa, merchantName, amount, orderNumber, note } = config;
  const cleanVpa = merchantVpa.trim();
  const cleanName = encodeURIComponent(merchantName.trim());
  const cleanAmount = Number(amount).toFixed(2);
  const cleanNote = encodeURIComponent(note?.trim() || `${orderNumber}`);

  // Clean NPCI URI without forcing restricted merchant transaction parameters (tr/mc)
  // This allows Paytm, PhonePe, Google Pay & BHIM to process payments for both personal and merchant VPAs without "unverified merchant" errors.
  return `upi://pay?pa=${cleanVpa}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
}

export interface AppDeeplinks {
  generic: string;
  gpay: string;
  phonepe: string;
  paytm: string;
  bhim: string;
  cred: string;
  gpayIntent: string;
  phonepeIntent: string;
  paytmIntent: string;
  bhimIntent: string;
  credIntent: string;
}

/**
 * Generates app-specific intent deeplinks for 1-click mobile app launching
 */
export function generateAppDeeplinks(config: UpilinkConfig): AppDeeplinks {
  const baseUpi = generateUpiString(config);
  const params = baseUpi.replace('upi://pay?', '');

  const universal = `upi://pay?${params}`;

  return {
    generic: universal,
    // Native app scheme fallbacks & universal links
    gpay: universal,
    phonepe: universal,
    paytm: universal,
    bhim: universal,
    cred: universal,
    // Android Package Intent format (launches specific app directly in Android Chrome)
    gpayIntent: `intent://pay?${params}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`,
    phonepeIntent: `intent://pay?${params}#Intent;scheme=upi;package=com.phonepe.app;end;`,
    paytmIntent: `intent://pay?${params}#Intent;scheme=upi;package=net.one97.paytm;end;`,
    bhimIntent: `intent://pay?${params}#Intent;scheme=upi;package=in.org.npci.upiapp;end;`,
    credIntent: `intent://pay?${params}#Intent;scheme=upi;package=com.dreamplug.androidapp;end;`,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}
