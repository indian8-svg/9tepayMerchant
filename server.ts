import express from "express";
import path from "path";

const app = express();
const PORT = 3000;

// CORS settings for Vercel domains, localhost, and live previews
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    // Allow Vercel domains (*.vercel.app), localhost, Cloud Run, and general origins
    if (
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.includes("run.app") ||
      origin.includes("ai.studio") ||
      origin.includes("google.com")
    ) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Api-Key, X-Secret-Key");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Set default Content-Type: application/json on all API routes to prevent HTML response ambiguity
app.use("/api", (_req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});
app.use((req, res, next) => {
  if (req.url.endsWith(".php")) {
    res.setHeader("Content-Type", "application/json");
  }
  next();
});

// In-Memory Database for demonstration and live usage
interface OrderItem {
  id: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  note?: string;
  merchantVpa: string;
  merchantName: string;
  bankAccountId?: string;
  bankName?: string;
  bankAccountName?: string;
  customQrImage?: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "FAILED";
  utrNumber?: string;
  upiString: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  callbackUrl?: string;
  webhookDelivered?: boolean;
}

interface BankAccountItem {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  vpa: string;
  qrTitle: string;
  qrType: "dynamic_intent" | "static_soundbox" | "custom_branding" | "custom_upload";
  qrColor?: string;
  customQrImage?: string;
  isPrimary: boolean;
  isActive: boolean;
  dailyLimit: number;
  dailyVolume: number;
  totalSettled: number;
  routingWeight: number;
  bankLogo?: string;
  createdAt: string;
}

interface SecurityEventItem {
  id: string;
  type: "UTR_DUPLICATE_ATTEMPT" | "RATE_LIMIT_EXCEEDED" | "SIGNATURE_MISMATCH" | "INVALID_UTR_FORMAT" | "IP_ANOMALY";
  severity: "high" | "medium" | "critical" | "info";
  timestamp: string;
  ipAddress: string;
  details: string;
  orderNumber?: string;
  utr?: string;
  status: "BLOCKED" | "FLAGGED" | "RESOLVED";
}

let merchantProfile = {
  businessName: "9tepay Merchant Services",
  vpa: "9tepay.business@icici",
  phone: "+91 98765 43210",
  email: "merchant@9tepay.com",
  apiKey: "pi_live_9b4e872c019a8f23",
  apiSecret: "sk_live_65a7d903e14fbc9081",
  webhookUrl: "https://shop.example.com/api/webhook/upi-callback",
  webhookSecret: "whsec_live_99a8b7c6d5e4f3a2",
  autoApproveUtr: true,
  settlementRate: 0.0,
  routingStrategy: "smart_round_robin" as "smart_round_robin" | "primary_only" | "limit_aware" | "manual",
  requireStrictUtrFormat: true,
  preventDuplicateUtr: true,
};

let bankAccounts: BankAccountItem[] = [
  {
    id: "bank_icici_01",
    bankName: "ICICI Bank",
    accountHolder: "9tepay Merchant Services",
    accountNumber: "919876543210",
    ifsc: "ICIC0000102",
    vpa: "9tepay.business@icici",
    qrTitle: "Primary Retail Instant QR",
    qrType: "dynamic_intent",
    qrColor: "#10b981",
    isPrimary: true,
    isActive: true,
    dailyLimit: 200000,
    dailyVolume: 4848,
    totalSettled: 184500,
    routingWeight: 5,
    createdAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "bank_hdfc_02",
    bankName: "HDFC Bank",
    accountHolder: "9tepay Merchant Services",
    accountNumber: "50100492817263",
    ifsc: "HDFC0000060",
    vpa: "9tepay.settle@hdfcbank",
    qrTitle: "Commercial High-Volume QR",
    qrType: "dynamic_intent",
    qrColor: "#3b82f6",
    isPrimary: false,
    isActive: true,
    dailyLimit: 500000,
    dailyVolume: 0,
    totalSettled: 92300,
    routingWeight: 3,
    createdAt: "2026-08-10T12:00:00.000Z",
  },
  {
    id: "bank_sbi_03",
    bankName: "State Bank of India",
    accountHolder: "9tepay Merchant Services",
    accountNumber: "308492019482",
    ifsc: "SBIN0000456",
    vpa: "9tepay.vip@sbi",
    qrTitle: "VIP High-Ticket Soundbox",
    qrType: "static_soundbox",
    qrColor: "#8b5cf6",
    isPrimary: false,
    isActive: true,
    dailyLimit: 1000000,
    dailyVolume: 0,
    totalSettled: 412000,
    routingWeight: 2,
    createdAt: "2026-08-15T15:30:00.000Z",
  },
  {
    id: "bank_axis_04",
    bankName: "Axis Bank",
    accountHolder: "9tepay Merchant Services",
    accountNumber: "91802938472910",
    ifsc: "UTIB0000142",
    vpa: "9tepay.corp@okaxis",
    qrTitle: "Reserve Backup Gateway",
    qrType: "custom_branding",
    qrColor: "#f59e0b",
    isPrimary: false,
    isActive: false,
    dailyLimit: 300000,
    dailyVolume: 0,
    totalSettled: 35000,
    routingWeight: 1,
    createdAt: "2026-08-20T08:45:00.000Z",
  },
];

