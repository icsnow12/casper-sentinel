import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, CircuitBoard } from "lucide-react";

import { LiveDemoRunner } from "@/components/demo/live-demo-runner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DemoPage() {
  return (
    <main className="min-h-svh px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-300/10 text-emerald-200">
            <CircuitBoard className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold">Casper Sentinel</span>
            <span className="block text-xs text-muted-foreground">
              Autonomous VC DAO
            </span>
          </span>
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Landing
          </Link>
        </Button>
      </div>

      <section className="mx-auto mt-8 max-w-7xl">
        <Badge className="rounded-lg border border-amber-200/20 bg-amber-200/10 text-amber-100">
          Built for Casper Agentic Buildathon 2026
        </Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">
          One-click judge demo
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          This guided page runs the full Casper Sentinel story in one place:
          project intake, multi-agent AI diligence, formal votes, committee
          resolution, and Casper Testnet proof preparation.
        </p>
      </section>

      <section className="mx-auto mt-6 max-w-7xl">
        <Suspense fallback={<DemoLoading />}>
          <LiveDemoRunner />
        </Suspense>
      </section>
    </main>
  );
}

function DemoLoading() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-6 text-sm text-muted-foreground">
      Loading demo terminal...
    </div>
  );
}
