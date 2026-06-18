"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardSummary } from "@/services/api";
import { Card } from "@/components/ui/card";

const riskColors: Record<string, string> = {
  Low: "#0f9f8f",
  Medium: "#f2b705",
  High: "#d92d20"
};

export function AnalyticsCharts({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2 bg-white/95 border border-[#E5E7EB] shadow-sm rounded-xl">
        <div className="mb-3">
          <h2 className="text-lg font-extrabold text-[#374151]">Monthly Fraud Trends</h2>
          <p className="text-sm font-medium text-[#4B5563]">Fraud case volume by processing month.</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary.monthly_fraud_trends}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#374151", fontWeight: 500, fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#374151", fontWeight: 500, fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #E5E7EB" }} />
              <Line type="monotone" dataKey="fraud_cases" stroke="#0f9f8f" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="bg-white/95 border border-[#E5E7EB] shadow-sm rounded-xl">
        <div className="mb-3">
          <h2 className="text-lg font-extrabold text-[#374151]">Risk Distribution</h2>
          <p className="text-sm font-medium text-[#4B5563]">Share of reviewed invoices by risk level.</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
              <PieChart>
              <Pie data={summary.risk_distribution} dataKey="count" nameKey="risk_level" outerRadius={90} label={{ fill: "#111827", fontWeight: 700 }}>
                {summary.risk_distribution.map((entry) => (
                  <Cell key={entry.risk_level} fill={riskColors[entry.risk_level] ?? "#64748b"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #E5E7EB" }} />
              <Legend wrapperStyle={{ color: "#374151", fontWeight: 600 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="xl:col-span-3 bg-white/95 border border-[#E5E7EB] shadow-sm rounded-xl">
        <div className="mb-3">
          <h2 className="text-lg font-extrabold text-[#374151]">Vendor Risk Ranking</h2>
          <p className="text-sm font-medium text-[#4B5563]">Highest-risk vendors requiring review.</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.vendor_risk_ranking}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
              <XAxis dataKey="vendor" tick={{ fill: "#374151", fontWeight: 500, fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#374151", fontWeight: 500, fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #E5E7EB" }} />
              <Bar dataKey="risk_score" fill="#0f9f8f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
