"use client";

import { Card } from "@/components/ui/card";

export function MetricStrip({ metrics }: { metrics: { label: string; value: string | number; delta?: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <p className="text-sm text-foreground/65">{metric.label}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <strong className="text-2xl font-semibold">{metric.value}</strong>
            {metric.delta ? <span className="text-xs text-primary">{metric.delta}</span> : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
