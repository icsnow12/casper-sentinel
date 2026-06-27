"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  PlugZap,
  ShieldCheck,
  Wallet,
  XCircle,
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
import type { Recommendation } from "@/server/agents/schemas";
import type {
  CasperPreparedTransaction,
  CasperRecordingStatus,
  CasperSubmitResponse,
} from "@/server/casper/schemas";

type CasperWalletProvider = {
  requestConnection: () => Promise<boolean>;
  getActivePublicKey: () => Promise<string>;
  disconnectFromSite: () => Promise<boolean>;
  isConnected?: () => Promise<boolean>;
};

declare global {
  interface Window {
    CasperWalletProvider?: (options: { timeout: number }) => CasperWalletProvider;
  }
}

type CasperRecordingPanelProps = {
  projectId: string;
  proposalId: string;
  recommendation: Recommendation;
  finalScore: number;
  confidenceScore: number;
  riskScore: number;
  decisionHash: string;
  timestamp: string;
};

const REQUESTS_TIMEOUT_MS = 30 * 60 * 1000;

function getProvider() {
  if (typeof window === "undefined" || !window.CasperWalletProvider) {
    return null;
  }

  return window.CasperWalletProvider({
    timeout: REQUESTS_TIMEOUT_MS,
  });
}

function statusTone(status: CasperRecordingStatus) {
  if (
    status === "CONFIRMED" ||
    status === "DEMO_RECORDED" ||
    status === "DEMO_PROOF"
  ) {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "FAILED" || status === "WALLET_REQUIRED") {
    return "border-rose-300/20 bg-rose-300/10 text-rose-100";
  }

  if (status === "SIGNATURE_PENDING" || status === "SUBMITTED") {
    return "border-amber-200/20 bg-amber-200/10 text-amber-100";
  }

  return "border-sky-300/20 bg-sky-300/10 text-sky-100";
}

function statusIcon(status: CasperRecordingStatus) {
  if (
    status === "CONFIRMED" ||
    status === "DEMO_RECORDED" ||
    status === "DEMO_PROOF"
  ) {
    return CheckCircle2;
  }

  if (status === "FAILED" || status === "WALLET_REQUIRED") {
    return XCircle;
  }

  if (status === "SIGNATURE_PENDING" || status === "SUBMITTED") {
    return Clock3;
  }

  return ShieldCheck;
}

