"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, BarChart3, FileSearch, Lock, MessageSquare, Moon, ShieldCheck, Upload } from "lucide-react";
import { InvoiceTable } from "@/components/dashboard/invoice-table";
import { MetricStrip } from "@/components/dashboard/metric-strip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch, DashboardSummary, Invoice, uploadInvoice } from "@/services/api";

const AnalyticsCharts = dynamic(() => import("@/components/dashboard/analytics-charts").then((mod) => mod.AnalyticsCharts), {
  ssr: false,
  loading: () => <div className="h-72 rounded-lg border bg-card" />
});

const fallbackSummary: DashboardSummary = {
  total_invoices: 248,
  fraud_cases: 31,
  high_risk_invoices: 9,
  gst_compliance_rate: 91.5,
  average_processing_seconds: 2.4,
  metrics: [
    { label: "Total invoices", value: 248, delta: "+12 this week" },
    { label: "Fraud cases", value: 31, delta: "8 high priority" },
    { label: "High-risk invoices", value: 9, delta: "Review today" },
    { label: "GST compliance", value: "91.5%", delta: "+3.1%" }
  ],
  monthly_fraud_trends: [
    { month: "2026-01", fraud_cases: 4 },
    { month: "2026-02", fraud_cases: 7 },
    { month: "2026-03", fraud_cases: 5 },
    { month: "2026-04", fraud_cases: 9 },
    { month: "2026-05", fraud_cases: 6 }
  ],
  risk_distribution: [
    { risk_level: "Low", count: 167 },
    { risk_level: "Medium", count: 72 },
    { risk_level: "High", count: 9 }
  ],
  vendor_risk_ranking: [
    { vendor: "Northstar Supplies", risk_score: 88 },
    { vendor: "Kailash Trading", risk_score: 74 },
    { vendor: "Orbit Components", risk_score: 63 },
    { vendor: "Metro Logistics", risk_score: 49 }
  ]
};

const fallbackInvoices: Invoice[] = [
  {
    id: 1,
    invoice_number: "INV-001",
    vendor_name: "Northstar Supplies",
    total_amount: 19250,
    tax_amount: 2936.44,
    status: "reviewed",
    created_at: new Date().toISOString(),
    fraud_result: {
      risk_score: 88,
      risk_level: "High",
      flags: [
        { code: "DUPLICATE_INVOICE", severity: "high", message: "Invoice number was used before." },
        { code: "VENDOR_RISK", severity: "high", message: "Vendor has elevated risk history." }
      ],
      explanation: "Duplicate invoice number and elevated vendor risk require investigation."
    }
  },
  {
    id: 2,
    invoice_number: "INV-204",
    vendor_name: "Metro Logistics",
    total_amount: 4210,
    tax_amount: 642.2,
    status: "extracted",
    created_at: new Date().toISOString(),
    fraud_result: { risk_score: 22, risk_level: "Low", flags: [], explanation: "No material fraud indicators were found." }
  }
];

