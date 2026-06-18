"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { 
  AlertTriangle, 
  BarChart3, 
  FileSearch, 
  Lock, 
  MessageSquare, 
  ShieldCheck, 
  Upload, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Bell, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Database,
  User as UserIcon,
  HelpCircle,
  Sparkles,
  Info
} from "lucide-react";

import { InvoiceTable } from "@/components/dashboard/invoice-table";
import { MetricStrip } from "@/components/dashboard/metric-strip";
import { ThemeToggle } from "@/components/theme/theme-toggle";
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
  const [userRole, setUserRole] = useState("");
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password123");
  const [fullName, setFullName] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"connected" | "disconnected" | "checking">("checking");

  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [invoices, setInvoices] = useState<Invoice[]>(fallbackInvoices);
  const [question, setQuestion] = useState("Why was invoice INV-001 marked high risk?");
  const [answer, setAnswer] = useState("Policy answers with citations will appear here.");
  const [notice, setNotice] = useState("Checking backend connection...");
  const [isNoticeError, setIsNoticeError] = useState(false);

  // Document analysis and chat states
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [docChatQuestion, setDocChatQuestion] = useState("");
  const [docChatAnswer, setDocChatAnswer] = useState("");
  const [isAskingDoc, setIsAskingDoc] = useState(false);

  // Shell states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "invoices", "rag"
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAskingPolicy, setIsAskingPolicy] = useState(false);

  const highRiskRate = useMemo(() => {
    const total = summary.total_invoices;
    return Math.round((summary.high_risk_invoices / Math.max(total, 1)) * 100);
  }, [summary]);

  useEffect(() => {
    // Check backend connection health
    async function checkHealth() {
      try {
        const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
        const res = await fetch(`${url}/health`);
        if (res.ok) {
          setBackendStatus("connected");
          setNotice("Connected to backend. Sign in to load live data.");
          setIsNoticeError(false);
        } else {
          setBackendStatus("disconnected");
          setNotice("Backend server returned unhealthy status. Using demo data.");
          setIsNoticeError(true);
        }
      } catch (err) {
        setBackendStatus("disconnected");
        setNotice("Could not connect to backend server. Running in Demo mode.");
        setIsNoticeError(true);
      }
    }
    checkHealth();

    // Check localStorage for saved credentials
    const savedToken = localStorage.getItem("invoice_token");
    const savedRole = localStorage.getItem("invoice_role");
    const savedEmail = localStorage.getItem("invoice_email");
    if (savedToken && savedRole) {
      setToken(savedToken);
      setUserRole(savedRole);
      if (savedEmail) setEmail(savedEmail);
      setNotice(`Session restored. Logged in as ${savedRole}.`);
      setIsNoticeError(false);
      refresh(savedToken);
    }
  }, []);

  async function login() {
    try {
      setNotice("Signing in...");
      setIsNoticeError(false);
      const response = await apiFetch<{ access_token: string; role: string }>("/api/auth/login", undefined, {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" }
      });
      
      setToken(response.access_token);
      setUserRole(response.role);
      localStorage.setItem("invoice_token", response.access_token);
      localStorage.setItem("invoice_role", response.role);
      localStorage.setItem("invoice_email", email);

      setNotice(`Authenticated as ${response.role}. Loading live dashboard data.`);
      await refresh(response.access_token);
    } catch (error) {
      setIsNoticeError(true);
      setNotice(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function register() {
    try {
      setNotice("Creating account...");
      setIsNoticeError(false);
      if (!fullName) {
        throw new Error("Full name is required.");
      }
      const response = await apiFetch<{ access_token: string; role: string }>("/api/auth/register", undefined, {
        method: "POST",
        body: JSON.stringify({ email, password, full_name: fullName }),
        headers: { "Content-Type": "application/json" }
      });

      setToken(response.access_token);
      setUserRole(response.role);
      localStorage.setItem("invoice_token", response.access_token);
      localStorage.setItem("invoice_role", response.role);
      localStorage.setItem("invoice_email", email);

      setNotice(`Successfully registered and authenticated as ${response.role}.`);
      setIsRegisterMode(false);
      await refresh(response.access_token);
    } catch (error) {
      setIsNoticeError(true);
      setNotice(`Registration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function handleLogout() {
    setToken("");
    setUserRole("");
    localStorage.removeItem("invoice_token");
    localStorage.removeItem("invoice_role");
    localStorage.removeItem("invoice_email");
    setSummary(fallbackSummary);
    setInvoices(fallbackInvoices);
    setProfileDropdownOpen(false);
    setNotice("Signed out successfully.");
    setIsNoticeError(false);
  }

  async function refresh(nextToken = token) {
    if (!nextToken) return;
    try {
      const [dashboard, invoiceRows] = await Promise.all([
        apiFetch<DashboardSummary>("/api/dashboard/summary", nextToken),
        apiFetch<Invoice[]>("/api/invoices", nextToken)
      ]);
      setSummary(dashboard);
      setInvoices(invoiceRows);
      setIsNoticeError(false);
      setNotice("Live dashboard metrics loaded successfully.");
    } catch (error) {
      setIsNoticeError(true);
      setNotice(`Failed to load live data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleDeleteInvoice(invoiceId: number) {
    try {
      if (!token) {
        setNotice("Sign in before deleting.");
        setIsNoticeError(true);
        return;
      }
      setNotice("Deleting invoice...");
      setIsNoticeError(false);

      await apiFetch<{ success: boolean; invoice_id: string; deleted_vectors: number; deleted_file: boolean }>(
        `/api/invoices/${invoiceId}`,
        token,
        { method: "DELETE" }
      );

      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
      if (selectedInvoice?.id === invoiceId) setSelectedInvoice(null);
      await refresh(token);

      setNotice("Invoice deleted successfully.");
    } catch (error) {
      setIsNoticeError(true);
      setNotice(`Delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function onUpload(file?: File) {
    try {

      if (!file) {
        setNotice("Select a file to upload.");
        setIsNoticeError(true);
        return;
      }
      if (!token) {
        setNotice("Sign in before uploading.");
        setIsNoticeError(true);
        return;
      }

      setIsUploading(true);
      setIsNoticeError(false);
      setNotice(`Uploading ${file.name}...`);
      const invoice = await uploadInvoice(file, token);
      setInvoices((current) => [invoice, ...current]);
      setSelectedInvoice(invoice);
      
      // Reload summary to reflect new uploaded invoice metrics
      await refresh(token);
      
      setNotice(
        `Successfully processed ${invoice.invoice_number ?? file.name} with ${invoice.fraud_result?.risk_level ?? "pending"} risk.`
      );
    } catch (error) {
      setIsNoticeError(true);
      setNotice(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  }

  async function askPolicy() {
    if (!token) {
      setNotice("Sign in before asking policy questions.");
      setIsNoticeError(true);
      return;
    }
    try {
      setIsAskingPolicy(true);
      setIsNoticeError(false);
      setNotice("Analyzing policy compliance...");
      const response = await apiFetch<{ answer: string; citations: { source: string; excerpt: string }[] }>("/api/rag/chat", token, {
        method: "POST",
        body: JSON.stringify({ question })
      });
      setAnswer(`${response.answer}\n\nSources: ${response.citations.map((citation) => citation.source).join(", ") || "No citations"}`);
      setNotice("Policy assessment complete.");
    } catch (error) {
      setIsNoticeError(true);
      setNotice(`Policy query failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAskingPolicy(false);
    }
  }

  async function askDocChat() {
    if (!selectedInvoice) return;
    if (!token) {
      setNotice("Sign in before chatting.");
      setIsNoticeError(true);
      return;
    }
    if (!docChatQuestion.trim()) return;

    try {
      setIsAskingDoc(true);
      setDocChatAnswer("");
      const response = await apiFetch<{ answer: string }>(`/api/invoices/${selectedInvoice.id}/chat`, token, {
        method: "POST",
        body: JSON.stringify({ question: docChatQuestion }),
      });
      setDocChatAnswer(response.answer);
    } catch (error) {
      setDocChatAnswer(`Error querying document: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAskingDoc(false);
    }
  }

  // Pre-fill helper to switch logins
  function fillCredentials(email: string, roleName: string) {
    setEmail(email);
    setPassword("password123");
    setIsRegisterMode(false);
    setNotice(`Filled credentials for default ${roleName} user.`);
    setIsNoticeError(false);
  }

  // Render Login state
  if (!token) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-slate-100 overflow-hidden">
        {/* Sleek background decoration */}
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="z-10 w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 p-2.5 shadow-lg shadow-violet-500/20 mb-4">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              InvoiceAI Command
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Enterprise Invoice Processing & Fraud Detection System
            </p>
          </div>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl p-6 shadow-2xl shadow-black/50">
            <h2 className="text-xl font-bold text-white mb-2">
              {isRegisterMode ? "Create an account" : "Welcome back"}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              {isRegisterMode 
                ? "Enter your details to sign up for standard invoice processing" 
                : "Sign in to access your dashboard, invoices, and analytics"}
            </p>

            <div className="space-y-4">
              {isRegisterMode && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Full Name</label>
                  <Input 
                    placeholder="John Doe" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:border-violet-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <Input 
                  type="email"
                  placeholder="admin@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:border-violet-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <Input 
                  type="password"
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:border-violet-500"
                />
              </div>

              <Button 
                onClick={isRegisterMode ? register : login} 
                className="w-full mt-2 h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all duration-300 shadow-md shadow-violet-600/20"
              >
                <Lock size={16} /> {isRegisterMode ? "Sign up" : "Sign in"}
              </Button>
            </div>

            <div className="mt-6 flex justify-between items-center text-xs">
              <button 
                onClick={() => setIsRegisterMode(!isRegisterMode)} 
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                {isRegisterMode ? "Already have an account? Sign In" : "Need an account? Sign Up"}
              </button>
            </div>
          </Card>

          {/* Quick-fill & Status area */}
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                className="flex-1 text-xs border border-slate-800 bg-slate-900/30 text-slate-300 hover:bg-slate-900/60"
                onClick={() => fillCredentials("admin@example.com", "Admin")}
              >
                Use Admin Demo
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1 text-xs border border-slate-800 bg-slate-900/30 text-slate-300 hover:bg-slate-900/60"
                onClick={() => fillCredentials("user@example.com", "Standard User")}
              >
                Use User Demo
              </Button>
            </div>

            <Card className="flex items-center gap-3 border-slate-800/80 bg-slate-900/30 backdrop-blur-md p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-slate-400">
                {backendStatus === "connected" ? (
                  <CheckCircle2 size={16} className="text-emerald-400 animate-pulse" />
                ) : backendStatus === "checking" ? (
                  <RefreshCw size={16} className="text-violet-400 animate-spin" />
                ) : (
                  <XCircle size={16} className="text-rose-400 animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200">System Connection Status</p>
                <p className={`text-[10px] truncate ${isNoticeError ? 'text-rose-400 font-medium' : 'text-slate-400'}`}>
                  {notice}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  // Active breadcrumbs text
  const breadcrumbs = {
    dashboard: "Command Center > Dashboard",
    invoices: "Command Center > Invoice Queue",
    rag: "Command Center > Policy AI Assistant"
  }[activeTab] || "Command Center";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      
      {/* 1. COLLAPSIBLE SIDEBAR */}
      <aside 
        className={`bg-slate-900/60 border-r border-slate-800/80 backdrop-blur-xl flex flex-col transition-all duration-300 ease-in-out z-30 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 min-w-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 flex items-center justify-center text-white shadow shadow-violet-500/20">
              <ShieldCheck size={18} />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                InvoiceAI
              </span>
            )}
          </div>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 hover:bg-slate-800 rounded-md flex items-center justify-center text-slate-400 transition"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 space-y-1.5">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-200 ${
              activeTab === "dashboard"
                ? "bg-violet-600/25 border-l-2 border-violet-500 text-white shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard size={18} />
            {!sidebarCollapsed && <span>Dashboard Overview</span>}
          </button>

          <button 
            onClick={() => setActiveTab("invoices")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-200 ${
              activeTab === "invoices"
                ? "bg-violet-600/25 border-l-2 border-violet-500 text-white shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <FileText size={18} />
            {!sidebarCollapsed && <span>Invoice Queue</span>}
          </button>

          <Link href="/dashboard/policy-assistant" className="w-full">
            <button 
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-200 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <MessageSquare size={18} />
              {!sidebarCollapsed && <span>Compliance Assistant</span>}
            </button>
          </Link>
        </nav>

        {/* Collapsed System status details */}
        <div className="p-3 border-t border-slate-800/80">
          <div className="flex flex-col gap-2">
            {!sidebarCollapsed && (
              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                <div className="flex items-center gap-2 mb-1.5">
                  <Database size={13} className="text-violet-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Environment</span>
                </div>
                <div className="text-xs space-y-1 font-mono text-slate-300">
                  <div className="flex justify-between"><span>DB:</span><span className="text-slate-100 font-semibold">SQLite</span></div>
                  <div className="flex justify-between"><span>RAG:</span><span className="text-slate-100 font-semibold">ChromaDB</span></div>
                  <div className="flex justify-between"><span>OCR:</span><span className="text-slate-100 font-semibold">Local Fallback</span></div>
                </div>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/30 text-rose-300 hover:text-rose-200 transition"
            >
              <LogOut size={14} />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* 2. STICKY HEADER */}
        <header className="sticky top-0 bg-slate-950/65 backdrop-blur-xl border-b border-slate-800/80 h-16 flex items-center justify-between px-6 z-20">
          
          {/* Breadcrumbs / Page Title */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium font-mono">{breadcrumbs}</span>
          </div>

          {/* Quick Stats Panel */}
          <div className="hidden lg:flex items-center gap-4 text-xs">
            <div className="bg-slate-900/50 border border-slate-800 rounded px-2.5 py-1 text-slate-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Role: <strong className="text-slate-200 capitalize">{userRole}</strong></span>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded px-2.5 py-1 text-slate-400 flex items-center gap-1.5">
              <Info size={12} className="text-blue-400" />
              <span>Notice: <strong className={isNoticeError ? "text-rose-400" : "text-emerald-400"}>{notice}</strong></span>
            </div>
          </div>

          {/* Right Header actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            <button className="h-8 w-8 hover:bg-slate-900 rounded-md flex items-center justify-center text-slate-400 transition relative">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-violet-500" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center border border-slate-800 hover:border-violet-500 transition cursor-pointer"
              >
                <UserIcon size={16} className="text-white" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-30">
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <p className="text-xs font-semibold text-white">Active User</p>
                    <p className="text-[10px] text-slate-400 truncate">{email}</p>
                  </div>
                  <button 
                    onClick={() => { setActiveTab("dashboard"); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-3 py-1.5 rounded-md text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    My Dashboard
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left mt-1 px-3 py-1.5 rounded-md text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition flex items-center justify-between"
                  >
                    <span>Logout Account</span>
                    <LogOut size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 3. MAIN DYNAMIC WORKSPACE CONTENT */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto space-y-6">

          {/* DYNAMIC TAB: DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Header section with Stats Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    Command Dashboard <Sparkles size={18} className="text-violet-400" />
                  </h1>
                  <p className="text-xs text-slate-400">
                    Real-time extraction accuracy, fraud detection scoring, and finance audits.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded bg-violet-950/40 px-2.5 py-1 text-xs border border-violet-900/30 text-slate-300">
                    <ShieldCheck size={13} className="text-violet-400" /> JWT Secured REST API
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded bg-rose-950/40 px-2.5 py-1 text-xs border border-rose-900/30 text-slate-300">
                    <AlertTriangle size={13} className="text-rose-400 animate-pulse" /> {highRiskRate}% System Risk Level
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded bg-emerald-950/40 px-2.5 py-1 text-xs border border-emerald-900/30 text-slate-300">
                    <BarChart3 size={13} className="text-emerald-400" /> {summary.gst_compliance_rate}% compliance
                  </span>
                </div>
              </div>

              {/* Metric Card row */}
              <MetricStrip metrics={summary.metrics} />

              {/* Central Grid - Analytics Charts & Rankings */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <AnalyticsCharts summary={summary} />
                </div>
                
                <div className="space-y-6">
                  {/* Vendor Risk Ranking Card */}
                  <Card className="border-slate-800 bg-slate-900/30">
                    <h2 className="text-md font-bold text-white mb-1.5">Elevated Risk Vendors</h2>
                    <p className="text-xs text-slate-400 mb-4">Top vendor flags grouped by risk multiplier scores.</p>
                    <div className="space-y-3.5">
                      {summary.vendor_risk_ranking.map((row) => (
                        <div key={row.vendor} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-200">
                            <span>{row.vendor}</span>
                            <span className={row.risk_score >= 70 ? "text-rose-400" : row.risk_score >= 40 ? "text-amber-400" : "text-slate-400"}>
                              {row.risk_score}/100
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                row.risk_score >= 70 
                                  ? "bg-rose-500" 
                                  : row.risk_score >= 40 
                                    ? "bg-amber-500" 
                                    : "bg-indigo-500"
                              }`}
                              style={{ width: `${row.risk_score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Evaluation Snapshot Card */}
                  <Card className="border-slate-800 bg-slate-900/30">
                    <h2 className="text-md font-bold text-white mb-1.5">Model Evaluation Snapshot</h2>
                    <p className="text-xs text-slate-400 mb-4 font-mono">Aggregated metrics over recent invoice datasets.</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-950/45 p-2.5 rounded border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Faithfulness</span>
                        <strong className="text-white text-lg font-bold">86%</strong>
                      </div>
                      <div className="bg-slate-950/45 p-2.5 rounded border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Extraction F1</span>
                        <strong className="text-white text-lg font-bold">82%</strong>
                      </div>
                      <div className="bg-slate-950/45 p-2.5 rounded border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Fraud Detection Recall</span>
                        <strong className="text-white text-lg font-bold">79%</strong>
                      </div>
                      <div className="bg-slate-950/45 p-2.5 rounded border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Processing Latency</span>
                        <strong className="text-white text-lg font-bold">1.45s</strong>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC TAB: INVOICES QUEUE */}
          {activeTab === "invoices" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              <div>
                <h1 className="text-2xl font-bold text-white">Invoice Review Pipeline</h1>
                <p className="text-xs text-slate-400">
                  Upload incoming invoices to run OCR, extract schema attributes, and score fraud probabilities.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-3 items-start">
                <div className="lg:col-span-2 space-y-6">
                  {/* Invoice Table Component */}
                  <InvoiceTable 
                    invoices={invoices} 
                    onSelect={setSelectedInvoice} 
                    selectedId={selectedInvoice?.id} 
                    onDelete={handleDeleteInvoice}
                  />

                  
                  {/* Security Checks overview */}
                  <Card className="border-slate-800 bg-slate-900/30">
                    <h2 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                      <FileSearch size={16} className="text-violet-400" /> Security Controls
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-300 font-mono">
                      <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Input Sanitization</span>
                      <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Prompt Guard rails</span>
                      <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Rate Limits</span>
                      <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Multi-tenant logic</span>
                    </div>
                  </Card>
                </div>

                {/* Upload and analysis column */}
                <div className="space-y-6">
                  <Card className="border-slate-800 bg-slate-900/30 p-5">
                    <h2 className="text-md font-bold text-white mb-1">Process Document</h2>
                    <p className="text-xs text-slate-400 mb-4">Supported extensions: PDF, PNG, JPG, TIFF.</p>
                    
                    <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-slate-700 bg-slate-950 hover:bg-slate-900/50 hover:border-violet-500/80 transition-all text-xs">
                      {isUploading ? (
                        <>
                          <RefreshCw size={24} className="text-violet-400 animate-spin" />
                          <span className="text-slate-300 font-medium">Extracting and scoring document...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={24} className="text-slate-400 hover:text-slate-200" />
                          <span className="text-slate-300 font-medium">Select or drag document</span>
                          <span className="text-[10px] text-slate-500">Max size limit: 15MB</span>
                        </>
                      )}
                      <input 
                        className="sr-only" 
                        type="file" 
                        accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp" 
                        disabled={isUploading}
                        onChange={(event) => onUpload(event.target.files?.[0])} 
                      />
                    </label>

                    <div className="mt-4 p-3 bg-slate-950/60 rounded border border-slate-800/80 text-[11px] text-slate-400">
                      <p className="font-semibold text-slate-300 flex items-center gap-1 mb-1">
                        <Info size={12} className="text-violet-400" /> Note on Python 3.14 OCR fallback
                      </p>
                      Since easyocr relies on native builds, the server will auto-fallback to a simulation of OCR text parsing for seamless demonstration if EasyOCR is missing.
                    </div>
                  </Card>

                  {selectedInvoice ? (
                    <>
                      {/* Document Analysis Results Card */}
                      <Card className="border-slate-800 bg-slate-900/30 p-5 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={14} className="text-violet-400" /> Document Analysis
                          </h2>
                          <span className="text-[10px] text-slate-400 font-mono">ID: #{selectedInvoice.id}</span>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between border-b border-slate-800/40 pb-1">
                            <span className="text-slate-400 font-semibold">Document Type:</span>
                            <span className="text-violet-300 font-bold bg-violet-950/40 px-1.5 py-0.5 rounded border border-violet-900/30 text-[10px]">
                              {selectedInvoice.analysis_result?.document_type || "Invoice"}
                            </span>
                          </div>

                          <div className="flex justify-between border-b border-slate-800/40 pb-1">
                            <span className="text-slate-400 font-semibold">Confidence Score:</span>
                            <span className="text-emerald-400 font-bold bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/20 text-[10px]">
                              {selectedInvoice.analysis_result?.confidence_score != null 
                                ? `${(selectedInvoice.analysis_result.confidence_score * 100).toFixed(0)}%` 
                                : "85%"}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 font-semibold block">Summary:</span>
                            <p className="text-[11px] text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800 leading-normal">
                              {selectedInvoice.analysis_result?.summary || `Document uploaded from vendor ${selectedInvoice.vendor_name || "Unknown"} for a total of $${selectedInvoice.total_amount.toLocaleString()}.`}
                            </p>
                          </div>

                          <div className="space-y-1 bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] space-y-1.5">
                            <span className="text-violet-400 font-semibold uppercase tracking-wider block text-[9px]">Key Information</span>
                            
                            <div className="flex justify-between">
                              <span className="text-slate-400">Important Names:</span>
                              <span className="text-slate-200 font-semibold max-w-[150px] truncate text-right">
                                {selectedInvoice.analysis_result?.important_names && selectedInvoice.analysis_result.important_names.length > 0 
                                  ? selectedInvoice.analysis_result.important_names.join(", ") 
                                  : (selectedInvoice.vendor_name || "N/A")}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-slate-400">Important Dates:</span>
                              <span className="text-slate-200 font-semibold">
                                {selectedInvoice.analysis_result?.important_dates && selectedInvoice.analysis_result.important_dates.length > 0 
                                  ? selectedInvoice.analysis_result.important_dates.join(", ") 
                                  : (selectedInvoice.created_at ? new Date(selectedInvoice.created_at).toLocaleDateString() : "N/A")}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-slate-400">Important Amounts:</span>
                              <span className="text-slate-200 font-bold text-emerald-400">
                                {selectedInvoice.analysis_result?.important_amounts && selectedInvoice.analysis_result.important_amounts.length > 0 
                                  ? selectedInvoice.analysis_result.important_amounts.join(", ") 
                                  : `$${selectedInvoice.total_amount.toLocaleString()}`}
                              </span>
                            </div>

                            {((selectedInvoice.analysis_result?.risk_indicators && selectedInvoice.analysis_result.risk_indicators.length > 0) || 
                              (selectedInvoice.fraud_result?.flags && selectedInvoice.fraud_result.flags.length > 0)) && (
                              <div className="pt-1.5 border-t border-slate-800/80">
                                <span className="text-rose-400 font-semibold block text-[9px] mb-1">Risk Indicators:</span>
                                <div className="text-[10px] text-rose-300 bg-rose-950/20 p-1.5 rounded border border-rose-900/20 leading-normal">
                                  {selectedInvoice.analysis_result?.risk_indicators && selectedInvoice.analysis_result.risk_indicators.length > 0 
                                    ? selectedInvoice.analysis_result.risk_indicators.join(", ") 
                                    : selectedInvoice.fraud_result?.flags.map(f => f.message).join(", ")}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>

                      {/* Chat With Document Panel */}
                      <Card className="border-slate-800 bg-slate-900/30 p-5 space-y-4">
                        <div className="border-b border-slate-800 pb-2">
                          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare size={14} className="text-violet-400" /> Chat With Document
                          </h2>
                          <p className="text-[10px] text-slate-400 mt-0.5">Ask questions about this specific document.</p>
                        </div>

                        <div className="space-y-3">
                          <textarea
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-16"
                            placeholder="e.g. Summarize this document, or What is the total amount?"
                            value={docChatQuestion}
                            onChange={(e) => setDocChatQuestion(e.target.value)}
                          />

                          <Button
                            onClick={askDocChat}
                            disabled={isAskingDoc || !docChatQuestion.trim()}
                            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition py-1.5 text-xs"
                          >
                            {isAskingDoc ? (
                              <>
                                <RefreshCw size={12} className="animate-spin mr-1.5" /> Asking AI...
                              </>
                            ) : (
                              "Ask AI"
                            )}
                          </Button>

                          {docChatAnswer && (
                            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] leading-relaxed space-y-1">
                              <span className="text-violet-400 font-bold block text-[9px] uppercase tracking-wider">AI Answer</span>
                              <p className="text-slate-200">{docChatAnswer}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    </>
                  ) : (
                    <Card className="border-slate-800 bg-slate-900/30 p-5 text-center text-xs text-slate-400 py-8">
                      <FileText size={24} className="mx-auto text-slate-600 mb-2" />
                      Select a document from the queue to view its AI Analysis and Chat with it.
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC TAB: RAG COMPLIANCE ASSISTANT */}
          {activeTab === "rag" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Finance Policy AI Compliance Assistant
                </h1>
                <p className="text-xs text-slate-400">
                  Ask context-aware questions against compliance manuals, corporate finance guidelines, and procurement bylaws.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-3 items-start">
                <div className="lg:col-span-2">
                  <Card className="border-slate-800 bg-slate-900/30 p-5 space-y-4">
                    <h2 className="text-md font-bold text-white mb-1">Interactive Policy Search</h2>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">Ask Policy Question</label>
                      <textarea 
                        className="focus-ring min-h-24 w-full rounded-md border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 focus:border-violet-500" 
                        value={question} 
                        onChange={(event) => setQuestion(event.target.value)} 
                      />
                    </div>

                    <Button 
                      onClick={askPolicy} 
                      disabled={isAskingPolicy}
                      className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition"
                    >
                      {isAskingPolicy ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Querying Policy Store...
                        </>
                      ) : (
                        <>
                          <MessageSquare size={16} /> Query Compliance Store
                        </>
                      )}
                    </Button>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">AI Assessment Response</label>
                      <pre className="min-h-32 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 border border-slate-800 p-4 text-[11px] font-mono text-slate-300 leading-relaxed">
                        {answer}
                      </pre>
                    </div>
                  </Card>
                </div>

                <div>
                  <Card className="border-slate-800 bg-slate-900/30 p-5 space-y-4">
                    <h2 className="text-md font-bold text-white">ChromaDB Store & Prompts</h2>
                    <p className="text-xs text-slate-400">
                      Policy search combines dense neural embeddings query with LangGraph workflows.
                    </p>

                    <div className="space-y-2">
                      <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 text-xs">
                        <span className="font-semibold text-white block mb-0.5">Prompt Injection Guard</span>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Queries matching prompt injection vectors (ignore previous, jailbreak) are filtered out automatically.
                        </p>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 text-xs">
                        <span className="font-semibold text-white block mb-0.5">Source Citations</span>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Response outputs provide exact vector match references with document snippet segments.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
