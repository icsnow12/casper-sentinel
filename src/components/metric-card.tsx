import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  tone?: string;
};

export function MetricCard({
  label,
  value,
  delta,
  tone = "text-emerald-300",
}: MetricCardProps) {
  return (
    <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold tracking-normal text-foreground">
            {value}
          </p>
          <span className={cn("flex items-center gap-1 text-xs", tone)}>
            <ArrowUpRight className="size-3" />
            {delta}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