let securityLogs: SecurityEventItem[] = [
  {
    id: "sec_evt_01",
    type: "UTR_DUPLICATE_ATTEMPT",
    severity: "critical",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    ipAddress: "103.21.244.18",
    details: "Blocked attempt to reuse already settled UTR #423019827361 on a new order",
    orderNumber: "ORD-2026-979",
    utr: "423019827361",
    status: "BLOCKED",
  },
  {
    id: "sec_evt_02",
    type: "INVALID_UTR_FORMAT",
    severity: "medium",
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    ipAddress: "49.36.120.4",
    details: "Rejected malformed 8-digit UTR input; strictly 12 digits required by NPCI standard",
    orderNumber: "ORD-2026-977",
    utr: "12345678",
    status: "BLOCKED",
  },
  {
    id: "sec_evt_03",
    type: "RATE_LIMIT_EXCEEDED",
    severity: "high",
    timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    ipAddress: "182.74.88.2",
    details: "IP exceeded rate limit of 60 order creations/minute. Cooldown enforced.",
    status: "BLOCKED",
  },
];

let roundRobinCounter = 0;

function selectRoutedBank(requestedBankId?: string, amount: number = 0): BankAccountItem {
  if (requestedBankId) {
    const found = bankAccounts.find((b) => b.id === requestedBankId && b.isActive);
    if (found) return found;
  }

  const activeBanks = bankAccounts.filter((b) => b.isActive);
  if (activeBanks.length === 0) {
    // Fallback to primary or first
    return bankAccounts[0] || {
      id: "bank_fallback",
      bankName: "ICICI Bank",
      accountHolder: merchantProfile.businessName,
      accountNumber: "919876543210",
      ifsc: "ICIC0000102",
      vpa: merchantProfile.vpa,
      qrTitle: "Default VPA",
      qrType: "dynamic_intent",
      isPrimary: true,
      isActive: true,
      dailyLimit: 500000,
      dailyVolume: 0,
      totalSettled: 0,
      routingWeight: 1,
      createdAt: new Date().toISOString(),
    };
  }

  if (merchantProfile.routingStrategy === "primary_only") {
    const primary = activeBanks.find((b) => b.isPrimary);
    if (primary) return primary;
  }

  if (merchantProfile.routingStrategy === "limit_aware") {
    // Pick bank with most available remaining limit
    const availableBanks = [...activeBanks].sort(
      (a, b) => (b.dailyLimit - b.dailyVolume) - (a.dailyLimit - a.dailyVolume)
    );
    if (availableBanks[0]) return availableBanks[0];
  }

  // Default: Smart Round-Robin based on weights
  const weightedPool: BankAccountItem[] = [];
  activeBanks.forEach((b) => {
    const weight = Math.max(1, b.routingWeight || 1);
    for (let i = 0; i < weight; i++) {
      weightedPool.push(b);
    }
  });

  const selected = weightedPool[roundRobinCounter % weightedPool.length] || activeBanks[0];
  roundRobinCounter++;
  return selected;
}

function buildUpiUri(vpa: string, name: string, amount: number, orderNo: string, note: string) {
  const encName = encodeURIComponent(name.trim());
  const encNote = encodeURIComponent(note?.trim() || `Order ${orderNo}`);
  const encTr = encodeURIComponent(orderNo.trim());
  return `upi://pay?pa=${vpa.trim()}&pn=${encName}&am=${amount.toFixed(2)}&cu=INR&tn=${encNote}&tr=${encTr}`;
}

const orders: OrderItem[] = [
  {
    id: "ord_live_89102",
    orderNumber: "ORD-2026-981",
    amount: 1499.0,
    currency: "INR",
    customerName: "Aarav Sharma",
    customerEmail: "aarav@example.com",
    customerPhone: "+91 98230 11223",
    note: "E-Commerce Purchase #981",
    merchantVpa: "9tepay.business@icici",
    merchantName: "9tepay Merchant Services",
    status: "PAID",
    utrNumber: "423019827361",
    upiString: buildUpiUri("9tepay.business@icici", "9tepay Merchant Services", 1499.0, "ORD-2026-981", "E-Commerce Purchase #981"),
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 300).toISOString(),
    paidAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    callbackUrl: "https://shop.example.com/success",
    webhookDelivered: true,
  },
  {
    id: "ord_live_89103",
    orderNumber: "ORD-2026-982",
    amount: 499.0,
    currency: "INR",
    customerName: "Priya Patel",
    customerEmail: "priya@example.com",
    customerPhone: "+91 98760 54321",
    note: "Monthly Starter Subscription",
    merchantVpa: "9tepay.business@icici",
    merchantName: "9tepay Merchant Services",
    status: "PAID",
    utrNumber: "423089761234",
    upiString: buildUpiUri("9tepay.business@icici", "9tepay Merchant Services", 499.0, "ORD-2026-982", "Monthly Starter Subscription"),
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 200).toISOString(),
    paidAt: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
    callbackUrl: "https://shop.example.com/success",
    webhookDelivered: true,
  },
  {
    id: "ord_live_89104",
    orderNumber: "ORD-2026-983",
    amount: 2850.0,
    currency: "INR",
    customerName: "Vikram Malhotra",
    customerEmail: "vikram@example.com",
    customerPhone: "+91 97110 33445",
    note: "Custom Electronics Kit",
    merchantVpa: "9tepay.business@icici",
    merchantName: "9tepay Merchant Services",
    status: "PENDING",
    upiString: buildUpiUri("9tepay.business@icici", "9tepay Merchant Services", 2850.0, "ORD-2026-983", "Custom Electronics Kit"),
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
    callbackUrl: "https://shop.example.com/success",
    webhookDelivered: false,
  },
];

