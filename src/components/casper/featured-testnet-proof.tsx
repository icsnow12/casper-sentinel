import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export const FEATURED_TESTNET_PROOF = {
  deployHash:
    "3b9a6bccffbc4d1a9972973cb469c038be903a4c452abf1d38136e803b9cfce6",
  explorerUrl:
    "https://testnet.cspr.live/transaction/3b9a6bccffbc4d1a9972973cb469c038be903a4c452abf1d38136e803b9cfce6",
  caller:
    "02034b5cccf5c4276ce33c7deddb067392530e2b115862c3a179f55f9349fa45cd22",
  payment: "100 CSPR",
  consumedGas: "65.29352 CSPR",
  chargedAmount: "73.97014 CSPR",
} as const;

export function FeaturedTestnetProof() {
  return (
    <section className="rounded-lg border border-emerald-300/25 bg-emerald-300/[0.055] p-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-300/10 text-emerald-100">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">
                Verified real Testnet proof
              </h3>
              <Badge className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 text-emerald-100">
                <CheckCircle2 className="size-4" />
                Success
              </Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Casper Sentinel governance contract deployment executed on Casper
              Testnet. This is a public on-chain transaction, not a mock receipt.
            </p>
          </div>
        </div>
        <a
          href={FEATURED_TESTNET_PROOF.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15"
        >
          View on CSPR.live
          <ExternalLink className="size-4" />
        </a>
      </div>

      <div className="mt-4 border-t border-emerald-300/15 pt-4">
        <p className="text-xs uppercase text-muted-foreground">Deploy hash</p>
        <p className="mt-2 break-all font-mono text-sm text-emerald-100">
          {FEATURED_TESTNET_PROOF.deployHash}
        </p>
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-4 border-t border-emerald-300/15 pt-4 sm:grid-cols-2 xl:grid-cols-4">
        <ProofMetric label="Network" value="Casper Testnet" />
        <ProofMetric
          label="Transaction payment"
          value={FEATURED_TESTNET_PROOF.payment}
        />
        <ProofMetric
          label="Consumed gas"
          value={FEATURED_TESTNET_PROOF.consumedGas}
        />
        <ProofMetric
          label="Charged amount"
          value={FEATURED_TESTNET_PROOF.chargedAmount}
        />
      </div>

      <div className="mt-4 border-t border-emerald-300/15 pt-4">
        <p className="text-xs uppercase text-muted-foreground">Caller</p>
        <p className="mt-2 break-all font-mono text-xs text-foreground">
          {FEATURED_TESTNET_PROOF.caller}
        </p>
      </div>
    </section>
  );
}

function ProofMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}