export default function Home() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password123");
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [invoices, setInvoices] = useState<Invoice[]>(fallbackInvoices);
  const [question, setQuestion] = useState("Why was invoice INV-001 marked high risk?");
  const [answer, setAnswer] = useState("Policy answers with citations will appear here.");
  const [notice, setNotice] = useState("Connect to the backend to replace demo data with live metrics.");

  const highRiskRate = useMemo(() => Math.round((summary.high_risk_invoices / Math.max(summary.total_invoices, 1)) * 100), [summary]);

  async function login() {
    try {
      const response = await apiFetch<{ access_token: string; role: string }>("/api/auth/login", undefined, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(response.access_token);
      setNotice(`Authenticated as ${response.role}. Loading live dashboard data.`);
      await refresh(response.access_token);
    } catch (error) {
      setNotice(`Login failed. ${String(error).slice(0, 110)}`);
    }
  }

  async function refresh(nextToken = token) {
    if (!nextToken) return;
    const [dashboard, invoiceRows] = await Promise.all([
      apiFetch<DashboardSummary>("/api/dashboard/summary", nextToken),
      apiFetch<Invoice[]>("/api/invoices", nextToken)
    ]);
    setSummary(dashboard);
    setInvoices(invoiceRows);
  }

  async function onUpload(file?: File) {
    if (!file || !token) {
      setNotice("Choose a file and sign in before upload.");
      return;
    }
    const invoice = await uploadInvoice(file, token);
    setInvoices((current) => [invoice, ...current]);
    setNotice(`Processed ${invoice.invoice_number ?? file.name} with ${invoice.fraud_result?.risk_level ?? "pending"} risk.`);
  }

  async function askPolicy() {
    if (!token) {
      setNotice("Sign in before asking policy questions.");
      return;
    }
    const response = await apiFetch<{ answer: string; citations: { source: string; excerpt: string }[] }>("/api/rag/chat", token, {
      method: "POST",
      body: JSON.stringify({ question })
    });
    setAnswer(`${response.answer}\n\nSources: ${response.citations.map((citation) => citation.source).join(", ") || "No citations"}`);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">InvoiceAI Fraud Command Center</h1>
            <p className="text-sm text-foreground/65">OCR extraction, fraud scoring, policy RAG, reports, and evaluation in one review workspace.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-56" value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Email" />
            <Input className="w-44" type="password" value={password} onChange={(event) => setPassword(event.target.value)} aria-label="Password" />
            <Button onClick={login}>
              <Lock size={16} /> Sign in
            </Button>
            <Button variant="secondary" aria-label="Toggle dark mode" onClick={() => document.documentElement.classList.toggle("dark")}>
              <Moon size={16} />
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b bg-muted/40">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-sm bg-card px-3 py-2"><ShieldCheck size={16} /> RBAC and JWT secured</span>
            <span className="inline-flex items-center gap-2 rounded-sm bg-card px-3 py-2"><AlertTriangle size={16} /> {highRiskRate}% high-risk rate</span>
            <span className="inline-flex items-center gap-2 rounded-sm bg-card px-3 py-2"><BarChart3 size={16} /> {summary.gst_compliance_rate}% GST compliance</span>
          </div>
          <p className="text-sm text-foreground/70">{notice}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5">
        <MetricStrip metrics={summary.metrics} />

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <aside className="grid gap-4 content-start">
            <Card>
              <h2 className="text-lg font-semibold">Upload Invoice</h2>
              <p className="mt-1 text-sm text-foreground/65">PDF, scanned, and image invoices are validated, extracted, scored, and logged.</p>
              <label className="mt-4 flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-background text-sm">
                <Upload size={22} />
                <span>Choose invoice file</span>
                <input className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp" onChange={(event) => onUpload(event.target.files?.[0])} />
              </label>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Policy Assistant</h2>
              <p className="mt-1 text-sm text-foreground/65">Ask finance-policy and compliance questions with source-backed citations.</p>
              <textarea className="focus-ring mt-4 min-h-28 w-full rounded-md border bg-background p-3 text-sm" value={question} onChange={(event) => setQuestion(event.target.value)} />
              <Button className="mt-3 w-full" onClick={askPolicy}>
                <MessageSquare size={16} /> Ask policy
              </Button>
              <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">{answer}</pre>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Evaluation Snapshot</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <span>Faithfulness</span><strong>86%</strong>
                <span>Precision</span><strong>82%</strong>
                <span>Recall</span><strong>79%</strong>
                <span>Latency</span><strong>1.45s</strong>
              </div>
            </Card>
          </aside>

          <div className="grid gap-4">
            <InvoiceTable invoices={invoices} />
            <AnalyticsCharts summary={summary} />
            <Card>
              <h2 className="flex items-center gap-2 text-lg font-semibold"><FileSearch size={18} /> Security and Audit Controls</h2>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <span>Prompt injection detection</span>
                <span>Input sanitization</span>
                <span>Upload validation</span>
                <span>Rate limiting</span>
                <span>API key protection</span>
                <span>Sensitive data masking</span>
                <span>Audit logging</span>
                <span>Secure env variables</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
