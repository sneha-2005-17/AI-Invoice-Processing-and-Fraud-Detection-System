"use client";

import type { Invoice } from "@/services/api";
import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

export function InvoiceTable({ 
  invoices, 
  onSelect, 
  selectedId,
  onDelete
}: { 
  invoices: Invoice[]; 
  onSelect?: (invoice: Invoice) => void; 
  selectedId?: number;
  onDelete?: (invoiceId: number) => void;
}) {
  return (
      <Card className="overflow-hidden p-0 bg-white/95 border border-[#E5E7EB] shadow-sm rounded-xl">
      <div className="border-b p-4 bg-white/80">
        <h2 className="text-lg font-extrabold text-[#374151]">Invoice Review Queue</h2>
        <p className="text-sm font-medium text-[#4B5563]">Recent invoices with extraction and risk scoring results. Click a row to select and analyze the document.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-white text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-[#374151]">Invoice</th>
              <th className="px-4 py-3 font-semibold text-[#374151]">Vendor</th>
              <th className="px-4 py-3 font-semibold text-[#374151]">Amount</th>
              <th className="px-4 py-3 font-semibold text-[#374151]">Risk</th>
              <th className="px-4 py-3 font-semibold text-[#374151]">Flags</th>
              <th className="px-4 py-3 font-semibold text-[#374151]">Status</th>
              <th className="px-4 py-3 font-semibold text-[#374151]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr 
                key={invoice.id} 
                className={`border-t border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer transition-colors ${
                  selectedId === invoice.id ? "bg-violet-50 border-l-4 border-l-violet-500" : ""
                }`}
                onClick={() => onSelect?.(invoice)}
              >
                <td className="px-4 py-3 font-semibold text-[#111827]">{invoice.invoice_number ?? `#${invoice.id}`}</td>
                <td className="px-4 py-3 font-medium text-[#374151]">{invoice.vendor_name ?? "Unknown"}</td>
                <td className="px-4 py-3 font-semibold text-[#111827]">${invoice.total_amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                    <span className="rounded-lg bg-[#F3F4F6] px-2.5 py-1 text-xs font-semibold text-[#374151] border border-[#E5E7EB]">
                    {invoice.fraud_result?.risk_level ?? "Pending"} {invoice.fraud_result?.risk_score ?? ""}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-[#374151]">{invoice.fraud_result?.flags.length ?? 0}</td>
                <td className="px-4 py-3 font-semibold text-[#374151]">{invoice.status}</td>
                <td className="px-4 py-3">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(invoice.id);
                    }}
                    variant="destructive"
                    className="h-8 bg-rose-600/90 hover:bg-rose-600 text-white text-xs px-3"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

