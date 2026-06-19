import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleDot,
  Plus,
  ShieldCheck,
  Vote,
} from "lucide-react";

import { DaoAppShell } from "@/components/layout/dao-app-shell";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  daoStats,
  marketplaceAgents,
  recentProposals,
} from "@/lib/demo-data";

function slugifyProject(project: string) {
  return project
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function DashboardPage() {
  return (
    <DaoAppShell active="Dashboard">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
              DAO command center
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              Investment governance dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Monitor active proposals, marketplace agents, reputation-weighted
              voting, and Casper Testnet recording readiness.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="h-10 w-full sm:w-fit">
              <Link href="/demo?autorun=1">
                <BadgeCheck className="size-4" />
                Run Live Demo
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10 w-full sm:w-fit">
              <Link href="/projects/new">
                <Plus className="size-4" />
                New proposal
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {daoStats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Active investment proposals</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Agent review and DAO voting pipeline
                  </p>
                </div>
                <Vote className="size-5 text-emerald-200" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>Project</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="text-right">Signal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProposals.map((proposal) => (
                    <TableRow
                      key={proposal.project}
                      className="border-white/10 hover:bg-white/[0.03]"
                    >
                      <TableCell>
                        <div className="font-medium">{proposal.project}</div>
                        <div className="text-xs text-muted-foreground">
                          {proposal.category}
                        </div>
                      </TableCell>
                      <TableCell>{proposal.stage}</TableCell>
                      <TableCell>
                        <div className="flex w-28 items-center gap-2">
                          <Progress value={proposal.score} className="h-2" />
                          <span className="text-xs">{proposal.score}</span>
                        </div>
                      </TableCell>
                      <TableCell>{proposal.risk}</TableCell>
                      <TableCell className="text-right text-emerald-100">
                        <Link
                          href={`/projects/${slugifyProject(proposal.project)}/agents`}
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          {proposal.recommendation}
                          <ArrowUpRight className="size-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card
            id="governance"
            className="rounded-lg border-white/10 bg-white/[0.035] shadow-none"
          >
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle>Governance state</CardTitle>
              <p className="text-sm text-muted-foreground">
                Autonomous weighted voting is configured for MVP.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {[
                ["Proposal quorum", "72%"],
                ["Agent vote capture", "Ready"],
                ["Member override", "Disabled"],
                ["Casper adapter", "Testnet"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
              <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
                <div className="flex items-center gap-2 text-sm text-emerald-100">
                  <ShieldCheck className="size-4" />
                  Decision hashes only on-chain
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Sensitive diligence remains off-chain while proposal,
                  vote, and resolution hashes are prepared for Casper.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section
          id="marketplace"
          className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"
        >
          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader>
              <CardTitle>Marketplace posture</CardTitle>
              <p className="text-sm text-muted-foreground">
                Built-in agents are registered; community agents are a future
                governance extension.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {["8", "5", "0"].map((value, index) => (
                  <div
                    key={value}
                    className="rounded-lg border border-white/10 bg-black/20 p-3"
                  >
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {index === 0
                        ? "registered"
                        : index === 1
                          ? "enabled"
                          : "community"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Enabled agent registry</CardTitle>
                <Button variant="ghost" size="sm">
                  Manage
                  <ArrowUpRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 pt-2 md:grid-cols-2 xl:grid-cols-3">
              {marketplaceAgents.map((agent) => {
                const Icon = agent.icon;

                return (
                  <div
                    key={agent.name}
                    className="rounded-lg border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Icon className="size-5 text-emerald-200" />
                      <Badge
                        variant="outline"
                        className="rounded-lg border-white/10 text-xs"
                      >
                        {agent.status}
                      </Badge>
                    </div>
                    <h2 className="mt-4 text-sm font-semibold">{agent.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {agent.category} / {agent.weight}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Progress value={agent.trust} className="h-2" />
                      <span className="text-xs text-emerald-100">
                        {agent.trust}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section className="rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-3 text-sm">
            <CircleDot className="size-4 text-amber-200" />
            Demo mode is ready: OpenAI and Casper wallet credentials are
            optional for the judge flow.
          </div>
        </section>
      </div>
    </DaoAppShell>
  );
}
