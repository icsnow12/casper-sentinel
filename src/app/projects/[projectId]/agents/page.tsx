import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  BrainCircuit,
  CheckCircle2,
  FileCheck2,
  LineChart,
  ShieldCheck,
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
import { buildMockAgentOutputs } from "@/server/agents/mock-data";
import type { AgentOutput, AgentType } from "@/server/agents/schemas";

type AgentAnalysisPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

const agentIcons: Record<AgentType, React.ComponentType<{ className?: string }>> =
  {
    TECHNICAL: BrainCircuit,
    MARKET: LineChart,
    SECURITY: ShieldCheck,
    COMPLIANCE: FileCheck2,
    TREASURY: Banknote,
  };

const agentNames: Record<AgentType, string> = {
  TECHNICAL: "Technical Agent",
  MARKET: "Market Agent",
  SECURITY: "Security Agent",
  COMPLIANCE: "Compliance Agent",
  TREASURY: "Treasury Agent",
};

function formatProjectName(projectId: string) {
  return decodeURIComponent(projectId)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getRiskTone(risk: number) {
  if (risk >= 70) {
    return "text-rose-200";
  }

  if (risk >= 45) {
    return "text-amber-200";
  }

  return "text-emerald-200";
}

function getRecommendationLabel(recommendation: AgentOutput["recommendation"]) {
  return recommendation
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function AgentAnalysisPage({
  params,
}: AgentAnalysisPageProps) {
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
      "Demo analysis view for the Casper Sentinel autonomous VC DAO multi-agent engine.",
  });

  const averageScore = Math.round(
    agents.reduce((total, agent) => total + agent.score, 0) / agents.length
  );
  const averageRisk = Math.round(
    agents.reduce((total, agent) => total + agent.risk, 0) / agents.length
  );
  const averageConfidence = Math.round(
    agents.reduce((total, agent) => total + agent.confidence, 0) / agents.length
  );

  return (
    <DaoAppShell active="Dashboard">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-3 px-0">
              <Link href="/dashboard">
                <ArrowLeft className="size-4" />
                Dashboard
              </Link>
            </Button>
            <Badge className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
              Multi-agent analysis
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              {projectName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Five specialized AI agents independently assess the project. This
              phase feeds weighted voting, adversarial debate, DAO finalization,
              and Casper recording.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="h-10 w-full sm:w-fit">
              <Link href="/projects/new">Submit another project</Link>
            </Button>
            <Button asChild className="h-10 w-full sm:w-fit">
              <Link href={`/projects/${projectId}/debate`}>
                View Debate
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Average score", averageScore, "text-emerald-200"],
            ["Average confidence", averageConfidence, "text-sky-200"],
            ["Average risk", averageRisk, getRiskTone(averageRisk)],
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
                <div className="flex items-end justify-between gap-4">
                  <span className={`text-3xl font-semibold ${tone}`}>
                    {value}
                  </span>
                  <Progress value={Number(value)} className="mb-2 h-2 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4">
          {agents.map((agent) => {
            const Icon = agentIcons[agent.agentType];

            return (
              <Card
                key={agent.agentType}
                className="rounded-lg border-white/10 bg-white/[0.035] shadow-none"
              >
                <CardHeader className="border-b border-white/10 pb-4">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="flex gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <CardTitle>{agentNames[agent.agentType]}</CardTitle>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {agent.summary}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-lg border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                    >
                      {getRecommendationLabel(agent.recommendation)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="grid gap-5 pt-2 xl:grid-cols-[280px_1fr]">
                  <div className="grid gap-3">
                    {[
                      ["Score", agent.score, "text-emerald-200"],
                      ["Confidence", agent.confidence, "text-sky-200"],
                      ["Risk", agent.risk, getRiskTone(agent.risk)],
                    ].map(([label, value, tone]) => (
                      <div
                        key={label as string}
                        className="rounded-lg border border-white/10 bg-black/20 p-3"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {label}
                          </span>
                          <span className={tone as string}>{value}</span>
                        </div>
                        <Progress value={Number(value)} className="mt-3 h-2" />
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <AnalysisList
                      icon={CheckCircle2}
                      title="Strengths"
                      items={agent.strengths}
                    />
                    <AnalysisList
                      icon={AlertTriangle}
                      title="Concerns"
                      items={agent.concerns}
                    />
                    <AnalysisList
                      icon={ShieldCheck}
                      title="Red flags"
                      items={
                        agent.redFlags.length
                          ? agent.redFlags
                          : ["No critical red flags identified in this pass."]
                      }
                    />
                  </div>

                  <div className="xl:col-start-2">
                    <h2 className="mb-3 text-sm font-semibold">Evidence</h2>
                    <div className="grid gap-2 md:grid-cols-2">
                      {agent.evidence.map((item) => (
                        <div
                          key={`${agent.agentType}-${item.label}`}
                          className="rounded-lg border border-white/10 bg-black/20 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{item.label}</p>
                            <Badge variant="outline" className="rounded-lg">
                              {item.source}
                            </Badge>
                          </div>
                          {item.excerpt ? (
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              {item.excerpt}
                            </p>
                          ) : null}
                          {item.url ? (
                            <p className="mt-2 truncate font-mono text-xs text-emerald-100">
                              {item.url}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </DaoAppShell>
  );
}

type AnalysisListProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
};

function AnalysisList({ icon: Icon, title, items }: AnalysisListProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-emerald-200" />
        {title}
      </div>
      <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-200/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
