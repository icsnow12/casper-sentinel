import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  FileText,
  GitBranch,
  Globe2,
  Landmark,
  Rocket,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { marketplaceAgents, submissionSteps } from "@/lib/demo-data";

const categoryOptions = [
  "WEB3",
  "DEFI",
  "RWA",
  "INFRASTRUCTURE",
  "GAMING",
  "AI",
];

export default function NewProjectPage() {
  return (
    <DaoAppShell active="New proposal">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_360px]">
        <section>
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Button asChild variant="ghost" size="sm" className="mb-3 px-0">
                <Link href="/dashboard">
                  <ArrowLeft className="size-4" />
                  Dashboard
                </Link>
              </Button>
              <Badge className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                Investment proposal intake
              </Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                Submit a project for DAO review
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Capture the core materials needed for future agent diligence,
                weighted voting, and Casper-anchored governance records.
              </p>
            </div>
          </div>

          <form className="space-y-4">
            <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Rocket className="size-5 text-emerald-200" />
                  <CardTitle>Project identity</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-2 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project name</Label>
                  <Input
                    id="projectName"
                    name="projectName"
                    placeholder="CasperPay Rails"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    defaultValue="RWA"
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="website"
                      name="website"
                      className="pl-9"
                      placeholder="https://project.example"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="githubUrl">GitHub repository</Label>
                  <div className="relative">
                    <GitBranch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="githubUrl"
                      name="githubUrl"
                      className="pl-9"
                      placeholder="https://github.com/org/repo"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-amber-200" />
                  <CardTitle>Diligence materials</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="whitepaperText">Whitepaper or memo text</Label>
                  <Textarea
                    id="whitepaperText"
                    name="whitepaperText"
                    className="min-h-52 resize-y"
                    placeholder="Paste the whitepaper, executive memo, RWA collateral summary, or technical overview."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Landmark className="size-5 text-sky-200" />
                  <CardTitle>Token and network context</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-2 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="tokenSymbol">Token symbol</Label>
                  <Input id="tokenSymbol" name="tokenSymbol" placeholder="CSPR" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenNetwork">Token network</Label>
                  <Input
                    id="tokenNetwork"
                    name="tokenNetwork"
                    placeholder="Casper Testnet"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenAddress">Token address</Label>
                  <Input
                    id="tokenAddress"
                    name="tokenAddress"
                    placeholder="hash-..."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Judge demo shortcut</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Continue from intake into agents, committee, resolution, and
                  Casper proof using the prepared demo project.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="h-10">
                  <Link href="/demo?autorun=1">
                    <BadgeCheck className="size-4" />
                    Run Live Demo
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-10">
                  <Link href="/projects/harbor-rwa-credit/agents">
                    Open agents
                  </Link>
                </Button>
              </div>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader>
              <CardTitle>Submission pipeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                The proposal object will feed these later phases.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {submissionSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.title}
                    className="flex gap-3 rounded-lg border border-white/10 bg-black/20 p-3"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-100">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {index + 1}. {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
            <CardHeader>
              <CardTitle>Enabled voting agents</CardTitle>
              <p className="text-sm text-muted-foreground">
                Marketplace settings determine who evaluates future proposals.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {marketplaceAgents
                .filter((agent) => agent.status === "Enabled")
                .map((agent) => {
                  const Icon = agent.icon;

                  return (
                    <div
                      key={agent.name}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="size-4 text-emerald-200" />
                        <div>
                          <p className="text-sm font-medium">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Trust {agent.trust}% / {agent.weight}
                          </p>
                        </div>
                      </div>
                      <ShieldCheck className="size-4 text-emerald-200" />
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </aside>
      </div>
    </DaoAppShell>
  );
}
