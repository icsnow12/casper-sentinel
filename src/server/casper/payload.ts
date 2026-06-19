import "server-only";

import { createHash } from "node:crypto";

import {
  casperPreparedTransactionSchema,
  type CasperOnchainPayload,
  type CasperPrepareRequest,
  type CasperPreparedTransaction,
} from "./schemas";

export const CASPER_TESTNET = {
  network: "Casper Testnet",
  chainName: "casper-test",
  explorerBaseUrl: "https://testnet.cspr.live/transaction",
} as const;

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function sha256Hex(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function buildCanonicalCasperPayload(
  input: CasperPrepareRequest
): CasperOnchainPayload {
  return {
    projectId: input.projectId,
    proposalId: input.proposalId ?? input.projectId,
    recommendation: input.recommendation,
    finalScore: input.finalScore,
    confidenceScore: input.confidenceScore,
    riskScore: input.riskScore,
    decisionHash: input.decisionHash,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };
}

export function buildPreparedTransaction(
  input: CasperPrepareRequest,
  mode: "REAL" | "DEMO" = "REAL"
): CasperPreparedTransaction {
  const payload = buildCanonicalCasperPayload(input);
  const payloadHash = sha256Hex(payload);

  return casperPreparedTransactionSchema.parse({
    mode,
    network: CASPER_TESTNET.network,
    chainName: CASPER_TESTNET.chainName,
    payload,
    payloadHash,
    status: "READY_FOR_TESTNET_RECORDING",
    signingMessage: [
      "Casper Sentinel DAO Resolution",
      `Project: ${payload.projectId}`,
      `Proposal: ${payload.proposalId}`,
      `Recommendation: ${payload.recommendation}`,
      `Decision hash: ${payload.decisionHash}`,
      `Payload hash: ${payloadHash}`,
      `Timestamp: ${payload.timestamp}`,
    ].join("\n"),
    preparedAt: new Date().toISOString(),
  });
}

export function buildExplorerUrl(transactionHash: string) {
  return `${CASPER_TESTNET.explorerBaseUrl}/${transactionHash}`;
}

export function buildDemoTransactionHash(seed: unknown) {
  return sha256Hex({
    kind: "casper-sentinel-demo-transaction",
    seed,
  });
}
