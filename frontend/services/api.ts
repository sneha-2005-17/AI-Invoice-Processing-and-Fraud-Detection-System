const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type DashboardSummary = {
  total_invoices: number;
  fraud_cases: number;
  high_risk_invoices: number;
  gst_compliance_rate: number;
  average_processing_seconds: number;
  metrics: { label: string; value: string | number; delta?: string }[];
  monthly_fraud_trends: { month: string; fraud_cases: number }[];
  risk_distribution: { risk_level: string; count: number }[];
  vendor_risk_ranking: { vendor: string; risk_score: number }[];
};

export type Invoice = {
  id: number;
  invoice_number: string | null;
  vendor_name: string | null;
  total_amount: number;
  tax_amount: number;
  status: string;
  created_at: string;
  fraud_result?: {
    risk_score: number;
    risk_level: string;
    flags: { code: string; severity: string; message: string }[];
    explanation: string;
  } | null;
  analysis_result?: {
    document_type?: string;
    confidence_score?: number;
    summary?: string;
    important_names?: string[];
    important_dates?: string[];
    important_amounts?: string[];
    risk_indicators?: string[];
  } | null;
};

export async function apiFetch<T>(path: string, token?: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      bodyText = "";
    }
    const message = bodyText
      ? `${response.status} ${response.statusText}: ${bodyText}`
      : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
}

export async function uploadInvoice(file: File, token: string) {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<Invoice>("/api/invoices/upload", token, { method: "POST", body });
}