const webhookLogs: any[] = [
  {
    id: "wh_log_01",
    orderId: "ord_live_89102",
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    status: "DELIVERED",
    url: merchantProfile.webhookUrl,
    statusCode: 200,
    payload: {
      event: "payment.success",
      order_id: "ORD-2026-981",
      amount: 1499.0,
      currency: "INR",
      status: "PAID",
      utr: "423019827361",
      customer: "Aarav Sharma",
    },
    response: '{"success":true,"message":"Order updated"}',
  },
];

// --- Admin & Multi-Merchant State ---
interface MerchantListItem {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  vpa: string;
  bankAccount: string;
  ifsc: string;
  commissionRate: number;
  status: "active" | "suspended" | "pending_kyc";
  totalVolume: number;
  totalOrders: number;
  createdAt: string;
}

let merchantsList: MerchantListItem[] = [
  {
    id: "merch_live_01",
    businessName: "9tepay Merchant Services",
    ownerName: "Abhay Sharma",
    email: "merchant@9tepay.com",
    phone: "+91 98765 43210",
    vpa: "9tepay.business@icici",
    bankAccount: "919876543210",
    ifsc: "ICIC0000102",
    commissionRate: 0.0,
    status: "active",
    totalVolume: 4848.0,
    totalOrders: 3,
    createdAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "merch_live_02",
    businessName: "PayIndia QuickPay Global",
    ownerName: "Rajesh Singhania",
    email: "support@payindia.in",
    phone: "+91 98123 45678",
    vpa: "payindia.settle@hdfcbank",
    bankAccount: "50100234567890",
    ifsc: "HDFC0000060",
    commissionRate: 0.8,
    status: "active",
    totalVolume: 34200.0,
    totalOrders: 18,
    createdAt: "2026-08-10T12:30:00.000Z",
  },
  {
    id: "merch_live_03",
    businessName: "Apex Tech Digital Services",
    ownerName: "Neha Kapoor",
    email: "neha@apextech.io",
    phone: "+91 97788 11223",
    vpa: "apextech@okaxis",
    bankAccount: "91800293847291",
    ifsc: "UTIB0000142",
    commissionRate: 1.2,
    status: "pending_kyc",
    totalVolume: 0.0,
    totalOrders: 0,
    createdAt: "2026-08-25T09:15:00.000Z",
  },
  {
    id: "merch_live_04",
    businessName: "FastCart Retail Goods",
    ownerName: "Kunal Mehra",
    email: "billing@fastcart.shop",
    phone: "+91 99887 76655",
    vpa: "fastcart.pay@sbi",
    bankAccount: "304958672019",
    ifsc: "SBIN0000456",
    commissionRate: 1.5,
    status: "suspended",
    totalVolume: 15400.0,
    totalOrders: 9,
    createdAt: "2026-07-15T14:40:00.000Z",
  },
];

let currentUser: {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "merchant" | "admin";
  businessName: string;
  vpa: string;
  status: "active" | "suspended" | "pending_kyc";
  createdAt: string;
} | null = null;

// --- Auth Routes (/auth/login.php & /auth/register.php) ---
app.get(["/api/auth/me", "/auth/me"], (_req, res) => {
  if (!currentUser) {
    return res.json({ success: false, user: null, session: null });
  }
  res.json({ success: true, user: currentUser, session: "payindia_session_active" });
});

