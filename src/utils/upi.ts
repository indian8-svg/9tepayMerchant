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
  const cleanNote = encodeURIComponent(note?.trim() || `Order ${orderNumber}`);

  // Clean NPCI Standard UPI Link (Without illegal mc=0000 which triggers 'unverified merchant' in Paytm/PhonePe)
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
  const { merchantVpa, merchantName, amount, orderNumber, note } = config;
  const cleanVpa = merchantVpa.trim();
  const cleanName = encodeURIComponent(merchantName.trim());
  const cleanAmount = Number(amount).toFixed(2);
  const cleanNote = encodeURIComponent(note?.trim() || `Order ${orderNumber}`);
  
  // Clean P2P params (compatible with all personal and merchant VPAs without intent blocks)
  const cleanParams = `pa=${cleanVpa}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
  const pureParams = `pa=${cleanVpa}&pn=${cleanName}&am=${cleanAmount}&cu=INR`;

  const universal = `upi://pay?${cleanParams}`;

  return {
    generic: universal,
    cleanP2p: `upi://pay?${pureParams}`,
    // Native app scheme deep links for iOS & Android
    gpay: `tez://upi/pay?${cleanParams}`,
    phonepe: `phonepe://pay?${cleanParams}`,
    paytm: `paytmmp://pay?${cleanParams}`,
    bhim: `in.org.npci.upiapp://pay?${cleanParams}`,
    cred: `cred://pay?${cleanParams}`,
    whatsapp: `whatsapp://pay?${cleanParams}`,
    // Android Package Intent format (launches specific app directly in Android Chrome)
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
