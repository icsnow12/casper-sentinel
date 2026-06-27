"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Fingerprint,
  Flame,
  Gavel,
  LineChart,
  Loader2,
  LockKeyhole,
  MessageSquareQuote,
  Network,
  Scale,
  ShieldCheck,
  Sparkles,
  Vote,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeaturedTestnetProof } from "@/components/casper/featured-testnet-proof";
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

type DebateRound = {
  agentType: AgentOutput["agentType"];
  agent: string;
  stance: string;
  confidence: number;
  challengeTarget: string;
  challenge: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
};

type DebateResponse = {
  mode: "openai" | "demo";
  debateRounds: DebateRound[];
  rebuttals: {
    agentType: AgentOutput["agentType"];
    agent: string;
    responseTo: string;
    rebuttal: string;
  }[];
  consensus: {
    finalConsensusScore: number;
  };
  finalScore: {
    score: number;
    recommendation: "APPROVE" | "REJECT" | "DILIGENCE_REQUIRED";
    components: {
      weightedVote: number;
      debateConsensus: number;
      agentConfidence: number;
      reputationTrust: number;
    };
  };
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
    key: "debate",
    title: "AI debate",
    description: "Agents challenge assumptions, rebut objections, and form consensus.",
    icon: MessageSquareQuote,
  },
  {
    key: "committee",
    title: "Committee",
    description: "The committee locks the governance-ready recommendation inputs.",
    icon: Gavel,
  },
  {
    key: "resolution",
    title: "Committee resolution",
    description: "The committee generates a final recommendation and decision hash.",
    icon: Fingerprint,
  },
  {
    key: "proof",
    title: "Casper Testnet proof",
    description:
      "The demo uses a safe fallback while showcasing Casper Sentinel's verified real Testnet deployment.",
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

function riskScore(riskLevel: DebateRound["riskLevel"]) {
  if (riskLevel === "HIGH") {
    return 82;
  }

  if (riskLevel === "MEDIUM") {
    return 52;
  }

  return 24;
}

function conflictHeat(debate: DebateResponse) {
  const averageRoundRisk =
    debate.debateRounds.reduce(
      (total, round) => total + riskScore(round.riskLevel),
      0
    ) / debate.debateRounds.length;
  const consensusGap = 100 - debate.consensus.finalConsensusScore;

  return Math.min(100, Math.round(consensusGap * 0.58 + averageRoundRisk * 0.42));
}

function conflictLevel(score: number) {
  if (score >= 85) {
    return "CRITICAL";
  }

  if (score >= 65) {
    return "HIGH";
  }

  if (score >= 35) {
    return "MEDIUM";
  }

  return "LOW";
}

function debateRecommendationLabel(
  value: DebateResponse["finalScore"]["recommendation"]
) {
  return value === "DILIGENCE_REQUIRED" ? "Diligence Required" : formatLabel(value);
}

function getDebateHighlights(debate: DebateResponse) {
  const strongestChallenge = debate.debateRounds.reduce((strongest, round) => {
    const currentScore = riskScore(round.riskLevel) + round.confidence * 0.2;
    const strongestScore =
      riskScore(strongest.riskLevel) + strongest.confidence * 0.2;

    return currentScore > strongestScore ? round : strongest;
  }, debate.debateRounds[0]);
  const strongestRebuttal =
    debate.rebuttals.find(
      (item) => item.agentType === strongestChallenge.agentType
    ) ?? debate.rebuttals[0];

  return {
    strongestChallenge,
    strongestRebuttal,
    heatScore: conflictHeat(debate),
  };
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
    debate: "pending",
    committee: "pending",
    resolution: "pending",
    proof: "pending",
  });
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [committee, setCommittee] = useState<CommitteeResponse | null>(null);
  const [debate, setDebate] = useState<DebateResponse | null>(null);
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
    setDebate(null);
    setResolution(null);
    setPrepared(null);
    setProof(null);
    setStepStatus({
      intake: "running",
      agents: "pending",
      votes: "pending",
      debate: "pending",
      committee: "pending",
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
      updateStep("debate", "running");

      const debateResult = await postJson<DebateResponse>("/api/debate", {
        projectId: demoProject.projectId,
        projectName: demoProject.projectName,
        agents: evaluationResult.agents,
      });
      setDebate(debateResult);
      updateStep("debate", "complete");
      updateStep("committee", "running");

      await new Promise((resolve) => setTimeout(resolve, 300));
      updateStep("committee", "complete");
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
                  agents, votes, debate, committee resolution, a safe demo
                  receipt, and verified real Casper Testnet proof.
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
            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:flex-wrap">
              <Button asChild variant="outline" className="h-9">
                <Link href="/projects/harbor-rwa-credit/agents">Agents</Link>
              </Button>
              <Button asChild variant="outline" className="h-9">
                <Link href="/projects/harbor-rwa-credit/debate">
                  View Debate
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-9">
                <Link href="/projects/harbor-rwa-credit/committee">
                  View Committee
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-9">
                <Link href="/projects/harbor-rwa-credit/resolution">
                  View Resolution
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-9">
                <Link href="/projects/harbor-rwa-credit/resolution#casper-proof">
                  View Casper Proof
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border-sky-300/20 bg-sky-300/[0.045] shadow-none">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Network className="size-5 text-sky-200" />
            <CardTitle>Why this matters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="max-w-5xl text-sm leading-7 text-muted-foreground">
            Traditional DAOs rely on manual governance. Casper Sentinel
            introduces autonomous investment committees where specialized AI
            agents evaluate opportunities, challenge assumptions, form
            consensus, and generate verifiable Casper decision records.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-3 md:grid-cols-7">
        {steps.map((step) => {
          const Icon = step.icon;
          const itemStatus = stepStatus[step.key];
          const debateHighlights = debate ? getDebateHighlights(debate) : null;

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
              {step.key === "debate" && debate && debateHighlights ? (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  <MiniSignal
                    label="Consensus"
                    value={`${debate.consensus.finalConsensusScore}`}
                  />
                  <MiniSignal
                    label="Conflict"
                    value={conflictLevel(debateHighlights.heatScore)}
                  />
                  <MiniSignal
                    label="Verdict"
                    value={debateRecommendationLabel(
                      debate.finalScore.recommendation
                    )}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      {debate ? <DemoDebatePanel debate={debate} /> : null}

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
            <FeaturedTestnetProof />

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
              icon={MessageSquareQuote}
              label="AI debate"
              value={
                debate
                  ? `${debateRecommendationLabel(
                      debate.finalScore.recommendation
                    )} / ${debate.consensus.finalConsensusScore} consensus`
                  : "Pending"
              }
            />
            <SummaryRow
              icon={Gavel}
              label="Committee"
              value={
                committee
                  ? `${formatLabel(committee.preliminaryRecommendation)} ready`
                  : "Pending"
              }
            />
            <SummaryRow
              icon={Fingerprint}
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
              label="Current demo run"
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
                className="block rounded-lg border border-amber-200/20 bg-amber-200/[0.06] p-3 text-sm text-amber-100 hover:bg-amber-200/10"
              >
                Demo fallback receipt, not on-chain: {proof.transactionHash}
              </a>
            ) : null}

            {status === "complete" ? (
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
                <Button asChild className="h-10">
                  <Link href="/projects/harbor-rwa-credit/agents">
                    Agents
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-10">
                  <Link href="/projects/harbor-rwa-credit/debate">
                    View Debate
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-10">
                  <Link href="/projects/harbor-rwa-credit/committee">
                    View Committee
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-10">
                  <Link href="/projects/harbor-rwa-credit/resolution">
                    View Resolution
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-10">
                  <Link href="/projects/harbor-rwa-credit/resolution#casper-proof">
                    View Casper Proof
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

function MiniSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-mono text-emerald-100">{value}</span>
    </div>
  );
}

function DemoDebatePanel({ debate }: { debate: DebateResponse }) {
  const highlights = getDebateHighlights(debate);
  const heatLevel = conflictLevel(highlights.heatScore);
  const recommendation = debateRecommendationLabel(
    debate.finalScore.recommendation
  );

  return (
    <Card className="rounded-lg border-amber-200/20 bg-amber-200/[0.045] shadow-none">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <CardTitle className="text-2xl">Debate intelligence</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              The one-click demo now pauses for adversarial agent reasoning
              before committee finalization.
            </p>
          </div>
          <Badge className="h-8 rounded-lg border border-amber-200/20 bg-amber-200/10 px-3 text-amber-100">
            {recommendation}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-2 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-3">
          <DebateStoryBlock
            icon={MessageSquareQuote}
            label="Strongest challenge"
            title={`${highlights.strongestChallenge.agent} challenges ${highlights.strongestChallenge.challengeTarget}`}
            value={highlights.strongestChallenge.challenge}
          />
          <DebateStoryBlock
            icon={ShieldCheck}
            label="Strongest rebuttal"
            title={`${highlights.strongestRebuttal.agent} responds to ${highlights.strongestRebuttal.responseTo}`}
            value={highlights.strongestRebuttal.rebuttal}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <DemoMetricTile
            icon={Scale}
            label="Consensus score"
            value={`${debate.consensus.finalConsensusScore}`}
            detail="Shared committee position"
          />
          <DemoMetricTile
            icon={Flame}
            label="Conflict heat"
            value={heatLevel}
            detail={`${highlights.heatScore}/100 heat score`}
          />
          <DemoMetricTile
            icon={Sparkles}
            label="Final debate recommendation"
            value={recommendation}
            detail={`${debate.finalScore.score}/100 Phase 6 score`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DebateStoryBlock({
  icon: Icon,
  label,
  title,
  value,
}: {
  icon: typeof Vote;
  label: string;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
        <Icon className="size-4 text-amber-200" />
        {label}
      </div>
      <h2 className="mt-3 text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

function DemoMetricTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Vote;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <Icon className="size-5 text-emerald-200" />
      </div>
      <p className="mt-3 font-mono text-3xl text-emerald-100">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
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
