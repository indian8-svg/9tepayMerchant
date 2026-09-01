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
  const cleanTr = encodeURIComponent(orderNumber.trim());

  // Clean standard NPCI P2P/P2M compatible string without forcing restricted merchant codes
  return `upi://pay?pa=${cleanVpa}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}&tr=${cleanTr}`;
}

export interface AppDeeplinks {
  generic: string;
  gpay: string;
  phonepe: string;
  paytm: string;
  bhim: string;
  cred: string;
}

/**
 * Generates app-specific intent deeplinks for one-click mobile app switching
 */
export function generateAppDeeplinks(config: UpilinkConfig): AppDeeplinks {
  const baseUpi = generateUpiString(config);
  const params = baseUpi.replace('upi://pay?', '');

  return {
    generic: `upi://pay?${params}`,
    gpay: `tez://upi/pay?${params}`,
    phonepe: `phonepe://pay?${params}`,
    paytm: `paytmmp://pay?${params}`,
    bhim: `bhim://pay?${params}`,
    cred: `credpay://upi/pay?${params}`,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}
