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
  CirclePlay,
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
  Timer,
  Vote,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FEATURED_TESTNET_PROOF,
  FeaturedTestnetProof,
} from "@/components/casper/featured-testnet-proof";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type DemoStatus = "idle" | "running" | "complete" | "error";
type DemoMode = "manual" | "judge";
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
    key: "debate",
    title: "AI debate",
    description: "Agents challenge assumptions, rebut objections, and form consensus.",
    icon: MessageSquareQuote,
  },
  {
    key: "committee",
    title: "Committee vote",
    description: "Five reputation-weighted votes become a committee recommendation.",
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

type StepKey = (typeof steps)[number]["key"];

const JUDGE_DEMO_SECONDS = 90;
const JUDGE_STAGE_END_MS: Record<StepKey, number> = {
  intake: 6_000,
  agents: 26_000,
  debate: 44_000,
  committee: 59_000,
  resolution: 73_000,
  proof: 90_000,
};

const INITIAL_STEP_STATUS: Record<StepKey, StepStatus> = {
  intake: "pending",
  agents: "pending",
  debate: "pending",
  committee: "pending",
  resolution: "pending",
  proof: "pending",
};

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

async function waitUntilStageEnd(
  mode: DemoMode,
  startedAt: number,
  step: StepKey,
  manualDelay = 0
) {
  const delay =
    mode === "judge"
      ? Math.max(0, startedAt + JUDGE_STAGE_END_MS[step] - Date.now())
      : manualDelay;

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

function getStepResult(
  step: StepKey,
  evaluation: EvaluationResponse | null,
  debate: DebateResponse | null,
  committee: CommitteeResponse | null,
  resolution: ResolutionResponse | null
) {
  if (step === "intake") {
    return `${demoProject.projectName} / ${demoProject.category}`;
  }

  if (step === "agents") {
    if (!evaluation) {
      return "Five specialist reviews queued";
    }

    const averageScore = Math.round(
      evaluation.agents.reduce((total, agent) => total + agent.score, 0) /
        evaluation.agents.length
    );
    return `${evaluation.agents.length} agents / ${averageScore} average score`;
  }

  if (step === "debate") {
    return debate
      ? `${debate.consensus.finalConsensusScore} consensus / ${conflictLevel(
          getDebateHighlights(debate).heatScore
        )} conflict`
      : "Challenges and rebuttals queued";
  }

  if (step === "committee") {
    return committee
      ? `${committee.votes.length} weighted votes / ${committee.weightedScore} score`
      : "Reputation-weighted vote queued";
  }

  if (step === "resolution") {
    return resolution
      ? `${formatLabel(resolution.finalRecommendation)} / ${resolution.finalScore}`
      : "Final recommendation queued";
  }

  return `Success / ${FEATURED_TESTNET_PROOF.deployHash.slice(0, 12)}...`;
}

export function LiveDemoRunner() {
  const searchParams = useSearchParams();
  const autorun = searchParams.get("autorun");
  const shouldAutorun = autorun === "1" || autorun === "judge";
  const [status, setStatus] = useState<DemoStatus>("idle");
  const [demoMode, setDemoMode] = useState<DemoMode>("manual");
  const [stepStatus, setStepStatus] =
    useState<Record<StepKey, StepStatus>>(INITIAL_STEP_STATUS);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [committee, setCommittee] = useState<CommitteeResponse | null>(null);
  const [debate, setDebate] = useState<DebateResponse | null>(null);
  const [resolution, setResolution] = useState<ResolutionResponse | null>(null);
  const [prepared, setPrepared] = useState<PreparedResponse | null>(null);
  const [proof, setProof] = useState<ProofResponse | null>(null);
  const [hasAutorun, setHasAutorun] = useState(false);
  const [judgeStartedAt, setJudgeStartedAt] = useState<number | null>(null);
  const [judgeElapsedSeconds, setJudgeElapsedSeconds] = useState(0);

  const stepProgress = useMemo(() => {
    const completed = Object.values(stepStatus).filter(
      (item) => item === "complete"
    ).length;
    return Math.round((completed / steps.length) * 100);
  }, [stepStatus]);

  const progress =
    demoMode === "judge" && status === "running"
      ? Math.min(
          100,
          Math.round((judgeElapsedSeconds / JUDGE_DEMO_SECONDS) * 100)
        )
      : stepProgress;

  const activeStep =
    steps.find((step) => stepStatus[step.key] === "running") ?? null;

  const updateStep = useCallback((key: StepKey, value: StepStatus) => {
    setStepStatus((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const runDemo = useCallback(async (mode: DemoMode) => {
    const startedAt = Date.now();

    setDemoMode(mode);
    setStatus("running");
    setJudgeStartedAt(mode === "judge" ? startedAt : null);
    setJudgeElapsedSeconds(0);
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
      debate: "pending",
      committee: "pending",
      resolution: "pending",
      proof: "pending",
    });

    try {
      await waitUntilStageEnd(mode, startedAt, "intake", 350);
      updateStep("intake", "complete");
      updateStep("agents", "running");

      const evaluationResult = await postJson<EvaluationResponse>(
        "/api/evaluations",
        demoProject
      );
      setEvaluation(evaluationResult);

      const committeeResult = await postJson<CommitteeResponse>(
        "/api/committee",
        {
          projectId: demoProject.projectId,
          projectName: demoProject.projectName,
          agents: evaluationResult.agents,
        }
      );
      await waitUntilStageEnd(mode, startedAt, "agents");
      updateStep("agents", "complete");
      updateStep("debate", "running");

      const debateResult = await postJson<DebateResponse>("/api/debate", {
        projectId: demoProject.projectId,
        projectName: demoProject.projectName,
        agents: evaluationResult.agents,
      });
      setDebate(debateResult);
      await waitUntilStageEnd(mode, startedAt, "debate");
      updateStep("debate", "complete");
      updateStep("committee", "running");
      setCommittee(committeeResult);

      await waitUntilStageEnd(mode, startedAt, "committee", 300);
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
      await waitUntilStageEnd(mode, startedAt, "resolution");
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
      await waitUntilStageEnd(mode, startedAt, "proof");
      updateStep("proof", "complete");
      setJudgeElapsedSeconds(mode === "judge" ? JUDGE_DEMO_SECONDS : 0);
      setStatus("complete");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "The live demo failed.";
      setError(message);
      setStatus("error");
      setStepStatus((current) => {
        const runningStep = Object.entries(current).find(
          ([, value]) => value === "running"
        )?.[0] as StepKey | undefined;

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
    if (
      demoMode !== "judge" ||
      status !== "running" ||
      judgeStartedAt === null
    ) {
      return;
    }

    const updateElapsed = () => {
      setJudgeElapsedSeconds(
        Math.min(
          JUDGE_DEMO_SECONDS,
          Math.floor((Date.now() - judgeStartedAt) / 1000)
        )
      );
    };
    const interval = window.setInterval(updateElapsed, 250);
    updateElapsed();

    return () => window.clearInterval(interval);
  }, [demoMode, judgeStartedAt, status]);

  useEffect(() => {
    if (demoMode === "judge" && status === "complete") {
      document.getElementById("judge-final-proof")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [demoMode, status]);

  useEffect(() => {
    if (shouldAutorun && !hasAutorun) {
      setHasAutorun(true);
      void runDemo(autorun === "judge" ? "judge" : "manual");
    }
  }, [autorun, hasAutorun, runDemo, shouldAutorun]);

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
                  See the autonomous investment DAO move from intake to a
                  publicly verifiable Casper Testnet result in 90 seconds.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto">
                <Button
                  type="button"
                  className="h-11 w-full sm:w-auto"
                  disabled={status === "running"}
                  onClick={() => void runDemo("judge")}
                >
                  {status === "running" && demoMode === "judge" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CirclePlay className="size-4" />
                  )}
                  Start 90s Judge Demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full sm:w-auto"
                  disabled={status === "running"}
                  onClick={() => void runDemo("manual")}
                >
                  <BrainCircuit className="size-4" />
                  Run Live Demo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {demoMode === "judge" ? "90-second judge run" : "Demo progress"}
              </span>
              <span className="font-mono text-emerald-100">
                {demoMode === "judge" && status === "running"
                  ? `${JUDGE_DEMO_SECONDS - judgeElapsedSeconds}s left`
                  : `${progress}%`}
              </span>
            </div>
            <Progress value={progress} className="h-2" />

            {demoMode === "judge" && status === "running" ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Timer className="size-4 text-amber-200" />
                No wallet or signing required. The final proof is a real public
                Testnet transaction.
              </div>
            ) : null}

            {status === "idle" ? (
              <EmptyState />
            ) : null}

            {error ? (
              <ErrorState
                message={error}
                onRetry={() => void runDemo(demoMode)}
              />
            ) : null}
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

      {demoMode === "judge" && status === "running" && activeStep ? (
        <JudgeStageSpotlight
          step={activeStep}
          stepNumber={steps.findIndex((step) => step.key === activeStep.key) + 1}
          result={getStepResult(
            activeStep.key,
            evaluation,
            debate,
            committee,
            resolution
          )}
          elapsedSeconds={judgeElapsedSeconds}
        />
      ) : null}

      {demoMode === "judge" && status === "complete" ? (
        <section
          id="judge-final-proof"
          className="scroll-mt-6 rounded-lg border border-emerald-300/30 bg-emerald-300/[0.06] p-4 sm:p-6"
        >
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <Badge className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 text-emerald-100">
                <CheckCircle2 className="size-4" />
                90-second decision complete
              </Badge>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                Real Casper Testnet Proof
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                The judge workflow uses deterministic demo evaluations and a
                simulated receipt. The deployment below is real, successful,
                and publicly verifiable.
              </p>
            </div>
            <Badge
              variant="outline"
              className="h-9 w-fit rounded-lg border-emerald-300/25 bg-emerald-300/10 px-3 text-emerald-100"
            >
              Status: Success
            </Badge>
          </div>
          <FeaturedTestnetProof />
        </section>
      ) : null}

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

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {steps.map((step) => {
          const Icon = step.icon;
          const itemStatus = stepStatus[step.key];
          const debateHighlights = debate ? getDebateHighlights(debate) : null;
          const result = getStepResult(
            step.key,
            evaluation,
            debate,
            committee,
            resolution
          );

          return (
            <div
              key={step.key}
              className={`min-h-[220px] rounded-lg border p-3 transition-colors duration-500 ${
                itemStatus === "running"
                  ? "border-amber-200/40 bg-amber-200/[0.08] shadow-[0_0_28px_rgba(253,230,138,0.08)]"
                  : itemStatus === "complete"
                    ? "border-emerald-300/20 bg-emerald-300/[0.04]"
                    : "border-white/10 bg-black/20"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <Icon className="size-5 text-emerald-200" />
                <StepBadge status={itemStatus} />
              </div>
              <h2 className="mt-4 text-sm font-semibold">{step.title}</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {step.description}
              </p>
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-xs uppercase text-muted-foreground">
                  Key result
                </p>
                <p className="mt-2 text-xs leading-5 text-foreground">
                  {itemStatus === "pending" ? "Awaiting stage" : result}
                </p>
                {itemStatus === "running" ? (
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-amber-200" />
                  </div>
                ) : null}
              </div>
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

function JudgeStageSpotlight({
  step,
  stepNumber,
  result,
  elapsedSeconds,
}: {
  step: (typeof steps)[number];
  stepNumber: number;
  result: string;
  elapsedSeconds: number;
}) {
  const Icon = step.icon;

  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-lg border border-amber-200/30 bg-amber-200/[0.055]"
    >
      <div className="grid min-h-[230px] lg:grid-cols-[1fr_0.72fr]">
        <div className="flex flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg border border-amber-200/25 bg-amber-200/10 text-amber-100">
                <Icon className="size-6" />
              </span>
              <div>
                <p className="text-xs uppercase text-amber-100">
                  Stage {stepNumber} of {steps.length}
                </p>
                <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
                  {step.title}
                </h2>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
              {step.description}
            </p>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-amber-200" />
            Autonomous workflow advancing
          </div>
        </div>

        <div className="flex flex-col justify-center border-t border-white/10 bg-black/20 p-5 sm:p-6 lg:border-t-0 lg:border-l">
          <p className="text-xs uppercase text-muted-foreground">Key result</p>
          <p className="mt-3 text-2xl font-semibold text-emerald-100 sm:text-3xl">
            {result}
          </p>
          <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
            <span>Elapsed</span>
            <span className="font-mono text-foreground">
              {elapsedSeconds}s / {JUDGE_DEMO_SECONDS}s
            </span>
          </div>
          <Progress
            value={(elapsedSeconds / JUDGE_DEMO_SECONDS) * 100}
            className="mt-2 h-2"
          />
        </div>
      </div>
    </section>
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
      Start the paced 90-second judge experience, or use Run Live Demo for the
      existing fast workflow. Neither path requires a wallet or private key.
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