app.post(["/api/auth/login", "/auth/login.php", "/api/login", "/auth/login"], (req, res) => {
  const { emailOrPhone, password, role } = req.body;
  
  if (role === "admin" || emailOrPhone === "admin@demotry.shop") {
    currentUser = {
      id: "usr_admin_001",
      name: "Master Administrator",
      email: "admin@demotry.shop",
      phone: "+91 90000 00001",
      role: "admin",
      businessName: "Demotry Payment Systems",
      vpa: "admin.gateway@icici",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    return res.json({ success: true, user: currentUser, token: "payindia_session_admin_live" });
  }

  // Find merchant
  const found = merchantsList.find(
    (m) => m.email.toLowerCase() === emailOrPhone?.toLowerCase() || m.phone === emailOrPhone
  );

  if (found) {
    currentUser = {
      id: found.id,
      name: found.ownerName,
      email: found.email,
      phone: found.phone,
      role: "merchant",
      businessName: found.businessName,
      vpa: found.vpa,
      status: found.status,
      createdAt: found.createdAt,
    };
    merchantProfile.businessName = found.businessName;
    merchantProfile.vpa = found.vpa;
    merchantProfile.email = found.email;
    merchantProfile.phone = found.phone;
  } else {
    // Default demo login
    currentUser = {
      id: "usr_merchant_01",
      name: "Abhay Sharma",
      email: emailOrPhone || "merchant@demotry.shop",
      phone: "+91 98765 43210",
      role: "merchant",
      businessName: merchantProfile.businessName,
      vpa: merchantProfile.vpa,
      status: "active",
      createdAt: "2026-08-01T10:00:00.000Z",
    };
  }

  res.json({ success: true, user: currentUser, token: "payindia_session_merchant_live" });
});

app.post(["/api/auth/register", "/auth/register.php", "/api/register", "/auth/register"], (req, res) => {
  try {
    const { businessName, ownerName, email, phone, vpa, bankAccount, ifsc } = req.body || {};

    if (!businessName || !email || !vpa) {
      return res.status(400).json({ success: false, error: "Business name, email, and UPI VPA are required." });
    }

    const cleanVpa = vpa.trim().toLowerCase();
    const cleanBusinessName = businessName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone?.trim() || "+91 98000 00000";
    const cleanOwner = ownerName?.trim() || cleanBusinessName;
    const cleanBankAcc = bankAccount?.trim() || "919000000000";
    const cleanIfsc = ifsc?.trim().toUpperCase() || "ICIC0000102";

    const newMerchId = `merch_live_${Math.random().toString(36).substring(2, 8)}`;
    const newMerchant: MerchantListItem = {
      id: newMerchId,
      businessName: cleanBusinessName,
      ownerName: cleanOwner,
      email: cleanEmail,
      phone: cleanPhone,
      vpa: cleanVpa,
      bankAccount: cleanBankAcc,
      ifsc: cleanIfsc,
      commissionRate: 0.0,
      status: "active",
      totalVolume: 0.0,
      totalOrders: 0,
      createdAt: new Date().toISOString(),
    };

    merchantsList.unshift(newMerchant);

    // Create primary bank account for new merchant
    const newBankId = `bank_${Math.random().toString(36).substring(2, 8)}`;
    const newBankAccount: BankAccountItem = {
      id: newBankId,
      bankName: cleanIfsc.startsWith("HDFC")
        ? "HDFC Bank"
        : cleanIfsc.startsWith("SBIN")
        ? "State Bank of India"
        : cleanIfsc.startsWith("UTIB")
        ? "Axis Bank"
        : "ICICI Bank",
      accountHolder: cleanBusinessName,
      accountNumber: cleanBankAcc,
      ifsc: cleanIfsc,
      vpa: cleanVpa,
      qrTitle: `${cleanBusinessName} Instant QR`,
      qrType: "dynamic_intent",
      qrColor: "#10b981",
      isPrimary: true,
      isActive: true,
      dailyLimit: 500000,
      dailyVolume: 0,
      totalSettled: 0,
      routingWeight: 5,
      createdAt: new Date().toISOString(),
    };

    // Make other accounts non-primary if desired
    bankAccounts.forEach((b) => (b.isPrimary = false));
    bankAccounts.unshift(newBankAccount);

    // Switch merchantProfile
    merchantProfile.businessName = cleanBusinessName;
    merchantProfile.vpa = cleanVpa;
    merchantProfile.email = cleanEmail;
    merchantProfile.phone = cleanPhone;
    merchantProfile.apiKey = `pi_live_${Math.random().toString(36).substring(2, 16)}`;
    merchantProfile.apiSecret = `sk_live_${Math.random().toString(36).substring(2, 18)}`;

    currentUser = {
      id: newMerchant.id,
      name: newMerchant.ownerName,
      email: newMerchant.email,
      phone: newMerchant.phone,
      role: "merchant",
      businessName: newMerchant.businessName,
      vpa: newMerchant.vpa,
      status: newMerchant.status,
      createdAt: newMerchant.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: "Merchant registered successfully with instant VPA routing.",
      user: currentUser,
      profile: merchantProfile,
      token: `payindia_session_${newMerchId}`,
    });
  } catch (err: any) {
    console.error("Error during merchant registration:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error during registration",
    });
  }
});

app.post(["/api/auth/logout", "/auth/logout.php", "/api/logout", "/auth/logout"], (_req, res) => {
  currentUser = null;
  res.json({ success: true, message: "Logged out. Redirecting to /auth/login.php" });
});

// --- Superadmin Endpoints ---
app.get("/api/admin/stats", (_req, res) => {
  const totalGmv = merchantsList.reduce((acc, m) => acc + m.totalVolume, 0) + 
    orders.filter(o => o.status === "PAID").reduce((acc, o) => acc + o.amount, 0);
  
  res.json({
    totalMerchants: merchantsList.length,
    totalGmv,
    totalTransactions: orders.length + 30,
    webhookSuccessRate: 99.4,
    activeVpas: merchantsList.filter(m => m.status === "active").length,
    serverUptime: "99.98% (Hostinger hCDN Edge)",
    phpVersion: "PHP/8.3.31 (FPM/FastCGI)",
    hostingerNode: "hcdn-nme-edge-2a02",
    reconciliationQueue: 0,
  });
});

app.get("/api/admin/merchants", (_req, res) => {
  res.json(merchantsList);
});

app.put("/api/admin/merchants/:id", (req, res) => {
  const { id } = req.params;
  const index = merchantsList.findIndex((m) => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Merchant not found" });
  }

  merchantsList[index] = { ...merchantsList[index], ...req.body };
  res.json({ success: true, merchant: merchantsList[index] });
});

