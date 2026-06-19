import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BrainCircuit,
  FileCheck2,
  Gavel,
  LineChart,
  ShieldCheck,
  Vote,
} from "lucide-react";

import { DaoAppShell } from "@/components/layout/dao-app-shell";
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
import { buildMockAgentOutputs } from "@/server/agents/mock-data";
import type { AgentType } from "@/server/agents/schemas";
import { runCommittee } from "@/server/committee/committee-agent";
import { formatRecommendation } from "@/server/committee/voting";

type CommitteePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

const speakerIcons: Record<
  AgentType | "COMMITTEE",
  React.ComponentType<{ className?: string }>
> = {
  TECHNICAL: BrainCircuit,
  MARKET: LineChart,
  SECURITY: ShieldCheck,
  COMPLIANCE: FileCheck2,
  TREASURY: Banknote,
  COMMITTEE: Gavel,
};

function formatProjectName(projectId: string) {
  return decodeURIComponent(projectId)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function voteTone(score: number) {
  if (score >= 78) {
    return "text-emerald-200";
  }
  if (score >= 55) {
    return "text-amber-200";
  }
  return "text-rose-200";
}

export default async function CommitteePage({ params }: CommitteePageProps) {
  const { projectId } = await params;
  const projectName = formatProjectName(projectId) || "Casper Sentinel Demo";
  const agents = buildMockAgentOutputs({
    projectId,
    projectName,
    category: "RWA",
    githubRepository: "https://github.com/casper-sentinel/demo-project",
    tokenSymbol: "CSPR",
    tokenNetwork: "Casper Testnet",
    whitepaper:
      "Demo committee review for the Casper Sentinel autonomous VC DAO.",
  });
  const committee = await runCommittee({
    projectId,
    projectName,
    agents,
  });

  return (
    <DaoAppShell active="Governance">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-3 px-0">
              <Link href={`/projects/${projectId}/debate`}>
                <ArrowLeft className="size-4" />
                AI debate
              </Link>
            </Button>
            <Badge className="rounded-lg border border-amber-200/20 bg-amber-200/10 text-amber-100">
              Investment Committee Agent
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              Committee review: {projectName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              The committee compares independent agent outputs, records formal
              votes, applies reputation-aware weights, and prepares the final
              resolution inputs.
            </p>
          </div>
          <Button asChild className="h-10 w-full sm:w-fit">
            <Link href={`/projects/${projectId}/resolution`}>
              View Resolution
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Weighted score", committee.weightedScore, "text-emerald-200"],
            ["Confidence", committee.weightedConfidence, "text-sky-200"],
            ["Risk", committee.weightedRisk, "text-amber-200"],
            [
              "Preliminary vote",
              formatRecommendation(committee.preliminaryRecommendation),
              "text-emerald-100",
            ],
          ].map(([label, value, tone]) => (
            <Card
              key={label as string}
              className="rounded-lg border-white/10 bg-white/[0.035] shadow-none"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase text-muted-foreground">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-semibold ${tone}`}>
                  {value}
                </div>
                {typeof value === "number" ? (
                  <Progress value={value} className="mt-3 h-2" />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Gavel className="size-5 text-amber-200" />
                <div>
                  <CardTitle>Debate timeline</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Structured committee exchange before final resolution.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-4">
                {committee.debateTranscript.map((item, index) => {
                  const Icon = speakerIcons[item.speaker];

                  return (
                    <div key={`${item.speaker}-${index}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="flex size-9 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                          <Icon className="size-4" />
                        </span>
                        {index < committee.debateTranscript.length - 1 ? (
                          <span className="mt-2 h-full min-h-10 w-px bg-white/10" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h2 className="text-sm font-semibold">
                            {item.title}
                          </h2>
                          <Badge variant="outline" className="rounded-lg">
                            {item.stance}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Vote className="size-5 text-emerald-200" />
                  <div>
                    <CardTitle>Agent votes</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Base weights adjusted by demo reputation scores.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead>Agent</TableHead>
                      <TableHead>Vote</TableHead>
                      <TableHead>Trust</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {committee.votes.map((vote) => (
                      <TableRow
                        key={vote.agentType}
                        className="border-white/10 hover:bg-white/[0.03]"
                      >
                        <TableCell>
                          <div className="font-medium">{vote.agentName}</div>
                          <div className="text-xs text-muted-foreground">
                            Base {(vote.baseWeight * 100).toFixed(0)}%
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatRecommendation(vote.vote)}
                        </TableCell>
                        <TableCell>{vote.trustScore}</TableCell>
                        <TableCell>
                          {(vote.normalizedWeight * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell
                          className={`text-right ${voteTone(vote.score)}`}
                        >
                          {vote.score}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
              <CardHeader className="border-b border-white/10 pb-4">
                <CardTitle>Disagreements</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 pt-2">
                {committee.disagreements.map((item) => (
                  <div
                    key={item.topic}
                    className="rounded-lg border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold">{item.topic}</h2>
                      <Badge variant="outline" className="rounded-lg">
                        {item.severity}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.summary}
                    </p>
                    <p className="mt-2 font-mono text-xs text-emerald-100">
                      {item.agents.join(" / ")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DaoAppShell>
  );
}
