import type { AgentOutput, AgentType, Recommendation } from "@/server/agents/schemas";

import type {
  AgentVote,
  DebateTranscriptItem,
  Disagreement,
} from "./schemas";

export const agentNames: Record<AgentType, string> = {
  TECHNICAL: "Technical Agent",
  MARKET: "Market Agent",
  SECURITY: "Security Agent",
  COMPLIANCE: "Compliance Agent",
  TREASURY: "Treasury Agent",
};

export const baseScoreWeights: Record<AgentType, number> = {
  TECHNICAL: 0.2,
  MARKET: 0.15,
  SECURITY: 0.25,
  COMPLIANCE: 0.2,
  TREASURY: 0.2,
};

export const demoTrustScores: Record<AgentType, number> = {
  TECHNICAL: 86,
  MARKET: 78,
  SECURITY: 91,
  COMPLIANCE: 84,
  TREASURY: 81,
};

export const recommendationValues: Record<Recommendation, number> = {
  STRONG_PASS: 10,
  PASS: 25,
  WATCHLIST: 45,
  DILIGENCE_REQUIRED: 60,
  INVEST_SMALL: 72,
  INVEST: 84,
  HIGH_CONVICTION_INVEST: 95,
};

const recommendationOrder: Recommendation[] = [
  "STRONG_PASS",
  "PASS",
  "WATCHLIST",
  "DILIGENCE_REQUIRED",
  "INVEST_SMALL",
  "INVEST",
  "HIGH_CONVICTION_INVEST",
];

export function recommendationFromScore(score: number): Recommendation {
  if (score < 20) {
    return "STRONG_PASS";
  }
  if (score < 40) {
    return "PASS";
  }
  if (score < 55) {
    return "WATCHLIST";
  }
  if (score < 67) {
    return "DILIGENCE_REQUIRED";
  }
  if (score < 78) {
    return "INVEST_SMALL";
  }
  if (score < 88) {
    return "INVEST";
  }
  return "HIGH_CONVICTION_INVEST";
}

export function capRecommendation(
  recommendation: Recommendation,
  cap: Recommendation
) {
  const candidateIndex = recommendationOrder.indexOf(recommendation);
  const capIndex = recommendationOrder.indexOf(cap);

  return recommendationOrder[Math.min(candidateIndex, capIndex)];
}

export function buildAgentVotes(agents: AgentOutput[]): AgentVote[] {
  const rawVotes = agents.map((agent) => {
    const trustScore = demoTrustScores[agent.agentType];
    const baseWeight = baseScoreWeights[agent.agentType];
    const reputationMultiplier = trustScore / 100;
    const finalWeight = Number((baseWeight * reputationMultiplier).toFixed(4));

    return {
      agentType: agent.agentType,
      agentName: agentNames[agent.agentType],
      vote: agent.recommendation,
      voteValue: recommendationValues[agent.recommendation],
      baseWeight,
      trustScore,
      reputationMultiplier: Number(reputationMultiplier.toFixed(2)),
      finalWeight,
      normalizedWeight: 0,
      score: agent.score,
      confidence: agent.confidence,
      risk: agent.risk,
      rationale: `${agentNames[agent.agentType]} voted ${formatRecommendation(agent.recommendation)} with score ${agent.score}, confidence ${agent.confidence}, and risk ${agent.risk}.`,
    };
  });

  const totalWeight = rawVotes.reduce((total, vote) => total + vote.finalWeight, 0);

  return rawVotes.map((vote) => ({
    ...vote,
    normalizedWeight: Number((vote.finalWeight / totalWeight).toFixed(4)),
  }));
}

export function calculateWeightedMetrics(votes: AgentVote[]) {
  const weightedScore = Math.round(
    votes.reduce((total, vote) => total + vote.score * vote.normalizedWeight, 0)
  );
  const weightedConfidence = Math.round(
    votes.reduce(
      (total, vote) => total + vote.confidence * vote.normalizedWeight,
      0
    )
  );
  const weightedRisk = Math.round(
    votes.reduce((total, vote) => total + vote.risk * vote.normalizedWeight, 0)
  );

  return {
    weightedScore,
    weightedConfidence,
    weightedRisk,
  };
}

export function applyRiskCaps(
  recommendation: Recommendation,
  agents: AgentOutput[]
) {
  const security = agents.find((agent) => agent.agentType === "SECURITY");
  const compliance = agents.find((agent) => agent.agentType === "COMPLIANCE");

  let capped = recommendation;

  if (security && (security.risk >= 75 || security.redFlags.length >= 2)) {
    capped = capRecommendation(capped, "DILIGENCE_REQUIRED");
  }

  if (compliance && (compliance.risk >= 75 || compliance.redFlags.length >= 2)) {
    capped = capRecommendation(capped, "DILIGENCE_REQUIRED");
  }

  return capped;
}