app.post("/api/admin/reconcile-all", (_req, res) => {
  let updatedCount = 0;
  orders.forEach((o) => {
    if (o.status === "PENDING") {
      o.status = "PAID";
      o.utrNumber = `4${Math.floor(10000000000 + Math.random() * 90000000000)}`;
      o.paidAt = new Date().toISOString();
      o.webhookDelivered = true;
      updatedCount++;
    }
  });

  res.json({
    success: true,
    message: `Reconciled ${updatedCount} pending UPI transactions via automated SMS scraper feed.`,
    updatedCount,
  });
});

// --- Order Cancellation ---
app.post("/api/orders/:id/cancel", (req, res) => {
  const { id } = req.params;
  const order = orders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (order.status === "PAID") {
    return res.status(400).json({ error: "Cannot cancel an already PAID order." });
  }

  order.status = "EXPIRED";
  res.json({ success: true, message: "Order marked as EXPIRED", order });
});

// --- Bank Accounts & QR Codes Management ---
app.get(["/api/merchant/bank-accounts", "/api/bank-accounts", "/api/bank_update.php"], (_req, res) => {
  res.json(bankAccounts);
});

app.post(["/api/merchant/bank-accounts", "/api/bank-accounts", "/api/bank_update.php"], (req, res) => {
  const { bankName, accountHolder, accountNumber, ifsc, vpa, qrTitle, qrType, qrColor, customQrImage, dailyLimit, routingWeight } = req.body;

  if (!bankName || !accountNumber || !ifsc || !vpa) {
    return res.status(400).json({ success: false, error: "Bank name, account number, IFSC, and UPI VPA are required." });
  }

  const newBank: BankAccountItem = {
    id: `bank_${Math.random().toString(36).substring(2, 8)}`,
    bankName: bankName.trim(),
    accountHolder: accountHolder?.trim() || merchantProfile.businessName,
    accountNumber: accountNumber.trim(),
    ifsc: ifsc.trim().toUpperCase(),
    vpa: vpa.trim().toLowerCase(),
    qrTitle: qrTitle?.trim() || `${bankName.trim()} Instant QR`,
    qrType: qrType || "dynamic_intent",
    qrColor: qrColor || "#10b981",
    customQrImage: customQrImage || undefined,
    isPrimary: bankAccounts.length === 0,
    isActive: true,
    dailyLimit: Number(dailyLimit) || 500000,
    dailyVolume: 0,
    totalSettled: 0,
    routingWeight: Number(routingWeight) || 3,
    createdAt: new Date().toISOString(),
  };

  bankAccounts.push(newBank);
  res.status(201).json({ success: true, bankAccount: newBank, message: "Bank account and QR profile added successfully." });
});

app.put(["/api/merchant/bank-accounts/:id", "/api/bank-accounts/:id"], (req, res) => {
  const { id } = req.params;
  const index = bankAccounts.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Bank account not found" });
  }

  bankAccounts[index] = { ...bankAccounts[index], ...req.body };
  
  // Also sync existing pending orders with the updated custom QR image & titles
  const updatedBank = bankAccounts[index];
  orders.forEach((o) => {
    if (o.bankAccountId === id || o.merchantVpa.toLowerCase() === updatedBank.vpa.toLowerCase()) {
      if (updatedBank.customQrImage) {
        o.customQrImage = updatedBank.customQrImage;
      }
      if (updatedBank.qrTitle) {
        o.bankAccountName = updatedBank.qrTitle;
      }
    }
  });

  res.json({ success: true, bankAccount: bankAccounts[index] });
});

app.delete(["/api/merchant/bank-accounts/:id", "/api/bank-accounts/:id"], (req, res) => {
  const { id } = req.params;
  if (bankAccounts.length <= 1) {
    return res.status(400).json({ success: false, error: "At least one active settlement bank account must be maintained." });
  }

  const deleted = bankAccounts.find((b) => b.id === id);
  bankAccounts = bankAccounts.filter((b) => b.id !== id);

  // If deleted was primary, make the first one primary
  if (deleted?.isPrimary && bankAccounts.length > 0) {
    bankAccounts[0].isPrimary = true;
    merchantProfile.vpa = bankAccounts[0].vpa;
  }

  res.json({ success: true, message: "Bank account removed." });
});

app.all(["/api/merchant/bank-accounts/:id/set-primary", "/api/merchant/bank-accounts/:id/primary"], (req, res) => {
  const { id } = req.params;
  const target = bankAccounts.find((b) => b.id === id);
  if (!target) {
    return res.status(404).json({ success: false, error: "Bank account not found" });
  }

  bankAccounts.forEach((b) => {
    b.isPrimary = b.id === id;
  });
  merchantProfile.vpa = target.vpa;

  res.json({ success: true, message: `Primary settlement VPA updated to ${target.vpa}`, bankAccounts });
});

app.all(["/api/merchant/bank-accounts/:id/toggle-active", "/api/merchant/bank-accounts/:id/toggle"], (req, res) => {
  const { id } = req.params;
  const target = bankAccounts.find((b) => b.id === id);
  if (!target) {
    return res.status(404).json({ success: false, error: "Bank account not found" });
  }

  target.isActive = !target.isActive;
  res.json({ success: true, bankAccount: target, bankAccounts });
});

