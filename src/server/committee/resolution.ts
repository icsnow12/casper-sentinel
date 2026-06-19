import "server-only";

import { createHash } from "node:crypto";

import { runCommittee } from "./committee-agent";
import {
  finalResolutionSchema,
  type CommitteeOutput,
  type DecisionPayload,
  type FinalResolution,
  type ResolutionRequest,
} from "./schemas";
import { formatRecommendation } from "./voting";

function stableStringify(value: unknown): string {
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

function buildConditions(committee: CommitteeOutput) {
  const conditions = new Set<string>();
  const voteByType = Object.fromEntries(
    committee.votes.map((vote) => [vote.agentType, vote])
  );

  if (voteByType.SECURITY?.risk >= 55) {
    conditions.add(
      "Complete independent security review of contracts, admin keys, and wallet signing flow before any capital deployment."
    );
  }

  if (voteByType.COMPLIANCE?.risk >= 50) {
    conditions.add(
      "Produce jurisdiction-aware compliance memo covering securities, AML, sanctions, and RWA enforceability assumptions."
    );
  }

  if (voteByType.TREASURY?.score < 80) {
    conditions.add(
      "Provide token supply, vesting, unlock, runway, and liquidity disclosures sufficient for DAO treasury sizing."
    );
  }

  if (voteByType.TECHNICAL?.confidence < 80) {
    conditions.add(
      "Publish implementation evidence including tests, deployment plan, monitoring strategy, and repository release history."
    );
  }

  for (const disagreement of committee.disagreements.slice(0, 2)) {
    conditions.add(`Resolve committee disagreement: ${disagreement.topic}.`);
  }

  while (conditions.size < 3) {
    conditions.add(
      "Maintain decision materials off-chain and verify the final payload hash before Casper Testnet recording."
    );
  }

  return Array.from(conditions).slice(0, 6);
}

function buildInvestmentMemo(committee: CommitteeOutput) {
  const recommendation = formatRecommendation(committee.preliminaryRecommendation);

  return [
    `${committee.projectName} receives a final ${recommendation} recommendation from the Casper Sentinel Investment Committee.`,
    `The weighted score is ${committee.weightedScore}, confidence is ${committee.weightedConfidence}, and risk is ${committee.weightedRisk}.`,
    "Security and compliance carry elevated governance influence, while agent trust scores adjust each vote to reflect demonstrated reliability.",
    committee.summary,
    "The DAO should treat this resolution as ready for hash anchoring, not as an executed Casper transaction.",
  ].join(" ");
}

export async function buildResolution(
  input: ResolutionRequest
): Promise<FinalResolution> {
  const committee =
    input.committee ??
    (await runCommittee({
      projectId: input.projectId,
      projectName: input.projectName,
      agents: input.agents,
    }));
  const generatedAt = new Date().toISOString();
  const decisionPayload: DecisionPayload = {
    projectId: committee.projectId,
    projectName: committee.projectName,
    committeeId: committee.committeeId,
    finalRecommendation: committee.preliminaryRecommendation,
    finalScore: committee.weightedScore,
    confidenceScore: committee.weightedConfidence,
    riskScore: committee.weightedRisk,
    agentVotes: committee.votes,
    generatedAt,
    casperStatus: "READY_FOR_TESTNET_RECORDING",
  };
  const decisionHash = sha256Hex(decisionPayload);

  return finalResolutionSchema.parse({
    resolutionId: `resolution_${crypto.randomUUID()}`,
    projectId: committee.projectId,
    projectName: committee.projectName,
    committeeId: committee.committeeId,
    mode: committee.mode,
    generatedAt,
    finalRecommendation: committee.preliminaryRecommendation,
    finalScore: committee.weightedScore,
    confidenceScore: committee.weightedConfidence,
    riskScore: committee.weightedRisk,
    investmentMemo: buildInvestmentMemo(committee),
    conditionsPrecedent: buildConditions(committee),
    decisionPayload,
    decisionHash,
    casperStatus: "READY_FOR_TESTNET_RECORDING",
  });
}
