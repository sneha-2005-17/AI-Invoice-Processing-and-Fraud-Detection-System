"use client";

import { Card } from "@/components/ui/card";

export function MetricStrip({ metrics }: { metrics: { label: string; value: string | number; delta?: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="bg-white/95 border border-[#E5E7EB] shadow-sm rounded-xl">
          <p className="text-sm font-semibold text-[#374151]">{metric.label}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <strong className="text-4xl font-extrabold tracking-tight text-[#111827]">{metric.value}</strong>
            {metric.delta ? <span className="text-sm font-semibold text-[#374151]">{metric.delta}</span> : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
