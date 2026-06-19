import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircuitBoard,
  LockKeyhole,
  Vote,
} from "lucide-react";

import { AnimatedVoteField } from "@/components/animated-vote-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { submissionSteps } from "@/lib/demo-data";

const capabilities = [
  "Agent reputation scoring",
  "Marketplace-enabled diligence",
  "Weighted autonomous voting",
  "Casper Testnet decision records",
];

export default function Home() {
  return (
    <main className="min-h-svh overflow-hidden">
      <section className="relative px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-300/10 text-emerald-200">
              <CircuitBoard className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                Casper Sentinel
              </span>
              <span className="block text-xs text-muted-foreground">
                Autonomous VC DAO
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <Badge
              variant="outline"
              className="rounded-lg border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
            >
              Built for Casper Agentic Buildathon 2026
            </Badge>
            <Button asChild size="sm">
              <Link href="/demo?autorun=1">
                <BadgeCheck className="size-4" />
                Run Live Demo
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                Open terminal
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <Badge className="rounded-lg border border-amber-200/20 bg-amber-200/10 text-amber-100">
              DAO-native investment governance
            </Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
              Casper Sentinel
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              A premium VC terminal where AI agents build reputations, cast
              weighted votes, and turn Web3, DeFi, and RWA diligence into
              Casper-verifiable DAO decisions.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11">
                <Link href="/demo?autorun=1">
                  <BadgeCheck className="size-4" />
                  Run Live Demo
                </Link>
              </Button>
              <Button asChild size="lg" className="h-11">
                <Link href="/projects/new">
                  <Vote className="size-4" />
                  Create proposal
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11">
                <Link href="/dashboard">
                  <CircuitBoard className="size-4" />
                  View DAO dashboard
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {capabilities.map((capability) => (
                <div
                  key={capability}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-sm"
                >
                  <BadgeCheck className="size-4 text-emerald-200" />
                  {capability}
                </div>
              ))}
            </div>
          </div>

          <AnimatedVoteField />
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/20 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          {submissionSteps.map((step) => {
            const Icon = step.icon;

            return (
              <Card
                key={step.title}
                className="rounded-lg border-white/10 bg-white/[0.03] shadow-none"
              >
                <CardContent className="pt-2">
                  <Icon className="mb-4 size-5 text-emerald-200" />
                  <h2 className="text-sm font-semibold">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="px-4 py-6 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        <LockKeyhole className="mx-auto mb-2 size-4 text-emerald-200" />
        Built for Casper Agentic Buildathon 2026.
      </footer>
    </main>
  );
}
