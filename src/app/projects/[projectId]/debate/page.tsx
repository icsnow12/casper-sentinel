import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BrainCircuit,
  CheckCircle2,
  FileCheck2,
  Flame,
  Gavel,
  LineChart,
  MessageSquareQuote,
  Network,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
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
import type { AgentType } from "@/server/agents/schemas";
import {
  formatDebateRecommendation,
  runDebate,
} from "@/server/debate/debate-orchestrator";
import type { DebateOutput, DebateRound } from "@/server/debate/debate-schemas";

type DebatePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

type IconComponent = React.ComponentType<{ className?: string }>;

const agentIcons: Record<AgentType, IconComponent> = {
  TECHNICAL: BrainCircuit,
  MARKET: LineChart,
  SECURITY: ShieldCheck,
  COMPLIANCE: FileCheck2,
  TREASURY: Banknote,
};

const challengePairs: { source: AgentType; target: AgentType }[] = [
  { source: "TECHNICAL", target: "MARKET" },
  { source: "SECURITY", target: "COMPLIANCE" },
  { source: "TREASURY", target: "MARKET" },
];

function formatProjectName(projectId: string) {
  return decodeURIComponent(projectId)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function asRecord(rounds: DebateRound[]) {
  return Object.fromEntries(
    rounds.map((round) => [round.agentType, round])
  ) as Record<AgentType, DebateRound>;
}

function stanceTone(stance: DebateRound["stance"]) {
  if (stance === "Approve") {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  }

  if (stance === "Reject") {
    return "border-rose-300/20 bg-rose-300/10 text-rose-100";
  }

  return "border-amber-200/20 bg-amber-200/10 text-amber-100";
}

function riskTone(riskLevel: DebateRound["riskLevel"]) {
  if (riskLevel === "HIGH") {
    return "border-rose-300/20 bg-rose-300/10 text-rose-100";
  }

  if (riskLevel === "MEDIUM") {
    return "border-amber-200/20 bg-amber-200/10 text-amber-100";
  }

  return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
}

function recommendationTone(recommendation: string) {
  if (recommendation === "APPROVE") {
    return "text-emerald-200";
  }

  if (recommendation === "REJECT") {
    return "text-rose-200";
  }

  return "text-amber-200";
}

function riskValue(round: DebateRound) {
  if (round.riskLevel === "HIGH") {
    return 82;
  }

  if (round.riskLevel === "MEDIUM") {
    return 52;
  }

  return 24;
}

function conflictHeat(debate: DebateOutput) {
  const averageRoundRisk =
    debate.debateRounds.reduce((total, round) => total + riskValue(round), 0) /
    debate.debateRounds.length;
  const consensusGap = 100 - debate.consensus.finalConsensusScore;

  return Math.min(100, Math.round(consensusGap * 0.58 + averageRoundRisk * 0.42));
}

function conflictHeatLevel(score: number) {
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

function conflictHeatTone(level: string) {
  if (level === "CRITICAL" || level === "HIGH") {
    return "text-rose-200";
  }

  if (level === "MEDIUM") {
    return "text-amber-200";
  }

  return "text-emerald-200";
}

function trustInfluenceMultiplier(debate: DebateOutput) {
  return `${(debate.finalScore.components.reputationTrust / 72).toFixed(2)}x`;
}

export default async function DebatePage({ params }: DebatePageProps) {
  const { projectId } = await params;
  const projectName = formatProjectName(projectId) || "Casper Sentinel Demo";
  const debate = await runDebate({
    projectId,
    projectName,
  });
  const roundsByType = asRecord(debate.debateRounds);
  const heatScore = conflictHeat(debate);
  const heatLevel = conflictHeatLevel(heatScore);
  const recommendationLabel = formatDebateRecommendation(
    debate.finalScore.recommendation
  );
  const committeeConfidence = debate.finalScore.components.reputationTrust;
  const scoreCards: { label: string; value: number; icon: IconComponent }[] = [
    {
      label: "Weighted vote",
      value: debate.finalScore.components.weightedVote,
      icon: Vote,
    },
    {
      label: "Consensus",
      value: debate.finalScore.components.debateConsensus,
      icon: Scale,
    },
    {
      label: "Confidence",
      value: debate.finalScore.components.agentConfidence,
      icon: BrainCircuit,
    },
    {
      label: "Reputation",
      value: debate.finalScore.components.reputationTrust,
      icon: Sparkles,
    },
  ];

  return (
    <DaoAppShell active="Governance">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <Button asChild variant="ghost" size="sm" className="mb-3 px-0">
              <Link href={`/projects/${projectId}/agents`}>
                <ArrowLeft className="size-4" />
                Agent analysis
              </Link>
            </Button>
            <Badge className="rounded-lg border border-sky-300/20 bg-sky-300/10 text-sky-100">
              AI Committee Debate Engine
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              Debate room: {projectName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Agent votes are stress-tested through challenge, rebuttal,
              consensus, and Phase 6 scoring before the DAO resolution step.
            </p>
          </div>
          <Button asChild className="h-10 w-full sm:w-fit">
            <Link href={`/projects/${projectId}/committee`}>
              View Committee
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>

        <section>
          <Card className="rounded-lg border-emerald-300/25 bg-emerald-300/[0.055] shadow-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Gavel className="size-6 text-emerald-200" />
                <CardTitle className="text-2xl">AI Committee Verdict</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_1.15fr] lg:items-center">
              <div>
                <p
                  className={`text-5xl font-semibold tracking-normal sm:text-6xl ${recommendationTone(
                    debate.finalScore.recommendation
                  )}`}
                >
                  {recommendationLabel.toUpperCase()}
                </p>
                <div className="mt-5 flex items-end gap-3">
                  <span className="font-mono text-7xl leading-none text-foreground sm:text-8xl">
                    {debate.finalScore.score}
                  </span>
                  <span className="pb-2 font-mono text-3xl text-muted-foreground">
                    / 100
                  </span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <VerdictMetric
                  label="Consensus"
                  value={`${debate.consensus.finalConsensusScore}`}
                  detail="Committee alignment"
                />
                <VerdictMetric
                  label="Conflict Heat"
                  value={heatLevel}
                  detail={`${heatScore}/100`}
                  tone={conflictHeatTone(heatLevel)}
                />
                <VerdictMetric
                  label="Trust Influence"
                  value={trustInfluenceMultiplier(debate)}
                  detail="Reputation lift"
                />
                <VerdictMetric
                  label="Committee Confidence"
                  value={`${committeeConfidence}`}
                  detail="Trust-adjusted conviction"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Debate progress</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Arguments, challenges, rebuttals, and consensus are locked.
                  </p>
                </div>
                <Badge variant="outline" className="h-8 rounded-lg px-3">
                  {debate.mode === "openai" ? "OpenAI mode" : "Demo mode"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  5 arguments / 5 rebuttals / consensus
                </span>
                <span className="font-mono text-emerald-100">100%</span>
              </div>
              <Progress value={100} className="h-2" />
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {scoreCards.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase text-muted-foreground">
                        {label}
                      </p>
                      <Icon className="size-4 text-emerald-200" />
                    </div>
                    <p className="mt-3 font-mono text-2xl text-emerald-100">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-emerald-300/20 bg-emerald-300/[0.045] shadow-none">
            <CardContent className="grid min-h-64 place-items-center p-5">
              <div className="text-center">
                <div className="mx-auto grid size-32 place-items-center rounded-full border border-white/10 bg-black/25">
                  <Gavel className="size-12 text-emerald-200" />
                </div>
                <p className="mt-4 text-xs uppercase text-muted-foreground">
                  Final recommendation
                </p>
                <h2
                  className={`mt-2 text-3xl font-semibold ${recommendationTone(
                    debate.finalScore.recommendation
                  )}`}
                >
                  {recommendationLabel}
                </h2>
                <p className="mt-2 font-mono text-4xl text-foreground">
                  {debate.finalScore.score}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Network className="size-5 text-sky-200" />
                <div>
                  <CardTitle>Debate timeline</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Challenge paths selected by the committee engine.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {challengePairs.map((pair) => {
                const source = roundsByType[pair.source];
                const target = roundsByType[pair.target];
                const targetRebuttal = debate.rebuttals.find(
                  (item) => item.agentType === pair.target
                );
                const SourceIcon = agentIcons[pair.source];
                const TargetIcon = agentIcons[pair.target];

                return (
                  <div
                    key={`${pair.source}-${pair.target}`}
                    className="rounded-lg border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-9 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/10">
                          <SourceIcon className="size-4 text-emerald-200" />
                        </span>
                        <span className="truncate text-sm font-semibold">
                          {source.agent}
                        </span>
                      </div>
                      <ArrowRight className="hidden size-4 text-muted-foreground sm:block" />
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-9 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-300/10">
                          <TargetIcon className="size-4 text-sky-200" />
                        </span>
                        <span className="truncate text-sm font-semibold">
                          {target.agent}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <TimelineCell
                        label="Challenge"
                        value={source.challenge}
                      />
                      <TimelineCell
                        label="Response"
                        value={targetRebuttal?.rebuttal ?? target.argument}
                      />
                      <TimelineCell
                        label="Resolution"
                        value={
                          targetRebuttal?.resolution ??
                          debate.consensus.dominantConcern
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <MeterCard
              title="Consensus meter"
              icon={Scale}
              value={debate.consensus.finalConsensusScore}
              tone="text-emerald-200"
            />
            <ConflictHeatCard
              level={heatLevel}
              score={heatScore}
            />
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center gap-3">
            <MessageSquareQuote className="size-5 text-emerald-200" />
            <h2 className="text-xl font-semibold">Agent arguments</h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-5">
            {debate.debateRounds.map((round) => {
              const Icon = agentIcons[round.agentType];

              return (
                <Card
                  key={round.agentType}
                  className="rounded-lg border-white/10 bg-white/[0.035] shadow-none"
                >
                  <CardHeader className="border-b border-white/10 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Icon className="mb-3 size-5 text-emerald-200" />
                        <CardTitle>{round.agent}</CardTitle>
                      </div>
                      <Badge className={`rounded-lg ${stanceTone(round.stance)}`}>
                        {round.stance}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-mono text-emerald-100">
                        {round.confidence}
                      </span>
                    </div>
                    <Progress value={round.confidence} className="h-2" />
                    <Badge className={`rounded-lg ${riskTone(round.riskLevel)}`}>
                      {round.riskLevel} risk
                    </Badge>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {round.argument}
                    </p>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">
                        Evidence
                      </p>
                      <p className="mt-2 text-xs leading-5 text-foreground/85">
                        {round.evidence}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Target className="size-5 text-amber-200" />
                <CardTitle>Agent challenges</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 pt-2 md:grid-cols-2">
              {debate.debateRounds.map((round) => (
                <div
                  key={`${round.agentType}-challenge`}
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">
                      {round.agent} challenges {round.challengeTarget}
                    </p>
                    <Badge variant="outline" className="rounded-lg">
                      {round.riskLevel}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {round.challenge}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle>Trust influence chart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {debate.votes.map((vote) => {
                const Icon = agentIcons[vote.agentType];
                const influence = Math.round(vote.normalizedWeight * 100);

                return (
                  <div key={vote.agentType}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon className="size-4 shrink-0 text-emerald-200" />
                        <span className="truncate">{vote.agentName}</span>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        Trust {vote.trustScore} / Weight {influence}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-300"
                        style={{ width: `${influence}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle>Rebuttals</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-2">
              {debate.rebuttals.map((item) => {
                const Icon = agentIcons[item.agentType];

                return (
                  <div
                    key={`${item.agentType}-rebuttal`}
                    className="rounded-lg border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-emerald-200" />
                        <p className="text-sm font-semibold">{item.agent}</p>
                      </div>
                      <Badge variant="outline" className="rounded-lg">
                        to {item.responseTo}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {item.rebuttal}
                    </p>
                    <p className="mt-3 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm leading-6 text-emerald-50">
                      {item.resolution}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-emerald-200" />
                  <CardTitle>Consensus</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <ConsensusList
                  label="Agreement points"
                  items={debate.consensus.agreementPoints}
                  tone="text-emerald-200"
                />
                <ConsensusList
                  label="Disagreement points"
                  items={debate.consensus.disagreementPoints}
                  tone="text-amber-200"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <SignalBox
                    label="Dominant concern"
                    value={debate.consensus.dominantConcern}
                  />
                  <SignalBox
                    label="Dominant opportunity"
                    value={debate.consensus.dominantOpportunity}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-amber-200/20 bg-amber-200/[0.04] shadow-none">
              <CardHeader className="border-b border-white/10 pb-4">
                <CardTitle>Final recommendation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Phase 6 score
                    </p>
                    <p className="mt-1 font-mono text-5xl text-foreground">
                      {debate.finalScore.score}
                    </p>
                  </div>
                  <Badge
                    className={`h-8 rounded-lg px-3 ${stanceTone(
                      recommendationLabel === "Approve"
                        ? "Approve"
                        : recommendationLabel === "Reject"
                          ? "Reject"
                          : "Diligence Required"
                    )}`}
                  >
                    {recommendationLabel}
                  </Badge>
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {debate.finalScore.reasoning}
                </p>
                <div className="grid gap-3">
                  {[
                    [
                      "40% weighted vote",
                      debate.finalScore.components.weightedVote,
                    ],
                    [
                      "30% debate consensus",
                      debate.finalScore.components.debateConsensus,
                    ],
                    [
                      "20% agent confidence",
                      debate.finalScore.components.agentConfidence,
                    ],
                    [
                      "10% reputation trust",
                      debate.finalScore.components.reputationTrust,
                    ],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="uppercase text-muted-foreground">
                          {label}
                        </span>
                        <span className="font-mono text-emerald-100">
                          {value}
                        </span>
                      </div>
                      <Progress value={Number(value)} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DaoAppShell>
  );
}

function TimelineCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-xs leading-5 text-foreground/85">{value}</p>
    </div>
  );
}

function VerdictMetric({
  label,
  value,
  detail,
  tone = "text-emerald-100",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className={`mt-3 font-mono text-4xl font-semibold ${tone}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function MeterCard({
  title,
  icon: Icon,
  value,
  tone,
}: {
  title: string;
  icon: IconComponent;
  value: number;
  tone: string;
}) {
  const angle = Math.round((value / 100) * 360);

  return (
    <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Icon className="size-5 text-emerald-200" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid place-items-center pt-4">
        <div
          className="grid size-52 place-items-center rounded-full border border-white/10"
          style={{
            background: `conic-gradient(oklch(0.76 0.15 164) ${angle}deg, oklch(1 0 0 / 8%) 0deg)`,
          }}
        >
          <div className="grid size-36 place-items-center rounded-full bg-background">
            <span className={`font-mono text-6xl ${tone}`}>{value}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConflictHeatCard({
  level,
  score,
}: {
  level: string;
  score: number;
}) {
  const activeIndex = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].indexOf(level);

  return (
    <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Flame className="size-5 text-amber-200" />
          <CardTitle>Conflict heat</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid min-h-52 place-items-center text-center">
          <div>
            <p className={`text-6xl font-semibold ${conflictHeatTone(level)}`}>
              {level}
            </p>
            <p className="mt-2 font-mono text-lg text-muted-foreground">
              {score}/100 heat score
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((item, index) => (
            <div key={item} className="space-y-2">
              <div
                className={`h-3 rounded-full ${
                  index <= activeIndex ? "bg-amber-300" : "bg-white/10"
                }`}
              />
              <p className="text-center text-[10px] text-muted-foreground">
                {item}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ConsensusList({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex gap-3 rounded-lg border border-white/10 bg-black/20 p-3"
          >
            <CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${tone}`} />
            <p className="text-sm leading-6 text-muted-foreground">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground/85">{value}</p>
    </div>
  );
}
