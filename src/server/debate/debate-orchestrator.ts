import "server-only";

import { zodTextFormat } from "openai/helpers/zod";

import { env } from "@/lib/env";
import { buildMockAgentOutputs } from "@/server/agents/mock-data";
import type { AgentOutput, AgentType } from "@/server/agents/schemas";
import { getOpenAIClient } from "@/server/agents/openai-client";
import {
  applyRiskCaps,
  buildAgentVotes,
  calculateWeightedMetrics,
  formatRecommendation,
  recommendationFromScore,
} from "@/server/committee/voting";

import { runDebateAgentRound } from "./debate-agent";
import {
  buildSynthesisContext,
  debateAgentNames,
  rebuttalTargets,
  synthesisInstructions,
} from "./debate-prompts";
import {
  debateOutputSchema,
  debateSynthesisSchema,
  type DebateConsensus,
  type DebateFinalRecommendation,
  type DebateFinalScore,
  type DebateOutput,
  type DebateRebuttal,
  type DebateRequest,
  type DebateRound,
  type DebateSynthesis,
} from "./debate-schemas";

function projectNameFor(input: DebateRequest) {
  return (
    input.projectName ??
    input.projectId
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") ??
    "Casper Sentinel Demo"
  );
}

function agentsFor(input: DebateRequest): AgentOutput[] {
  const projectName = projectNameFor(input);

  return (
    input.agents ??
    buildMockAgentOutputs({
      projectId: input.projectId,
      projectName,
      category: "RWA",
      githubRepository: "https://github.com/casper-sentinel/demo-project",
      tokenSymbol: "CSPR",
      tokenNetwork: "Casper Testnet",
      whitepaper:
        "Demo debate review for Casper Sentinel autonomous VC DAO governance.",
    })
  );
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function byType<T extends { agentType: AgentType }>(items: T[]) {
  return Object.fromEntries(
    items.map((item) => [item.agentType, item])
  ) as Record<AgentType, T>;
}

function buildMockRebuttals(
  agents: AgentOutput[],
  rounds: DebateRound[]
): DebateRebuttal[] {
  const agentsByType = byType(agents);
  const roundsByType = byType(rounds);
  const baseRebuttals: DebateRebuttal[] = [
    {
      agentType: "TECHNICAL",
      agent: "Technical",
      responseTo: debateAgentNames[rebuttalTargets.TECHNICAL],
      rebuttal:
        "Required implementation effort is moderate, not fatal. The missing proof is concrete: tests, deployment history, and monitoring can be requested as diligence artifacts before the DAO sizes exposure.",
      resolution:
        "Proceed only if engineering evidence is added to the investment packet and reviewed before any post-resolution funding gate.",
    },
    {
      agentType: "MARKET",
      agent: "Market",
      responseTo: debateAgentNames[rebuttalTargets.MARKET],
      rebuttal:
        "Revenue growth and workflow urgency can offset governance concerns when the DAO uses staged capital, explicit conditions, and a limited initial allocation instead of binary approval.",
      resolution:
        "Keep the opportunity alive with a capped allocation path tied to named customer proof and security milestones.",
    },
    {
      agentType: "SECURITY",
      agent: "Security",
      responseTo: debateAgentNames[rebuttalTargets.SECURITY],
      rebuttal:
        "The market upside does not justify governance risks until audit scope, signing controls, admin-key policy, and incident response are explicit enough to protect the DAO.",
      resolution:
        "Downgrade any approval into diligence required unless security controls are verified before the Casper-recorded decision is treated as investable.",
    },
    {
      agentType: "COMPLIANCE",
      agent: "Compliance",
      responseTo: debateAgentNames[rebuttalTargets.COMPLIANCE],
      rebuttal:
        "Distribution momentum must not outrun regulatory framing. RWA provenance, sanctions screening, and investment-language controls are part of the product risk, not after-the-fact paperwork.",
      resolution:
        "Require a jurisdiction-aware compliance memo and restrict recommendation language before this advances beyond committee review.",
    },
    {
      agentType: "TREASURY",
      agent: "Treasury",
      responseTo: debateAgentNames[rebuttalTargets.TREASURY],
      rebuttal:
        "A credible build still needs a treasury answer. Token supply, unlocks, runway, liquidity, and downside scenarios determine whether this is watchlist, small check, or full approval.",
      resolution:
        "Use a staged investment ceiling until the token and runway disclosures support a quantified allocation model.",
    },
  ];

  return baseRebuttals.map((rebuttal) => {
    const agent = agentsByType[rebuttal.agentType];
    const round = roundsByType[rebuttal.agentType];

    return {
      ...rebuttal,
      rebuttal: `${rebuttal.rebuttal} Current signal: score ${agent.score}, risk ${agent.risk}, stance ${round.stance.toLowerCase()}.`,
    };
  });
}

function buildMockConsensus(
  projectName: string,
  agents: AgentOutput[],
  rounds: DebateRound[]
): DebateConsensus {
  const averageScore =
    agents.reduce((total, agent) => total + agent.score, 0) / agents.length;
  const averageRisk =
    agents.reduce((total, agent) => total + agent.risk, 0) / agents.length;
  const scoreSpread =
    Math.max(...agents.map((agent) => agent.score)) -
    Math.min(...agents.map((agent) => agent.score));
  const highRiskRounds = rounds.filter((round) => round.riskLevel === "HIGH").length;
  const finalConsensusScore = clampScore(
    averageScore - averageRisk * 0.22 - scoreSpread * 0.35 - highRiskRounds * 3 + 10
  );
  const security = agents.find((agent) => agent.agentType === "SECURITY");
  const market = agents.find((agent) => agent.agentType === "MARKET");
  const treasury = agents.find((agent) => agent.agentType === "TREASURY");

  return {
    agreementPoints: [
      `${projectName} has enough signal to justify committee-level diligence rather than immediate dismissal.`,
      "All agents support preserving the decision trail and evidence off-chain while anchoring only verified hashes.",
      "Security, compliance, and treasury conditions should gate any capital deployment after the debate.",
    ],
    disagreementPoints: [
      "Market views category timing as strong enough for a staged investment, while Security discounts the opportunity until control evidence improves.",
      "Compliance and Market disagree on how much recommendation language can be used before jurisdiction controls are defined.",
      "Technical and Treasury diverge on whether implementation credibility is enough without token, runway, and liquidity disclosures.",
    ],
    finalConsensusScore,
    dominantConcern:
      security?.concerns[0] ??
      treasury?.concerns[0] ??
      "Governance and allocation controls remain under-specified.",
    dominantOpportunity:
      market?.strengths[0] ??
      "Auditable AI diligence can become a differentiated VC DAO workflow.",
  };
}

async function buildOpenAISynthesis(
  projectName: string,
  agents: AgentOutput[],
  debateRounds: DebateRound[]
): Promise<DebateSynthesis | null> {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  try {
    const response = await client.responses.parse({
      model: env.OPENAI_MODEL,
      instructions: synthesisInstructions,
      input: buildSynthesisContext(
        projectName,
        agents,
        JSON.stringify(debateRounds, null, 2)
      ),
      max_output_tokens: 1800,
      text: {
        format: zodTextFormat(debateSynthesisSchema, "debate_synthesis"),
      },
    });

    return response.output_parsed ?? null;
  } catch (error) {
    console.error("Debate synthesis failed; using demo fallback.", error);
    return null;
  }
}

function recommendationForFinalScore(
  score: number,
  consensus: DebateConsensus,
  rounds: DebateRound[]
): DebateFinalRecommendation {
  const highRiskCount = rounds.filter((round) => round.riskLevel === "HIGH").length;

  if (score >= 75 && consensus.finalConsensusScore >= 65 && highRiskCount < 2) {
    return "APPROVE";
  }

  if (score < 50 || consensus.finalConsensusScore < 45) {
    return "REJECT";
  }

  return "DILIGENCE_REQUIRED";
}

function buildFinalScore(
  consensus: DebateConsensus,
  rounds: DebateRound[],
  votes: ReturnType<typeof buildAgentVotes>
): DebateFinalScore {
  const roundsByType = byType(rounds);
  const weightedVote = clampScore(
    votes.reduce(
      (total, vote) => total + vote.voteValue * vote.normalizedWeight,
      0
    )
  );
  const agentConfidence = clampScore(
    votes.reduce(
      (total, vote) =>
        total + roundsByType[vote.agentType].confidence * vote.normalizedWeight,
      0
    )
  );
  const reputationTrust = clampScore(
    votes.reduce(
      (total, vote) => total + vote.trustScore * vote.normalizedWeight,
      0
    )
  );
  const debateConsensus = consensus.finalConsensusScore;
  const score = clampScore(
    weightedVote * 0.4 +
      debateConsensus * 0.3 +
      agentConfidence * 0.2 +
      reputationTrust * 0.1
  );
  const recommendation = recommendationForFinalScore(score, consensus, rounds);

  return {
    score,
    recommendation,
    components: {
      weightedVote,
      debateConsensus,
      agentConfidence,
      reputationTrust,
    },
    reasoning: [
      `Phase 6 score blends weighted votes (${weightedVote}), debate consensus (${debateConsensus}), agent confidence (${agentConfidence}), and reputation trust (${reputationTrust}).`,
      recommendation === "APPROVE"
        ? "The committee can support approval because consensus and trust are high enough to absorb residual risk."
        : recommendation === "REJECT"
          ? "The committee should reject because debate consensus or vote conviction is too weak for DAO capital."
          : "The committee should require diligence because the opportunity remains credible but security, compliance, or treasury conditions still gate capital deployment.",
    ].join(" "),
  };
}

export async function runDebate(input: DebateRequest): Promise<DebateOutput> {
  const projectName = projectNameFor(input);
  const agents = agentsFor(input);
  const votes = buildAgentVotes(agents);
  const metrics = calculateWeightedMetrics(votes);
  const preliminaryRecommendation = applyRiskCaps(
    recommendationFromScore(metrics.weightedScore),
    agents
  );

  const roundResults = await Promise.all(
    agents.map((agent) =>
      runDebateAgentRound({
        projectName,
        agent,
        agents,
      })
    )
  );
  const debateRounds = roundResults.map((result) => result.round);
  const openAISynthesis = await buildOpenAISynthesis(
    projectName,
    agents,
    debateRounds
  );
  const rebuttals =
    openAISynthesis?.rebuttals ?? buildMockRebuttals(agents, debateRounds);
  const consensus =
    openAISynthesis?.consensus ??
    buildMockConsensus(projectName, agents, debateRounds);
  const finalScore = buildFinalScore(consensus, debateRounds, votes);
  const mode =
    openAISynthesis &&
    roundResults.every((result) => result.mode === "openai")
      ? "openai"
      : "demo";

  return debateOutputSchema.parse({
    debateId: `debate_${crypto.randomUUID()}`,
    projectId: input.projectId,
    projectName,
    mode,
    generatedAt: new Date().toISOString(),
    debateRounds,
    rebuttals,
    consensus,
    finalScore,
    votes,
    preliminaryRecommendation,
  });
}

export function formatDebateRecommendation(
  recommendation: DebateFinalRecommendation
) {
  return recommendation === "DILIGENCE_REQUIRED"
    ? "Diligence Required"
    : recommendation.charAt(0) + recommendation.slice(1).toLowerCase();
}

export { formatRecommendation };
