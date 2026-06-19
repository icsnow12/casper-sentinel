"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Fingerprint,
  Gavel,
  LineChart,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Vote,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type DemoStatus = "idle" | "running" | "complete" | "error";
type StepStatus = "pending" | "running" | "complete" | "error";

type AgentOutput = {
  agentType: "TECHNICAL" | "MARKET" | "SECURITY" | "COMPLIANCE" | "TREASURY";
  summary: string;
  score: number;
  confidence: number;
  risk: number;
  recommendation: string;
};

type EvaluationResponse = {
  mode: "openai" | "demo";
  agents: AgentOutput[];
};

type CommitteeResponse = {
  mode: "openai" | "demo";
  votes: {
    agentType: AgentOutput["agentType"];
    agentName: string;
    vote: string;
    trustScore: number;
    normalizedWeight: number;
    score: number;
  }[];
  weightedScore: number;
  weightedConfidence: number;
  weightedRisk: number;
  preliminaryRecommendation: string;
};

type ResolutionResponse = {
  finalRecommendation: string;
  finalScore: number;
  confidenceScore: number;
  riskScore: number;
  decisionHash: string;
  generatedAt: string;
};

type PreparedResponse = {
  status: string;
  payloadHash: string;
  payload: {
    timestamp: string;
  };
};

type ProofResponse = {
  mode: "REAL" | "DEMO";
  status: string;
  network: string;
  transactionHash: string;
  explorerUrl: string;
  submittedAt: string;
};

const demoProject = {
  projectId: "harbor-rwa-credit",
  projectName: "Harbor RWA Credit",
  category: "RWA",
  githubRepository: "https://github.com/casper-sentinel/demo-project",
  tokenSymbol: "HARBOR",
  tokenNetwork: "Casper Testnet",
  whitepaper:
    "Harbor RWA Credit is a demo private-credit protocol for tokenized invoices, DAO review, and Casper-verifiable resolution hashes. The project includes a whitepaper, token context, and a repository URL for the autonomous VC DAO to evaluate.",
};

const steps = [
  {
    key: "intake",
    title: "Project intake",
    description: "Load a demo RWA project with whitepaper, GitHub, and token facts.",
    icon: FileCheck2,
  },
  {
    key: "agents",
    title: "AI agents analyze",
    description: "Five specialized agents produce independent diligence outputs.",
    icon: BrainCircuit,
  },
  {
    key: "votes",
    title: "Agent votes",
    description: "Agents cast formal votes with reputation-aware weights.",
    icon: Vote,
  },
  {
    key: "resolution",
    title: "Committee resolution",
    description: "The committee generates a final recommendation and decision hash.",
    icon: Gavel,
  },
  {
    key: "proof",
    title: "Casper Testnet proof",
    description: "The decision hash is prepared and recorded through demo-safe proof.",
    icon: LockKeyhole,
  },
] as const;

