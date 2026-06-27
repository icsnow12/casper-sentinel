import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { CasperRecordingPanel } from "@/components/casper/casper-recording-panel";
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
import { buildResolution } from "@/server/committee/resolution";
import { formatRecommendation } from "@/server/committee/voting";

type ResolutionPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function formatProjectName(projectId: string) {
  return decodeURIComponent(projectId)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function recommendationTone(recommendation: string) {
  if (recommendation.includes("PASS")) {
    return "text-rose-200";
  }
  if (recommendation.includes("DILIGENCE") || recommendation.includes("WATCHLIST")) {
    return "text-amber-200";
  }
  return "text-emerald-200";
}

export default async function ResolutionPage({ params }: ResolutionPageProps) {
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
      "Demo final resolution for Casper Sentinel autonomous VC DAO governance.",
  });
  const resolution = await buildResolution({
    projectId,
    projectName,
    agents,
  });
  const recommendationLabel = formatRecommendation(
    resolution.finalRecommendation
  );

  return (
    <DaoAppShell active="Governance">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-3 px-0">
              <Link href={`/projects/${projectId}/committee`}>
                <ArrowLeft className="size-4" />
                Committee review
              </Link>
            </Button>
            <Badge className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
              Final resolution
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              {projectName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              The Investment Committee has produced a hashable decision payload.
              A successful governance contract deployment is verified on Casper
              Testnet, while new recordings retain an honest demo fallback.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Badge
              variant="outline"
              className="h-9 rounded-lg border-emerald-300/20 bg-emerald-300/10 px-3 text-emerald-100"
            >
              <LockKeyhole className="size-4" />
              Real Testnet proof available
            </Badge>
            <Button asChild className="h-9">
              <Link href="#casper-proof">
                View Casper Proof
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <Card className="rounded-lg border-emerald-300/20 bg-emerald-300/[0.045] shadow-none">
            <CardContent className="grid min-h-[420px] place-items-center p-6">
              <div className="text-center">
                <div className="mx-auto grid size-44 place-items-center rounded-full border border-emerald-300/25 bg-black/30">
                  <div className="grid size-32 place-items-center rounded-full border border-amber-200/20 bg-amber-200/[0.04]">
                    <ShieldCheck className="size-14 text-emerald-200" />
                  </div>
                </div>
                <p className="mt-6 text-xs uppercase text-muted-foreground">
                  Final recommendation
                </p>
                <h2
                  className={`mt-2 text-3xl font-semibold ${recommendationTone(
                    resolution.finalRecommendation
                  )}`}
                >
                  {recommendationLabel}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Resolution ID
                </p>
                <p className="font-mono text-xs text-emerald-100">
                  {resolution.resolutionId.slice(0, 24)}...
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Final score", resolution.finalScore, "text-emerald-200"],
                ["Confidence", resolution.confidenceScore, "text-sky-200"],
                ["Risk", resolution.riskScore, "text-amber-200"],
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
                    <div className={`text-3xl font-semibold ${tone}`}>
                      {value}
                    </div>
                    <Progress value={Number(value)} className="mt-3 h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="size-5 text-emerald-200" />
                  <CardTitle>Investment memo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm leading-7 text-muted-foreground">
                  {resolution.investmentMemo}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Fingerprint className="size-5 text-amber-200" />
                  <CardTitle>Decision hash preview</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <p className="break-all font-mono text-sm text-emerald-100">
                    {resolution.decisionHash}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground">Payload</p>
                    <p className="mt-1 font-mono text-sm">
                      {resolution.decisionPayload.agentVotes.length} agent votes
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="mt-1 text-sm text-emerald-100">
                      {resolution.casperStatus.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle>Conditions precedent</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-2">
              {resolution.conditionsPrecedent.map((condition) => (
                <div
                  key={condition}
                  className="flex gap-3 rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-200" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    {condition}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle>Recording checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {[
                ["Decision payload", "Canonicalized"],
                ["SHA-256 hash", "Generated"],
                ["Wallet signature", "Optional in demo mode"],
                ["Testnet deployment", "Verified on-chain"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section id="casper-proof" className="scroll-mt-24">
          <CasperRecordingPanel
            projectId={resolution.projectId}
            proposalId={resolution.projectId}
            recommendation={resolution.finalRecommendation}
            finalScore={resolution.finalScore}
            confidenceScore={resolution.confidenceScore}
            riskScore={resolution.riskScore}
            decisionHash={resolution.decisionHash}
            timestamp={resolution.generatedAt}
          />
        </section>
      </div>
    </DaoAppShell>
  );
}