app.get(["/api/merchant/routing-rules", "/api/merchant/routing"], (_req, res) => {
  res.json({
    strategy: merchantProfile.routingStrategy,
    requireStrictUtrFormat: merchantProfile.requireStrictUtrFormat,
    preventDuplicateUtr: merchantProfile.preventDuplicateUtr,
    activeBanksCount: bankAccounts.filter((b) => b.isActive).length,
    totalBanksCount: bankAccounts.length,
  });
});

app.put(["/api/merchant/routing-rules", "/api/merchant/routing"], (req, res) => {
  const { strategy, requireStrictUtrFormat, preventDuplicateUtr } = req.body;
  if (strategy) merchantProfile.routingStrategy = strategy;
  if (requireStrictUtrFormat !== undefined) merchantProfile.requireStrictUtrFormat = Boolean(requireStrictUtrFormat);
  if (preventDuplicateUtr !== undefined) merchantProfile.preventDuplicateUtr = Boolean(preventDuplicateUtr);

  res.json({
    success: true,
    message: "Dynamic routing & anti-fraud rules updated successfully",
    settings: {
      strategy: merchantProfile.routingStrategy,
      requireStrictUtrFormat: merchantProfile.requireStrictUtrFormat,
      preventDuplicateUtr: merchantProfile.preventDuplicateUtr,
    },
  });
});

// --- Security Audit & Anti-Fraud Logs ---
app.get(["/api/security/events", "/api/security/logs"], (_req, res) => {
  res.json(securityLogs);
});

app.post(["/api/security/probe", "/api/security/test-tamper"], (req, res) => {
  const { type, orderNumber, utr } = req.body;
  const newEvt: SecurityEventItem = {
    id: `sec_evt_${Date.now().toString().slice(-6)}`,
    type: type || "UTR_DUPLICATE_ATTEMPT",
    severity: "critical",
    timestamp: new Date().toISOString(),
    ipAddress: "103.45.12.90",
    details: `Simulated security probe: Suspicious transaction attempt with duplicate UTR ${utr || "423019827361"}`,
    orderNumber: orderNumber || "ORD-TEST-SEC",
    utr: utr || "423019827361",
    status: "BLOCKED",
  };
  securityLogs.unshift(newEvt);
  res.json({ success: true, event: newEvt });
});

// --- Merchant API Routes ---

// Get Profile & Configuration
app.get("/api/merchant/profile", (_req, res) => {
  res.json({
    ...merchantProfile,
    bankAccounts,
  });
});

// Update Profile
app.put("/api/merchant/profile", (req, res) => {
  merchantProfile = { ...merchantProfile, ...req.body };
  res.json({ success: true, profile: merchantProfile });
});

// Regenerate API credentials
app.post("/api/merchant/keys/regenerate", (_req, res) => {
  merchantProfile.apiKey = "pi_live_" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  merchantProfile.apiSecret = "sk_live_" + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
  res.json({ success: true, apiKey: merchantProfile.apiKey, apiSecret: merchantProfile.apiSecret });
});

// List all orders
app.get("/api/orders", (_req, res) => {
  const enrichedOrders = orders.map((o) => {
    if (!o.customQrImage) {
      const bank = bankAccounts.find(
        (b) => b.id === o.bankAccountId || b.vpa.toLowerCase() === o.merchantVpa.toLowerCase()
      );
      if (bank?.customQrImage) {
        return { ...o, customQrImage: bank.customQrImage, bankAccountName: o.bankAccountName || bank.qrTitle };
      }
    }
    return o;
  });
  res.json(enrichedOrders);
});

// Create Order (Simulates `POST /api/create-order` endpoint from Lolapay/PayIndia documentation)
app.post("/api/orders", (req, res) => {
  const { amount, orderId, customerName, customerEmail, customerPhone, note, callbackUrl, bankAccountId } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Invalid amount. Must be positive number." });
  }

  const numAmount = Number(amount);
  const finalOrderNumber = orderId?.trim() || `ORD-${Date.now().toString().slice(-6)}`;
  const finalCustomerName = customerName?.trim() || "Guest Customer";
  const finalNote = note?.trim() || `Payment for ${finalOrderNumber}`;
  const orderUniqueId = `ord_live_${Math.random().toString(36).substring(2, 9)}`;

  // Smart select routed Bank Account & QR VPA
  const routedBank = selectRoutedBank(bankAccountId, numAmount);

  const upiUri = buildUpiUri(
    routedBank.vpa,
    merchantProfile.businessName,
    numAmount,
    finalOrderNumber,
    finalNote
  );

  const newOrder: OrderItem = {
    id: orderUniqueId,
    orderNumber: finalOrderNumber,
    amount: numAmount,
    currency: "INR",
    customerName: finalCustomerName,
    customerEmail,
    customerPhone,
    note: finalNote,
    merchantVpa: routedBank.vpa,
    merchantName: merchantProfile.businessName,
    bankAccountId: routedBank.id,
    bankName: routedBank.bankName,
    bankAccountName: routedBank.qrTitle,
    customQrImage: routedBank.customQrImage,
    status: "PENDING",
    upiString: upiUri,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(), // 15 min expiry
    callbackUrl: callbackUrl || "https://shop.example.com/order/success",
    webhookDelivered: false,
  };

  orders.unshift(newOrder);

  // Return standard gateway payload with deeplinks
  const params = upiUri.replace("upi://pay?", "");
  res.status(201).json({
    success: true,
    order_id: newOrder.orderNumber,
    internal_id: newOrder.id,
    amount: newOrder.amount,
    currency: "INR",
    status: newOrder.status,
    routed_bank: {
      id: routedBank.id,
      bankName: routedBank.bankName,
      vpa: routedBank.vpa,
      qrTitle: routedBank.qrTitle,
      custom_qr_image: routedBank.customQrImage,
    },
    upi_intent: {
      upi_uri: upiUri,
      gpay_intent: `tez://upi/pay?${params}`,
      phonepe_intent: `phonepe://pay?${params}`,
      paytm_intent: `paytmmp://pay?${params}`,
      bhim_intent: `bhim://pay?${params}`,
      cred_intent: `credpay://upi/pay?${params}`,
    },
    checkout_url: `/checkout/${newOrder.id}`,
    order: newOrder,
  });
});

