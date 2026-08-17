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
      <Card className="xl:col-span-2">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Monthly Fraud Trends</h2>
          <p className="text-sm text-foreground/65">Fraud case volume by processing month.</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary.monthly_fraud_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="fraud_cases" stroke="#0f9f8f" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Risk Distribution</h2>
          <p className="text-sm text-foreground/65">Share of reviewed invoices by risk level.</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={summary.risk_distribution} dataKey="count" nameKey="risk_level" outerRadius={90} label>
                {summary.risk_distribution.map((entry) => (
                  <Cell key={entry.risk_level} fill={riskColors[entry.risk_level] ?? "#64748b"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="xl:col-span-3">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Vendor Risk Ranking</h2>
          <p className="text-sm text-foreground/65">Highest-risk vendors requiring review.</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.vendor_risk_ranking}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vendor" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="risk_score" fill="#0f9f8f" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
