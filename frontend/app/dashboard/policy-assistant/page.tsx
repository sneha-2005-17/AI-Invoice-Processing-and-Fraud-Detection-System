"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  MessageSquare, 
  Upload, 
  ArrowLeft, 
  FileText, 
  BookOpen, 
  Lock, 
  LogOut,
  RefreshCw, 
  Tag,
  Gauge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { apiFetch } from "@/services/api";

export default function PolicyAssistantPage() {
  const [token, setToken] = useState("");
  const [userRole, setUserRole] = useState("");
  
  // RAG Query states
  const [question, setQuestion] = useState("What is the reimbursement policy?");
  const [isAsking, setIsAsking] = useState(false);
  const [result, setResult] = useState<{
    answer: string;
    source_document?: string | null;
    section_reference?: string | null;
    confidence_score?: string | null;
    citations?: { source: string; excerpt: string }[];
  } | null>(null);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState("finance_policy");
  const [notice, setNotice] = useState("");
  const [isNoticeError, setIsNoticeError] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("invoice_token");
    const savedRole = localStorage.getItem("invoice_role");
    if (savedToken) {
      setToken(savedToken);
      setUserRole(savedRole || "user");
    }
  }, []);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (!token) {
      setNotice("Sign in before uploading.");
      setIsNoticeError(true);
      return;
    }
    try {
      setIsUploading(true);
      setIsNoticeError(false);
      setNotice(`Uploading ${file.name}...`);
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      await apiFetch<unknown>("/api/rag/documents", token, {
        method: "POST",
        body: formData,
      });

      setNotice(`Successfully uploaded policy document: ${file.name}`);
    } catch (error) {
      setIsNoticeError(true);
      setNotice(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!token) {
      setNotice("Sign in before asking questions.");
      setIsNoticeError(true);
      return;
    }
    try {
      setIsAsking(true);
      setIsNoticeError(false);
      setNotice("Analyzing policy compliance...");
      const response = await apiFetch<{
        answer: string;
        source_document?: string | null;
        section_reference?: string | null;
        confidence_score?: string | null;
        citations?: { source: string; excerpt: string }[];
      }>("/api/rag/chat", token, {
        method: "POST",
        body: JSON.stringify({ question }),
      });
      setResult(response);
      setNotice("Assessment complete.");
    } catch (error) {
      setIsNoticeError(true);
      setNotice(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAsking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("invoice_token");
    localStorage.removeItem("invoice_role");
    localStorage.removeItem("invoice_email");
    setToken("");
    window.location.href = "/";
  };

  if (!token) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-slate-100">
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl p-8 max-w-md text-center space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
            <Lock size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Access Restricted</h2>
            <p className="text-sm text-slate-400 mt-2">
              Please sign in to the main dashboard to access the Policy Search Assistant.
            </p>
          </div>
          <Link href="/">
            <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition">
              Go to Login Page
            </Button>
          </Link>
        </Card>
      </main>
    );
  }

  const isAdmin = userRole.toLowerCase() === "admin";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 backdrop-blur-xl flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 flex items-center justify-center text-white">
              <ShieldCheck size={18} />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              InvoiceAI
            </span>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1.5">
          <Link href="/">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition">
              <ArrowLeft size={18} />
              <span>Back to Dashboard</span>
            </button>
          </Link>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-violet-600/25 border-l-2 border-violet-500 text-white shadow-inner">
            <BookOpen size={18} className="text-violet-400" />
            <span>Policy Assistant</span>
          </button>
        </nav>

        <div className="p-3 border-t border-slate-800/80">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/30 text-rose-300 hover:text-rose-200 transition"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 bg-slate-950/65 backdrop-blur-xl border-b border-slate-800/80 h-16 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium font-mono">Command Center &gt; Policy AI Assistant</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="bg-slate-900/50 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-400">
              Role: <strong className="text-slate-200 capitalize">{userRole}</strong>
            </div>
          </div>
        </header>

        <main className="p-6 flex-1 max-w-5xl w-full mx-auto space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                RAG Compliance Search <BookOpen size={20} className="text-violet-400" />
              </h1>
              <p className="text-xs text-slate-400">
                Search semantic citations, retrieve regulations, and test reimbursement rules instantly.
              </p>
            </div>
            {notice && (
              <span className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs border ${
                isNoticeError ? 'bg-rose-950/40 border-rose-900/30 text-rose-300' : 'bg-violet-950/40 border-violet-900/30 text-violet-300'
              }`}>
                {notice}
              </span>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-3 items-start">
            {/* Left/Middle Column: Document Query and Result */}
            <div className="md:col-span-2 space-y-6">
              <Card className="border-slate-800 bg-slate-900/30 p-5 space-y-4">
                <h2 className="text-md font-bold text-white">Ask Policy Question</h2>
                <div className="space-y-3">
                  <textarea 
                    className="focus-ring min-h-24 w-full rounded-md border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 focus:border-violet-500 focus:outline-none" 
                    value={question} 
                    placeholder="Enter compliance or regulation queries (e.g., What is the reimbursement policy?)"
                    onChange={(e) => setQuestion(e.target.value)} 
                  />
                  <Button 
                    onClick={handleAsk} 
                    disabled={isAsking}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition py-2.5 animate-pulse"
                  >
                    {isAsking ? (
                      <>
                        <RefreshCw size={14} className="animate-spin mr-2" /> Querying Compliance Store...
                      </>
                    ) : (
                      <>
                        <MessageSquare size={16} className="mr-2" /> Query Compliance Store
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* RAG RESULT INTERFACE */}
              {result && (
                <Card className="border-slate-800 bg-slate-900/30 p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">AI Assessment Result</h2>
                    <p className="text-xs text-slate-400">Verbatim compliance details extracted from reference policies.</p>
                  </div>

                  {/* ANSWER CARD */}
                  <div className="bg-slate-950/60 p-5 rounded-lg border border-slate-800/85">
                    <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Answer</h3>
                    <p className="text-sm text-slate-100 leading-relaxed font-sans">{result.answer}</p>
                  </div>

                  {/* STRUCTURED METADATA SECTION */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded border border-slate-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        <FileText size={14} className="text-violet-400" /> Source Document
                      </div>
                      <p className="text-xs font-bold text-slate-200 break-all">{result.source_document || "N/A"}</p>
                    </div>

                    <div className="bg-slate-950/40 p-4 rounded border border-slate-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        <Tag size={14} className="text-violet-400" /> Section Reference
                      </div>
                      <p className="text-xs font-bold text-slate-200">{result.section_reference || "N/A"}</p>
                    </div>

                    <div className="bg-slate-950/40 p-4 rounded border border-slate-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        <Gauge size={14} className="text-violet-400" /> Confidence Score
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          (result.confidence_score || "").toLowerCase().includes("high") || (result.confidence_score || "").includes("9")
                            ? "bg-emerald-950/50 border border-emerald-900/40 text-emerald-400"
                            : (result.confidence_score || "").toLowerCase().includes("medium") || (result.confidence_score || "").includes("7")
                              ? "bg-amber-950/50 border border-amber-900/40 text-amber-400"
                              : "bg-slate-950 border border-slate-800 text-slate-400"
                        }`}>
                          {result.confidence_score || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CITATIONS / SOURCE EXCERPTS */}
                  {result.citations && result.citations.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Source Passages</h3>
                      <div className="space-y-2">
                        {result.citations.map((cit, idx) => (
                          <div key={idx} className="p-3 bg-slate-950/30 rounded border border-slate-800 text-xs text-slate-300 leading-normal">
                            <strong className="text-violet-400 block mb-1">{cit.source}</strong>
                            &quot;{cit.excerpt}&quot;
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Right Column: Upload Manual (Admin Only) */}
            <div className="space-y-6">
              {isAdmin ? (
                <Card className="border-slate-800 bg-slate-900/30 p-5 space-y-4">
                  <h2 className="text-md font-bold text-white flex items-center gap-2">
                    <Upload size={16} className="text-violet-400" /> Upload Policy
                  </h2>
                  <p className="text-xs text-slate-400 leading-normal">
                    Add new manuals, SOP documents, and guidelines to the vector database.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Document Category</label>
                      <select 
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:border-violet-500 focus:outline-none cursor-pointer"
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                      >
                        <option value="finance_policy">Company Finance Policy</option>
                        <option value="sop_document">SOP Document</option>
                        <option value="finance_manual">Finance Manual</option>
                        <option value="gst_guidelines">GST Guidelines</option>
                        <option value="compliance_document">Compliance Document</option>
                      </select>
                    </div>

                    <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-700 bg-slate-950 hover:bg-slate-900/50 hover:border-violet-500/80 transition-all text-xs">
                      {isUploading ? (
                        <>
                          <RefreshCw size={18} className="text-violet-400 animate-spin" />
                          <span className="text-[11px] text-slate-300 font-medium">Ingesting...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={18} className="text-slate-400" />
                          <span className="text-[11px] text-slate-300 font-medium text-center px-2">Drag or select TXT, MD, PDF</span>
                        </>
                      )}
                      <input 
                        className="sr-only" 
                        type="file" 
                        accept=".pdf,.txt,.md" 
                        disabled={isUploading}
                        onChange={(event) => handleUpload(event.target.files?.[0])} 
                      />
                    </label>
                  </div>
                </Card>
              ) : (
                <Card className="border-slate-800 bg-slate-900/30 p-5 space-y-3">
                  <h2 className="text-md font-bold text-white flex items-center gap-2">
                    <Lock size={16} className="text-slate-400" /> Upload Manual
                  </h2>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Manual uploads are restricted to Administrators. Ask your compliance admin to upload new guidelines.
                  </p>
                </Card>
              )}

              <Card className="border-slate-800 bg-slate-900/30 p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Helpful RAG Queries</h3>
                <div className="space-y-1 text-xs text-slate-400">
                  <button 
                    onClick={() => setQuestion("What is the reimbursement policy?")}
                    className="w-full text-left p-1.5 rounded hover:bg-slate-800/50 hover:text-slate-200 transition"
                  >
                    • What is the reimbursement policy?
                  </button>
                  <button 
                    onClick={() => setQuestion("What GST rule applies to invoices?")}
                    className="w-full text-left p-1.5 rounded hover:bg-slate-800/50 hover:text-slate-200 transition"
                  >
                    • What GST rule applies to invoices?
                  </button>
                  <button 
                    onClick={() => setQuestion("What documents are required for vendor approval?")}
                    className="w-full text-left p-1.5 rounded hover:bg-slate-800/50 hover:text-slate-200 transition"
                  >
                    • What documents are required for vendor approval?
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