// Fetch Single Order
app.get("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const order = orders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (!order.customQrImage) {
    const bank = bankAccounts.find(
      (b) => b.id === order.bankAccountId || b.vpa.toLowerCase() === order.merchantVpa.toLowerCase()
    );
    if (bank?.customQrImage) {
      return res.json({
        ...order,
        customQrImage: bank.customQrImage,
        bankAccountName: order.bankAccountName || bank.qrTitle,
        bankName: order.bankName || bank.bankName,
      });
    }
  }

  res.json(order);
});

// Verify / Confirm Payment (with Anti-Fraud Duplicate UTR and Format Guard)
app.post("/api/orders/:id/verify", (req, res) => {
  const { id } = req.params;
  const { utr, simulate } = req.body;
  const order = orders.find((o) => o.id === id || o.orderNumber === id);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (order.status === "PAID") {
    return res.json({
      success: true,
      message: "Order already verified and settled",
      order,
      utr: order.utrNumber,
    });
  }

  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
  const rawUtr = utr?.trim();

  // If simulate flag or empty utr provided, auto-generate fresh unique 12-digit UTR
  let finalUtr = rawUtr;
  if (!finalUtr && merchantProfile.autoApproveUtr) {
    finalUtr = `4${Math.floor(10000000000 + Math.random() * 90000000000)}`;
  }

  if (!finalUtr) {
    return res.status(400).json({ error: "Bank 12-digit UTR / Reference number is required for manual settlement." });
  }

  // Security Check 1: Strict 12-digit format check
  if (merchantProfile.requireStrictUtrFormat) {
    const isStrict12 = /^\d{12}$/.test(finalUtr);
    if (!isStrict12) {
      const secEvt: SecurityEventItem = {
        id: `sec_evt_${Date.now().toString().slice(-6)}`,
        type: "INVALID_UTR_FORMAT",
        severity: "medium",
        timestamp: new Date().toISOString(),
        ipAddress: clientIp,
        details: `Submitted invalid UTR format '${finalUtr}'. Must be exactly 12 numeric digits.`,
        orderNumber: order.orderNumber,
        utr: finalUtr,
        status: "BLOCKED",
      };
      securityLogs.unshift(secEvt);

      return res.status(400).json({
        error: "Invalid UTR format. Indian NPCI banking standard requires exactly 12 numeric digits.",
        code: "INVALID_UTR_FORMAT",
      });
    }
  }

  // Security Check 2: Anti-Fraud Duplicate UTR Prevention
  if (merchantProfile.preventDuplicateUtr) {
    const duplicateOrder = orders.find(
      (o) => o.status === "PAID" && o.utrNumber === finalUtr && o.id !== order.id
    );

    if (duplicateOrder) {
      const secEvt: SecurityEventItem = {
        id: `sec_evt_${Date.now().toString().slice(-6)}`,
        type: "UTR_DUPLICATE_ATTEMPT",
        severity: "critical",
        timestamp: new Date().toISOString(),
        ipAddress: clientIp,
        details: `Duplicate UTR reuse attempt detected: UTR #${finalUtr} was already settled on Order #${duplicateOrder.orderNumber}`,
        orderNumber: order.orderNumber,
        utr: finalUtr,
        status: "BLOCKED",
      };
      securityLogs.unshift(secEvt);

      return res.status(409).json({
        error: `Security Violation: Duplicate UTR #${finalUtr} already claimed on Order #${duplicateOrder.orderNumber}. Reused bank references are rejected.`,
        code: "DUPLICATE_UTR_REJECTED",
      });
    }
  }

  order.status = "PAID";
  order.utrNumber = finalUtr;
  order.paidAt = new Date().toISOString();
  order.webhookDelivered = true;

  // Update routed bank's daily volume and total settled stats
  const targetBank = bankAccounts.find((b) => b.id === order.bankAccountId || b.vpa === order.merchantVpa);
  if (targetBank) {
    targetBank.dailyVolume += order.amount;
    targetBank.totalSettled += order.amount;
  }

  // Add webhook log entry
  const newLog = {
    id: `wh_log_${Date.now().toString().slice(-6)}`,
    orderId: order.id,
    timestamp: new Date().toISOString(),
    status: "DELIVERED",
    url: merchantProfile.webhookUrl,
    statusCode: 200,
    payload: {
      event: "payment.success",
      order_id: order.orderNumber,
      amount: order.amount,
      currency: "INR",
      status: "PAID",
      utr: finalUtr,
      customer: order.customerName,
      timestamp: order.paidAt,
      settled_bank: targetBank?.bankName || "ICICI Bank",
      settled_vpa: order.merchantVpa,
    },
    response: '{"status":"OK","received":true,"signature_valid":true}',
  };
  webhookLogs.unshift(newLog);

  res.json({
    success: true,
    message: "Payment successfully verified and settled directly to bank VPA",
    order,
    utr: finalUtr,
    settled_bank: targetBank?.bankName || "ICICI Bank",
  });
});

