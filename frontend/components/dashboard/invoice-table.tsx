"use client";

import type { Invoice } from "@/services/api";
import { Card } from "@/components/ui/card";

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Invoice Review Queue</h2>
        <p className="text-sm text-foreground/65">Recent invoices with extraction and risk scoring results.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">Flags</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t">
                <td className="px-4 py-3 font-medium">{invoice.invoice_number ?? `#${invoice.id}`}</td>
                <td className="px-4 py-3">{invoice.vendor_name ?? "Unknown"}</td>
                <td className="px-4 py-3">${invoice.total_amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="rounded-sm bg-muted px-2 py-1 text-xs font-medium">
                    {invoice.fraud_result?.risk_level ?? "Pending"} {invoice.fraud_result?.risk_score ?? ""}
                  </span>
                </td>
                <td className="px-4 py-3">{invoice.fraud_result?.flags.length ?? 0}</td>
                <td className="px-4 py-3">{invoice.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