function formatStatus(status: CasperRecordingStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function modeLabel(proof: CasperSubmitResponse | null, prepared: CasperPreparedTransaction | null) {
  const mode = proof?.mode ?? prepared?.mode;

  if (mode === "REAL") {
    return proof ? "REAL TESTNET" : "REAL TESTNET READY";
  }

  return proof ? "DEMO PROOF" : "CASPER TESTNET-READY";
}

export function CasperRecordingPanel(props: CasperRecordingPanelProps) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<CasperPreparedTransaction | null>(
    null
  );
  const [proof, setProof] = useState<CasperSubmitResponse | null>(null);
  const [status, setStatus] = useState<CasperRecordingStatus>(
    "READY_FOR_TESTNET_RECORDING"
  );
  const [isBusy, setIsBusy] = useState(false);

  const StatusIcon = statusIcon(status);
  const walletConnected = Boolean(publicKey);
  const currentTimestamp = proof?.submittedAt ?? prepared?.payload.timestamp ?? props.timestamp;
  const displayMode = modeLabel(proof, prepared);

  const prepareBody = useMemo(
    () => ({
      projectId: props.projectId,
      proposalId: props.proposalId,
      recommendation: props.recommendation,
      finalScore: props.finalScore,
      confidenceScore: props.confidenceScore,
      riskScore: props.riskScore,
      decisionHash: props.decisionHash,
      timestamp: props.timestamp,
    }),
    [props]
  );

  async function connectWallet() {
    setWalletError(null);
    const provider = getProvider();

    if (!provider) {
      setStatus("WALLET_REQUIRED");
      setWalletError(
        "Casper Wallet extension was not detected. Demo proof mode and server-side Testnet submission remain available."
      );
      return;
    }

    try {
      const connected = await provider.requestConnection();

      if (!connected) {
        setStatus("WALLET_REQUIRED");
        setWalletError("Casper Wallet connection was not approved.");
        return;
      }

      const activePublicKey = await provider.getActivePublicKey();
      setPublicKey(activePublicKey);
      setStatus("READY_FOR_TESTNET_RECORDING");
    } catch (error) {
      setStatus("WALLET_REQUIRED");
      setWalletError(
        error instanceof Error
          ? error.message
          : "Unable to connect Casper Wallet."
      );
    }
  }

  async function disconnectWallet() {
    const provider = getProvider();

    try {
      await provider?.disconnectFromSite();
    } finally {
      setPublicKey(null);
      setStatus("READY_FOR_TESTNET_RECORDING");
    }
  }

  async function prepareRecording() {
    const response = await fetch("/api/casper/prepare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prepareBody),
    });

    if (!response.ok) {
      throw new Error("Unable to prepare Casper payload.");
    }

    const preparedPayload = (await response.json()) as CasperPreparedTransaction;
    setPrepared(preparedPayload);
    return preparedPayload;
  }

  async function submitRecording(options: { demo: boolean }) {
    setIsBusy(true);
    setWalletError(null);
    setProof(null);

    try {
      const preparedPayload = prepared ?? (await prepareRecording());
      setStatus(options.demo ? "DEMO_PROOF" : "SUBMITTED");

      const response = await fetch("/api/casper/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prepared: preparedPayload,
          accountPublicKey: publicKey ?? undefined,
          forceDemo: options.demo,
        }),
      });

      if (!response.ok) {
        throw new Error("Casper recording submission failed.");
      }

      const result = (await response.json()) as CasperSubmitResponse;
      setProof(result);
      setStatus(result.status);

      if (!options.demo && result.mode !== "REAL") {
        setWalletError(
          "Real Testnet mode is not active on this server. Demo proof mode was recorded instead."
        );
      }
    } catch (error) {
      const preparedPayload = prepared ?? (await prepareRecording());
      const fallback = await fetch("/api/casper/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prepared: preparedPayload,
          accountPublicKey: publicKey ?? undefined,
          forceDemo: true,
        }),
      });

      if (fallback.ok) {
        const result = (await fallback.json()) as CasperSubmitResponse;
        setProof(result);
        setStatus(result.status);
        setWalletError(
          error instanceof Error
            ? error.message
            : "Real Testnet submission failed; demo proof was recorded."
        );
      } else {
        setStatus("FAILED");
        setWalletError(
          error instanceof Error
            ? error.message
            : "Casper recording failed."
        );
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function refreshStatus() {
    if (!proof) {
      return;
    }

    setIsBusy(true);

    try {
      const query = new URLSearchParams({
        transactionHash: proof.transactionHash,
        mode: proof.mode,
      });

      if (proof.contractHash) {
        query.set("contractHash", proof.contractHash);
      }

      const response = await fetch(`/api/casper/status?${query.toString()}`);

      if (!response.ok) {
        throw new Error("Unable to refresh Casper proof status.");
      }

      const result = (await response.json()) as { status: CasperRecordingStatus };
      setStatus(result.status);
    } catch (error) {
      setStatus("FAILED");
      setWalletError(
        error instanceof Error ? error.message : "Status check failed."
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card className="rounded-lg border-white/10 bg-white/[0.035] shadow-none">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
              <Link2 className="size-5" />
            </span>
            <div>
              <CardTitle>Casper Testnet recording</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Real Testnet deploy path with honest demo proof fallback.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`h-8 rounded-lg px-3 ${statusTone(status)}`}
          >
            <StatusIcon className="size-4" />
            {formatStatus(status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <FeaturedTestnetProof />

        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Wallet className="size-4 text-emerald-200" />
                  Casper Wallet
                </div>
                <Badge variant="outline" className="rounded-lg">
                  {walletConnected ? "Connected" : "Optional"}
                </Badge>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Network</span>
                  <span>Casper Testnet</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Mode</span>
                  <span>{displayMode}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Wallet key</span>
                  <span className="max-w-[220px] truncate text-right font-mono text-xs text-emerald-100">
                    {publicKey ?? "Not connected"}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Wallet connection is used to display the judge/founder account.
                The real deploy is submitted only when the server has a configured
                Casper Testnet contract hash and signing key path.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {walletConnected ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={disconnectWallet}
                  >
                    <PlugZap className="size-4" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={connectWallet}
                  >
                    <KeyRound className="size-4" />
                    Connect wallet
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigator.clipboard.writeText(props.decisionHash)
                  }
                >
                  <Copy className="size-4" />
                  Copy decision hash
                </Button>
              </div>
              {walletError ? (
                <p className="mt-3 text-xs leading-5 text-amber-100">
                  {walletError}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Button
                type="button"
                className="h-10"
                disabled={isBusy}
                onClick={() => submitRecording({ demo: false })}
              >
                {isBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                Submit real Testnet deploy
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                disabled={isBusy}
                onClick={() => submitRecording({ demo: true })}
              >
                {isBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                Record demo proof
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10"
                disabled={isBusy || !proof}
                onClick={refreshStatus}
              >
                Refresh confirmation status
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs uppercase text-muted-foreground">
                Decision hash
              </p>
              <p className="mt-2 break-all font-mono text-sm text-emerald-100">
                {props.decisionHash}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <ProofField label="Network" value="Casper Testnet" />
              <ProofField
                label="Verification status"
                value={formatStatus(status)}
              />
              <ProofField
                label="Contract hash"
                value={
                  proof?.contractHash ??
                  prepared?.contractHash ??
                  "Not configured"
                }
              />
              <ProofField
                label="Deploy hash"
                value={
                  proof?.deployHash ?? proof?.transactionHash ?? "Not submitted"
                }
              />
              <ProofField label="Project ID" value={props.projectId} />
              <ProofField label="Final score" value={`${props.finalScore}`} />
              <ProofField label="Timestamp" value={currentTimestamp} />
              <ProofField
                label="Payload hash"
                value={prepared?.payloadHash ?? "Prepared on submit"}
              />
            </div>

            {proof ? (
              <a
                href={proof.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100 transition hover:bg-emerald-300/15"
              >
                <span className="truncate">{proof.explorerUrl}</span>
                <ExternalLink className="size-4 shrink-0" />
              </a>
            ) : (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-muted-foreground">
                A real deploy hash and explorer link appear here only after the
                Casper Testnet RPC accepts the deploy. Demo proof mode is labeled
                separately and does not claim on-chain confirmation.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProofField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 truncate font-mono text-xs text-foreground">{value}</p>
    </div>
  );
}
