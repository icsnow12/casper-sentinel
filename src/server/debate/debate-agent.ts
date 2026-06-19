import "server-only";

import { zodTextFormat } from "openai/helpers/zod";

import { env } from "@/lib/env";
import { getOpenAIClient } from "@/server/agents/openai-client";
import type { AgentOutput, AgentType, Recommendation } from "@/server/agents/schemas";
import { formatRecommendation } from "@/server/committee/voting";

import {
  buildDebateAgentInstructions,
  buildDebateContext,
  debateAgentNames,
  debateChallengeTargets,
} from "./debate-prompts";
import {
  debateRoundSchema,
  type DebateRiskLevel,
  type DebateRound,
  type DebateStance,
} from "./debate-schemas";

type DebateAgentRoundInput = {
  projectName: string;
  agent: AgentOutput;
  agents: AgentOutput[];
};

type DebateAgentRoundResult = {
  round: DebateRound;
  mode: "openai" | "demo";
};

function stanceForRecommendation(recommendation: Recommendation): DebateStance {
  if (recommendation === "STRONG_PASS" || recommendation === "PASS") {
    return "Reject";
  }

  if (
    recommendation === "INVEST_SMALL" ||
    recommendation === "INVEST" ||
    recommendation === "HIGH_CONVICTION_INVEST"
  ) {
    return "Approve";
  }

  return "Diligence Required";
}

function riskLevelForScore(risk: number): DebateRiskLevel {
  if (risk >= 58) {
    return "HIGH";
  }

  if (risk >= 38) {
    return "MEDIUM";
  }

  return "LOW";
}

function confidenceFor(agent: AgentOutput) {
  const conviction = agent.confidence * 0.72 + agent.score * 0.18 + (100 - agent.risk) * 0.1;

  return Math.max(52, Math.min(94, Math.round(conviction)));
}

function firstEvidence(agent: AgentOutput) {
  const evidence = agent.evidence[0];
  const excerpt = evidence.excerpt ? `: ${evidence.excerpt}` : "";

  return `${evidence.label} (${evidence.source})${excerpt}`;
}

function buildAgentArgument(
  agent: AgentOutput,
  target: AgentOutput,
  projectName: string
) {
  const stance = stanceForRecommendation(agent.recommendation);
  const recommendation = formatRecommendation(agent.recommendation);
  const targetName = debateAgentNames[target.agentType];

  const templates: Record<AgentType, string> = {
    TECHNICAL: `I defend a ${stance} stance because ${projectName} has a coherent architecture signal, but engineering proof still controls valuation. The ${recommendation} vote reflects a path to deployment only if tests, release history, monitoring, and Casper integration details catch up to the narrative. ${targetName} should not convert buyer excitement into execution certainty before implementation evidence is visible.`,
    MARKET: `I defend a ${stance} stance because the category signal is stronger than a generic diligence-tool pitch: venture teams, DAOs, and RWA allocators need auditable review workflows now. The ${recommendation} vote is not a blank check, but the commercial window is real enough that risk controls should shape sizing instead of stopping the process. ${targetName} is right to price control gaps, but not to erase the market timing advantage.`,
    SECURITY: `I defend a ${stance} stance because governance systems fail fastest when signing, custody, upgrade, and contract assumptions are vague. The ${recommendation} vote protects the DAO from treating a hashable decision trail as proof that the underlying protocol is safe. ${targetName} must show that policy language is backed by enforceable technical controls.`,
    COMPLIANCE: `I defend a ${stance} stance because this can remain a diligence-support tool only if investment language, RWA provenance, sanctions screening, and jurisdiction controls are explicit. The ${recommendation} vote keeps the opportunity alive while preventing the DAO from presenting model output as unconstrained financial advice. ${targetName} needs evidence that demand can be won without outrunning regulatory readiness.`,
    TREASURY: `I defend a ${stance} stance because capital allocation needs token supply, vesting, unlocks, liquidity, runway, and downside sizing before the DAO commits serious treasury exposure. The ${recommendation} vote is constructive but capped: governance quality matters only if the allocation can survive adverse liquidity and insider-unlock scenarios. ${targetName} must translate growth upside into a disciplined entry size.`,
  };

  return templates[agent.agentType];
}

function buildAgentChallenge(agent: AgentOutput, target: AgentOutput) {
  const targetName = debateAgentNames[target.agentType];
  const templates: Record<AgentType, string> = {
    TECHNICAL: `${targetName} is overweighting demand before the repository, deployment plan, and testing surface prove that the product can support institutional diligence workflows.`,
    MARKET: `${targetName} is treating remediable controls as if they permanently eliminate a category opportunity that could be captured through staged investment and conditions precedent.`,
    SECURITY: `${targetName} is assuming policy controls can compensate for missing wallet, admin-key, incident-response, and contract-audit evidence.`,
    COMPLIANCE: `${targetName} is not yet proving that growth can be acquired without creating advice, issuer, or RWA counterparty exposure for the DAO.`,
    TREASURY: `${targetName} is presenting upside without enough token, runway, unlock, and liquidity evidence to size capital responsibly.`,
  };

  return templates[agent.agentType];
}

function buildAgentEvidence(agent: AgentOutput) {
  const redFlag = agent.redFlags[0]
    ? ` Red flag tracked: ${agent.redFlags[0]}`
    : "";

  return `${firstEvidence(agent)}. Key concern: ${agent.concerns[0]}${redFlag}`;
}

export function buildMockDebateRound(
  projectName: string,
  agent: AgentOutput,
  agents: AgentOutput[]
): DebateRound {
  const challengeTargetType = debateChallengeTargets[agent.agentType];
  const target =
    agents.find((item) => item.agentType === challengeTargetType) ?? agent;

  return debateRoundSchema.parse({
    agentType: agent.agentType,
    agent: debateAgentNames[agent.agentType],
    stance: stanceForRecommendation(agent.recommendation),
    confidence: confidenceFor(agent),
    challengeTarget: debateAgentNames[challengeTargetType],
    argument: buildAgentArgument(agent, target, projectName),
    challenge: buildAgentChallenge(agent, target),
    evidence: buildAgentEvidence(agent),
    riskLevel: riskLevelForScore(agent.risk),
  });
}

export async function runDebateAgentRound(
  input: DebateAgentRoundInput
): Promise<DebateAgentRoundResult> {
  const client = getOpenAIClient();

  if (!client) {
    return {
      round: buildMockDebateRound(input.projectName, input.agent, input.agents),
      mode: "demo",
    };
  }

  try {
    const response = await client.responses.parse({
      model: env.OPENAI_MODEL,
      instructions: buildDebateAgentInstructions(input.agent),
      input: buildDebateContext(input.projectName, input.agent, input.agents),
      max_output_tokens: 1200,
      text: {
        format: zodTextFormat(
          debateRoundSchema,
          `${input.agent.agentType.toLowerCase()}_debate_round`
        ),
      },
    });

    const parsed = response.output_parsed;

    if (!parsed) {
      throw new Error("Debate agent did not return parseable output.");
    }

    return {
      round: debateRoundSchema.parse({
        ...parsed,
        agentType: input.agent.agentType,
        agent: debateAgentNames[input.agent.agentType],
        challengeTarget:
          debateAgentNames[debateChallengeTargets[input.agent.agentType]],
      }),
      mode: "openai",
    };
  } catch (error) {
    console.error(
      `${debateAgentNames[input.agent.agentType]} debate failed; using demo fallback.`,
      error
    );

    return {
      round: buildMockDebateRound(input.projectName, input.agent, input.agents),
      mode: "demo",
    };
  }
}