export function identifyDisagreements(agents: AgentOutput[]): Disagreement[] {
  const disagreements: Disagreement[] = [];
  const market = agents.find((agent) => agent.agentType === "MARKET");
  const security = agents.find((agent) => agent.agentType === "SECURITY");
  const compliance = agents.find((agent) => agent.agentType === "COMPLIANCE");
  const treasury = agents.find((agent) => agent.agentType === "TREASURY");
  const technical = agents.find((agent) => agent.agentType === "TECHNICAL");

  if (market && security && market.score - security.score >= 10) {
    disagreements.push({
      topic: "Growth upside versus exploit risk",
      agents: ["MARKET", "SECURITY"],
      severity: security.risk >= 60 ? "high" : "medium",
      summary:
        "The Market Agent sees a stronger investment signal than the Security Agent, which is applying a higher risk discount for audit and custody gaps.",
    });
  }

  if (market && compliance && market.score - compliance.score >= 8) {
    disagreements.push({
      topic: "Market timing versus regulatory readiness",
      agents: ["MARKET", "COMPLIANCE"],
      severity: compliance.risk >= 60 ? "high" : "medium",
      summary:
        "The opportunity appears commercially attractive, but compliance evidence is not yet strong enough to support an unconstrained investment decision.",
    });
  }

  if (technical && treasury && Math.abs(technical.score - treasury.score) >= 8) {
    disagreements.push({
      topic: "Build quality versus capital readiness",
      agents: ["TECHNICAL", "TREASURY"],
      severity: "medium",
      summary:
        "The technical plan is more mature than the treasury disclosure package, creating a sizing gap for the DAO.",
    });
  }

  if (!disagreements.length) {
    disagreements.push({
      topic: "Investment sizing",
      agents: ["TECHNICAL", "MARKET", "SECURITY", "COMPLIANCE", "TREASURY"],
      severity: "low",
      summary:
        "Agents broadly agree the project merits review, but differ on how much capital the DAO should commit before additional diligence.",
    });
  }

  return disagreements;
}

export function buildDemoDebateTranscript(
  agents: AgentOutput[],
  votes: AgentVote[]
): DebateTranscriptItem[] {
  const byType = Object.fromEntries(
    agents.map((agent) => [agent.agentType, agent])
  ) as Record<AgentType, AgentOutput>;
  const voteByType = Object.fromEntries(
    votes.map((vote) => [vote.agentType, vote])
  ) as Record<AgentType, AgentVote>;

  return [
    {
      speaker: "COMMITTEE",
      title: "Committee chair opens weighted review",
      message:
        "The committee will weight domain scores by mandate and reputation, then preserve every agent vote for governance auditability.",
      stance: "moderating",
    },
    {
      speaker: "TECHNICAL",
      title: "Architecture signal",
      message: `${byType.TECHNICAL.summary} Vote weight resolves to ${(voteByType.TECHNICAL.normalizedWeight * 100).toFixed(1)}% after reputation adjustment.`,
      stance: byType.TECHNICAL.score >= 70 ? "supportive" : "cautious",
    },
    {
      speaker: "MARKET",
      title: "Demand and category timing",
      message: `${byType.MARKET.summary} The market vote is constructive but receives the smallest base domain weight at 15%.`,
      stance: byType.MARKET.score >= 75 ? "supportive" : "cautious",
    },
    {
      speaker: "SECURITY",
      title: "Risk control checkpoint",
      message: `${byType.SECURITY.summary} Security carries the largest base weight at 25%, so unresolved audit concerns materially affect the final score.`,
      stance: byType.SECURITY.risk >= 60 ? "opposed" : "cautious",
    },
    {
      speaker: "COMPLIANCE",
      title: "Regulatory readiness",
      message: `${byType.COMPLIANCE.summary} Compliance requires conditions precedent before the DAO treats this as execution-ready.`,
      stance: byType.COMPLIANCE.risk >= 55 ? "cautious" : "supportive",
    },
    {
      speaker: "TREASURY",
      title: "Capital sizing",
      message: `${byType.TREASURY.summary} Treasury recommends sizing discipline until unlock, liquidity, and runway data are complete.`,
      stance: byType.TREASURY.score >= 75 ? "supportive" : "cautious",
    },
    {
      speaker: "COMMITTEE",
      title: "Chair closes agent vote",
      message:
        "The final resolution should reflect investability with conditions, not automatic execution. Casper Testnet recording can proceed once the DAO approves the hash.",
      stance: "moderating",
    },
  ];
}

export function formatRecommendation(recommendation: Recommendation) {
  return recommendation
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
