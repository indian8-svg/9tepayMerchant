import React, { useState } from 'react';
import {
  Code,
  Terminal,
  Play,
  Copy,
  Check,
  RefreshCw,
  Webhook,
} from 'lucide-react';
import { MerchantProfile } from '../types';
import { safeFetch } from '../utils/api';

interface DeveloperApiDocsProps {
  profile: MerchantProfile;
}

export const DeveloperApiDocs: React.FC<DeveloperApiDocsProps> = ({ profile }) => {
  const [lang, setLang] = useState<'curl' | 'nodejs' | 'python' | 'php' | 'go'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);
  const [sandboxAmount, setSandboxAmount] = useState('799.00');
  const [sandboxOrderNo, setSandboxOrderNo] = useState(`ORD-API-${Math.floor(1000 + Math.random() * 9000)}`);
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState<'create_order' | 'get_order' | 'verify_utr' | 'cancel_order'>('create_order');

  const getCodeSnippet = () => {
    const origin = window.location.origin;
    switch (lang) {
      case 'curl':
        if (activeEndpoint === 'create_order') {
          return `curl -X POST ${origin}/api/orders \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${profile.apiKey}" \\
  -d '{
    "amount": 799.00,
    "orderId": "ORD-API-101",
    "customerName": "Rohan Gupta",
    "customerEmail": "rohan@example.com",
    "customerPhone": "+91 98765 43210",
    "note": "Pro Plan Subscription",
    "callbackUrl": "https://your-app.com/payment/callback"
  }'`;
        } else if (activeEndpoint === 'get_order') {
          return `curl -X GET ${origin}/api/orders/ord_live_89102 \\
  -H "X-API-Key: ${profile.apiKey}"`;
        } else if (activeEndpoint === 'verify_utr') {
          return `curl -X POST ${origin}/api/orders/ord_live_89102/verify \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${profile.apiKey}" \\
  -d '{
    "utr": "423019827361"
  }'`;
        } else {
          return `curl -X POST ${origin}/api/orders/ord_live_89102/cancel \\
  -H "X-API-Key: ${profile.apiKey}"`;
        }

      case 'nodejs':
        return `const axios = require('axios');

const response = await axios.post('${origin}/api/orders', {
  amount: ${sandboxAmount},
  orderId: "${sandboxOrderNo}",
  customerName: "Rohan Gupta",
  customerEmail: "rohan@example.com"
}, {
  headers: { 'X-API-Key': '${profile.apiKey}' }
});

console.log('Checkout URL:', response.data.paymentUrl);`;

      case 'python':
        return `import requests

headers = {'X-API-Key': '${profile.apiKey}'}
data = {
    'amount': ${sandboxAmount},
    'orderId': '${sandboxOrderNo}',
    'customerName': 'Rohan Gupta'
}

r = requests.post('${origin}/api/orders', json=data, headers=headers)
print(r.json())`;

      case 'php':
        return `<?php
$ch = curl_init('${origin}/api/orders');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-API-Key: ${profile.apiKey}'
]);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'amount' => ${sandboxAmount},
    'orderId' => '${sandboxOrderNo}'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
echo $res;`;

      case 'go':
        return `package main
import (
    "bytes"
    "net/http"
)
func main() {
    body := []byte(\`{"amount": ${sandboxAmount}, "orderId": "${sandboxOrderNo}"}\`)
    req, _ := http.NewRequest("POST", "${origin}/api/orders", bytes.NewBuffer(body))
    req.Header.Set("X-API-Key", "${profile.apiKey}")
    http.DefaultClient.Do(req)
}`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRunSandbox = async () => {
    setIsLoading(true);
    setSandboxResponse(null);
    try {
      const res = await safeFetch<any>('/api/orders', {
        method: 'POST',
        headers: {
          'X-API-Key': profile.apiKey,
        },
        body: JSON.stringify({
          amount: parseFloat(sandboxAmount) || 100,
          orderId: sandboxOrderNo,
          customerName: 'API Sandbox User',
          customerEmail: 'sandbox@9tepay.com',
          customerPhone: '+91 99999 88888',
          note: 'Interactive API Test Request',
        }),
      });

      if (res.data) {
        setSandboxResponse(JSON.stringify(res.data, null, 2));
      } else {
        setSandboxResponse(JSON.stringify({ error: 'No response payload' }, null, 2));
      }
      setSandboxOrderNo(`ORD-API-${Math.floor(1000 + Math.random() * 9000)}`);
    } catch (err: any) {
      setSandboxResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                API Version 2.4 (NPCI UPI Intent)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Docs &bull; 9tepay Merchant Gateway API
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5 flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-600" />
              <span>Developer REST API &amp; Webhook Integration</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Programmatically create orders, generate mobile deeplink intents for GPay/PhonePe, and handle signed payment callbacks.
            </p>
          </div>
        </div>
      </div>

      {/* Endpoints Selector */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 text-xs overflow-x-auto shadow-2xs">
        <button
          onClick={() => setActiveEndpoint('create_order')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeEndpoint === 'create_order'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          POST /api/orders (Create Payment)
        </button>
        <button
          onClick={() => setActiveEndpoint('get_order')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeEndpoint === 'get_order'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          GET /api/orders/:id (Fetch Status)
        </button>
        <button
          onClick={() => setActiveEndpoint('verify_utr')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeEndpoint === 'verify_utr'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          POST /api/orders/:id/verify (Submit UTR)
        </button>
        <button
          onClick={() => setActiveEndpoint('cancel_order')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeEndpoint === 'cancel_order'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          POST /api/orders/:id/cancel (Cancel)
        </button>
      </div>

      {/* Code Snippets and Live Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Sample Generator */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              {(['curl', 'nodejs', 'python', 'php', 'go'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-md font-mono font-bold uppercase text-[11px] transition-colors cursor-pointer ${
                    lang === l ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800 leading-relaxed max-h-96">
            {getCodeSnippet()}
          </pre>

          {/* Webhook Signature Example */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Webhook className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verifying Webhook HMAC-SHA256 Signatures (Node.js)</span>
            </div>
            <pre className="p-2 bg-white rounded font-mono text-[10px] text-slate-800 border border-slate-200 overflow-x-auto">
{`const crypto = require('crypto');
const expected = crypto.createHmac('sha256', '${profile.webhookSecret}').update(JSON.stringify(payload)).digest('hex');
const isValid = req.headers['x-signature-sha256'] === expected;`}
            </pre>
          </div>
        </div>

        {/* Right Column: Interactive Live Sandbox */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Live API Sandbox Tester
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Endpoint: /api/orders</span>
            </div>

            <div className="space-y-3 pt-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Test Amount (₹ INR)
                </label>
                <input
                  type="number"
                  value={sandboxAmount}
                  onChange={(e) => setSandboxAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Order ID Reference
                </label>
                <input
                  type="text"
                  value={sandboxOrderNo}
                  onChange={(e) => setSandboxOrderNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleRunSandbox}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white text-white" />
                )}
                <span>Execute Live API Request</span>
              </button>
            </div>
          </div>

          {/* Response Inspector */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Server Response:</span>
              {sandboxResponse && <span className="text-emerald-700 font-mono font-bold">201 Created</span>}
            </div>
            <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto min-h-[140px] max-h-[220px]">
              {sandboxResponse || '// Click "Execute Live API Request" to test endpoint'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