const agentIcons: Record<AgentOutput["agentType"], typeof BrainCircuit> = {
  TECHNICAL: BrainCircuit,
  MARKET: LineChart,
  SECURITY: ShieldCheck,
  COMPLIANCE: FileCheck2,
  TREASURY: Banknote,
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function LiveDemoRunner() {
  const searchParams = useSearchParams();
  const shouldAutorun = searchParams.get("autorun") === "1";
  const [status, setStatus] = useState<DemoStatus>("idle");
  const [stepStatus, setStepStatus] = useState<Record<string, StepStatus>>({
    intake: "pending",
    agents: "pending",
    votes: "pending",
    resolution: "pending",
    proof: "pending",
  });
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [committee, setCommittee] = useState<CommitteeResponse | null>(null);
  const [resolution, setResolution] = useState<ResolutionResponse | null>(null);
  const [prepared, setPrepared] = useState<PreparedResponse | null>(null);
  const [proof, setProof] = useState<ProofResponse | null>(null);
  const [hasAutorun, setHasAutorun] = useState(false);

  const progress = useMemo(() => {
    const completed = Object.values(stepStatus).filter(
      (item) => item === "complete"
    ).length;
    return Math.round((completed / steps.length) * 100);
  }, [stepStatus]);

  const updateStep = useCallback((key: string, value: StepStatus) => {
    setStepStatus((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const runDemo = useCallback(async () => {
    setStatus("running");
    setError(null);
    setEvaluation(null);
    setCommittee(null);
    setResolution(null);
    setPrepared(null);
    setProof(null);
    setStepStatus({
      intake: "running",
      agents: "pending",
      votes: "pending",
      resolution: "pending",
      proof: "pending",
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      updateStep("intake", "complete");
      updateStep("agents", "running");

      const evaluationResult = await postJson<EvaluationResponse>(
        "/api/evaluations",
        demoProject
      );
      setEvaluation(evaluationResult);
      updateStep("agents", "complete");
      updateStep("votes", "running");

      const committeeResult = await postJson<CommitteeResponse>(
        "/api/committee",
        {
          projectId: demoProject.projectId,
          projectName: demoProject.projectName,
          agents: evaluationResult.agents,
        }
      );
      setCommittee(committeeResult);
      updateStep("votes", "complete");
      updateStep("resolution", "running");

      const resolutionResult = await postJson<ResolutionResponse>(
        "/api/resolution",
        {
          projectId: demoProject.projectId,
          projectName: demoProject.projectName,
          agents: evaluationResult.agents,
          committee: committeeResult,
        }
      );
      setResolution(resolutionResult);
      updateStep("resolution", "complete");
      updateStep("proof", "running");

      const preparedResult = await postJson<PreparedResponse>(
        "/api/casper/prepare",
        {
          projectId: demoProject.projectId,
          proposalId: demoProject.projectId,
          recommendation: resolutionResult.finalRecommendation,
          finalScore: resolutionResult.finalScore,
          confidenceScore: resolutionResult.confidenceScore,
          riskScore: resolutionResult.riskScore,
          decisionHash: resolutionResult.decisionHash,
          timestamp: resolutionResult.generatedAt,
        }
      );
      setPrepared(preparedResult);

      const proofResult = await postJson<ProofResponse>("/api/casper/submit", {
        prepared: preparedResult,
        forceDemo: true,
      });
      setProof(proofResult);
      updateStep("proof", "complete");
      setStatus("complete");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "The live demo failed.";
      setError(message);
      setStatus("error");
      setStepStatus((current) => {
        const runningStep = Object.entries(current).find(
          ([, value]) => value === "running"
        )?.[0];

        return runningStep
          ? {
              ...current,
              [runningStep]: "error",
            }
          : current;
      });
    }
  }, [updateStep]);

  useEffect(() => {
    if (shouldAutorun && !hasAutorun) {
      setHasAutorun(true);
      void runDemo();
    }
  }, [hasAutorun, runDemo, shouldAutorun]);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
          <CardHeader className="border-b border-white/10 pb-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <Badge className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                  Built for Casper Agentic Buildathon 2026
                </Badge>
                <CardTitle className="mt-4 text-3xl">
                  Guided judge demo
                </CardTitle>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  One click runs the full autonomous VC DAO story: intake,
                  agents, votes, committee resolution, and a Casper Testnet demo
                  proof.
                </p>
              </div>
              <Button
                type="button"
                className="h-10 w-full sm:w-fit"
                disabled={status === "running"}
                onClick={runDemo}
              >
                {status === "running" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <BrainCircuit className="size-4" />
                )}
                Run Live Demo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Demo progress</span>
              <span className="font-mono text-emerald-100">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />

            {status === "idle" ? (
              <EmptyState />
            ) : null}

            {error ? <ErrorState message={error} onRetry={runDemo} /> : null}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
          <CardHeader className="border-b border-white/10 pb-4">
            <CardTitle>Demo project</CardTitle>
            <p className="text-sm text-muted-foreground">
              A preloaded RWA project designed to exercise every product layer.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 pt-2 sm:grid-cols-2">
            {[
              ["Project", demoProject.projectName],
              ["Category", demoProject.category],
              ["Token", `${demoProject.tokenSymbol} / ${demoProject.tokenNetwork}`],
              ["Repository", demoProject.githubRepository],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-white/10 bg-black/20 p-3"
              >
                <p className="text-xs uppercase text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 truncate text-sm">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        {steps.map((step) => {
          const Icon = step.icon;
          const itemStatus = stepStatus[step.key];

          return (
            <div
              key={step.key}
              className="rounded-lg border border-white/10 bg-black/20 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <Icon className="size-5 text-emerald-200" />
                <StepBadge status={itemStatus} />
              </div>
              <h2 className="mt-4 text-sm font-semibold">{step.title}</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {step.description}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
          <CardHeader className="border-b border-white/10 pb-4">
            <CardTitle>AI agent outputs</CardTitle>
            <p className="text-sm text-muted-foreground">
              Demo mode returns realistic mock outputs when OpenAI credentials
              are absent.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 pt-2 md:grid-cols-2">
            {evaluation?.agents.length ? (
              evaluation.agents.map((agent) => {
                const Icon = agentIcons[agent.agentType];

                return (
                  <div
                    key={agent.agentType}
                    className="rounded-lg border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="size-5 text-emerald-200" />
                      <Badge variant="outline" className="rounded-lg">
                        {formatLabel(agent.recommendation)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-semibold">
                      {formatLabel(agent.agentType)}
                    </p>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                      {agent.summary}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <Metric label="Score" value={agent.score} />
                      <Metric label="Risk" value={agent.risk} />
                      <Metric label="Conf" value={agent.confidence} />
                    </div>
                  </div>
                );
              })
            ) : (
              <PanelEmpty label="Agent outputs appear after Step 2 completes." />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
          <CardHeader className="border-b border-white/10 pb-4">
            <CardTitle>Committee and proof</CardTitle>
            <p className="text-sm text-muted-foreground">
              Agent votes become a hashable DAO resolution and Casper proof.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <SummaryRow
              icon={Vote}
              label="Agent votes"
              value={
                committee
                  ? `${committee.votes.length} votes / ${committee.weightedScore} score`
                  : "Pending"
              }
            />
            <SummaryRow
              icon={Gavel}
              label="Resolution"
              value={
                resolution
                  ? `${formatLabel(resolution.finalRecommendation)} / ${resolution.finalScore}`
                  : "Pending"
              }
            />
            <SummaryRow
              icon={Fingerprint}
              label="Decision hash"
              value={
                resolution ? `${resolution.decisionHash.slice(0, 18)}...` : "Pending"
              }
            />
            <SummaryRow
              icon={LockKeyhole}
              label="Casper proof"
              value={
                proof
                  ? `${proof.status} / ${proof.transactionHash.slice(0, 12)}...`
                  : prepared
                    ? "Prepared"
                    : "Pending"
              }
            />

            {proof ? (
              <a
                href={proof.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100 hover:bg-emerald-300/15"
              >
                {proof.network} proof: {proof.explorerUrl}
              </a>
            ) : null}

            {status === "complete" ? (
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button asChild className="h-10">
                  <Link href="/projects/harbor-rwa-credit/resolution">
                    Open final resolution
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-10">
                  <Link href="/projects/harbor-rwa-credit/committee">
                    View committee
                  </Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StepBadge({ status }: { status: StepStatus }) {
  if (status === "complete") {
    return (
      <Badge className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
        <CheckCircle2 className="size-3" />
        Done
      </Badge>
    );
  }

  if (status === "running") {
    return (
      <Badge className="rounded-lg border border-amber-200/20 bg-amber-200/10 text-amber-100">
        <Loader2 className="size-3 animate-spin" />
        Running
      </Badge>
    );
  }

  if (status === "error") {
    return (
      <Badge className="rounded-lg border border-rose-300/20 bg-rose-300/10 text-rose-100">
        <AlertTriangle className="size-3" />
        Error
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="rounded-lg">
      <Clock3 className="size-3" />
      Waiting
    </Badge>
  );
}

function EmptyState() {
  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">
      The demo has not started yet. Press Run Live Demo to execute the full
      judging flow without requiring OpenAI credentials or a Casper wallet.
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mt-4 rounded-lg border border-rose-300/20 bg-rose-300/10 p-4">
      <div className="flex items-center gap-2 text-sm text-rose-100">
        <AlertTriangle className="size-4" />
        Demo flow stopped
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        Retry demo
      </Button>
    </div>
  );
}

function PanelEmpty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-black/10 p-6 text-center text-sm text-muted-foreground md:col-span-2">
      {label}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/[0.04] p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-emerald-100">{value}</p>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Vote;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 text-emerald-200" />
        {label}
      </div>
      <span className="max-w-[220px] truncate text-right font-mono text-xs">
        {value}
      </span>
    </div>
  );
}