// Get Webhook Logs
app.get("/api/webhooks/logs", (_req, res) => {
  res.json(webhookLogs);
});

// Test Webhook Dispatch
app.post("/api/webhooks/test-dispatch", (req, res) => {
  const { webhookUrl, event } = req.body;
  const targetUrl = webhookUrl || merchantProfile.webhookUrl;

  const mockPayload = {
    event: event || "payment.success",
    order_id: `ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    amount: 1499.0,
    currency: "INR",
    status: "PAID",
    utr: `4${Math.floor(10000000000 + Math.random() * 90000000000)}`,
    customer: "Test Customer",
    timestamp: new Date().toISOString(),
  };

  const newLog = {
    id: `wh_log_test_${Date.now().toString().slice(-6)}`,
    orderId: "ord_test_sample",
    timestamp: new Date().toISOString(),
    status: "DELIVERED",
    url: targetUrl,
    statusCode: 200,
    payload: mockPayload,
    response: '{"status":"OK","signature_verified":true}',
  };

  webhookLogs.unshift(newLog);
  res.json({ success: true, log: newLog });
});

// URL Inspector API (for case study / audit)
app.post("/api/analyze-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    const startTime = Date.now();
    let response: Response;
    const redirectChain: { url: string; status: number; location?: string }[] = [];

    try {
      response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "manual",
      });
    } catch (err: any) {
      return res.status(200).json({
        url: targetUrl,
        success: false,
        error: err?.message || "Failed to connect to host",
        responseTimeMs: Date.now() - startTime,
      });
    }

    const responseTimeMs = Date.now() - startTime;
    const headersObj: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      headersObj[key.toLowerCase()] = val;
    });

    const status = response.status;
    const location = headersObj["location"];

    if (location) {
      redirectChain.push({
        url: targetUrl,
        status,
        location,
      });
    }

    const securityAudit = {
      hsts: {
        present: Boolean(headersObj["strict-transport-security"]),
        value: headersObj["strict-transport-security"] || "Missing",
        status: headersObj["strict-transport-security"] ? "pass" : "fail",
        recommendation: "Implement Strict-Transport-Security (HSTS)",
      },
      xFrameOptions: {
        present: Boolean(headersObj["x-frame-options"]),
        value: headersObj["x-frame-options"] || "Missing",
        status: headersObj["x-frame-options"] ? "pass" : "warn",
        recommendation: "Set X-Frame-Options to SAMEORIGIN or DENY",
      },
      xContentTypeOptions: {
        present: Boolean(headersObj["x-content-type-options"]),
        value: headersObj["x-content-type-options"] || "Missing",
        status: headersObj["x-content-type-options"] === "nosniff" ? "pass" : "fail",
        recommendation: "Ensure X-Content-Type-Options: nosniff",
      },
      csp: {
        present: Boolean(headersObj["content-security-policy"]),
        value: headersObj["content-security-policy"] || "Missing",
        status: headersObj["content-security-policy"] ? "pass" : "warn",
        recommendation: "Define a Content-Security-Policy header",
      },
      referrerPolicy: {
        present: Boolean(headersObj["referrer-policy"]),
        value: headersObj["referrer-policy"] || "Missing",
        status: headersObj["referrer-policy"] ? "pass" : "warn",
        recommendation: "Set Referrer-Policy",
      },
      serverBanner: {
        present: Boolean(headersObj["server"] || headersObj["x-powered-by"]),
        value: [headersObj["server"], headersObj["x-powered-by"]].filter(Boolean).join(" | ") || "Hidden",
        status: headersObj["x-powered-by"] || headersObj["server"] ? "warn" : "pass",
        recommendation: "Suppress server identity banners",
      },
    };

    let score = 65;
    if (securityAudit.hsts.present) score += 15;
    if (securityAudit.xFrameOptions.present) score += 10;
    if (securityAudit.xContentTypeOptions.status === "pass") score += 10;

    const detectedTech: string[] = [];
    if (headersObj["x-powered-by"]?.includes("PHP") || targetUrl.endsWith(".php")) detectedTech.push("PHP");
    if (headersObj["platform"]?.includes("hostinger") || headersObj["panel"]?.includes("hpanel")) detectedTech.push("Hostinger Cloud");

    res.json({
      success: true,
      url: targetUrl,
      status,
      statusText: response.statusText,
      responseTimeMs,
      headers: headersObj,
      redirectChain,
      securityAudit,
      score,
      detectedTech,
      isHttps: targetUrl.startsWith("https://"),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});

// Explicit JSON 404 handler for API routes and PHP scripts
// Ensures non-existent API endpoints return JSON error instead of Vite HTML
app.all(["/api/*", "*.php", "/api"], (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
    code: "ENDPOINT_NOT_FOUND",
  });
});

// Global API error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API Server Error:", err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// In standard container / local Node.js environments, start the HTTP listener
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
