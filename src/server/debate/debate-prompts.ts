import type { AgentOutput, AgentType } from "@/server/agents/schemas";
import { formatRecommendation } from "@/server/committee/voting";

import type { DebateAgentName } from "./debate-schemas";

export const debateAgentNames: Record<AgentType, DebateAgentName> = {
  TECHNICAL: "Technical",
  MARKET: "Market",
  SECURITY: "Security",
  COMPLIANCE: "Compliance",
  TREASURY: "Treasury",
};

export const debateChallengeTargets: Record<AgentType, AgentType> = {
  TECHNICAL: "MARKET",
  MARKET: "SECURITY",
  SECURITY: "COMPLIANCE",
  COMPLIANCE: "MARKET",
  TREASURY: "MARKET",
};

export const rebuttalTargets: Record<AgentType, AgentType> = {
  TECHNICAL: "TREASURY",
  MARKET: "SECURITY",
  SECURITY: "MARKET",
  COMPLIANCE: "MARKET",
  TREASURY: "TECHNICAL",
};

export function buildAgentSnapshot(agent: AgentOutput) {
  return [
    `Agent: ${debateAgentNames[agent.agentType]}`,
    `Recommendation: ${formatRecommendation(agent.recommendation)}`,
    `Score: ${agent.score}`,
    `Confidence: ${agent.confidence}`,
    `Risk: ${agent.risk}`,
    `Summary: ${agent.summary}`,
    `Strengths: ${agent.strengths.join("; ")}`,
    `Concerns: ${agent.concerns.join("; ")}`,
    `Red flags: ${agent.redFlags.length ? agent.redFlags.join("; ") : "None"}`,
    `Evidence: ${agent.evidence
      .map((item) => `${item.label} (${item.source})`)
      .join("; ")}`,
  ].join("\n");
}

export function buildDebateContext(
  projectName: string,
  agent: AgentOutput,
  agents: AgentOutput[]
) {
  const challengeTarget = debateChallengeTargets[agent.agentType];

  return [
    `Project: ${projectName}`,
    `Debating agent: ${debateAgentNames[agent.agentType]}`,
    `Required challenge target: ${debateAgentNames[challengeTarget]}`,
    "Your own evaluation:",
    buildAgentSnapshot(agent),
    "Other agent recommendations:",
    ...agents
      .filter((item) => item.agentType !== agent.agentType)
      .map((item) =>
        [
          `${debateAgentNames[item.agentType]}: ${formatRecommendation(
            item.recommendation
          )}`,
          `Score ${item.score}, confidence ${item.confidence}, risk ${item.risk}`,
          `Core concern: ${item.concerns[0]}`,
        ].join(" | ")
      ),
  ].join("\n\n");
}

export function buildDebateAgentInstructions(agent: AgentOutput) {
  const challengeTarget = debateChallengeTargets[agent.agentType];

  return [
    "You are participating in the Casper Sentinel AI Committee Debate Engine.",
    `You speak as the ${debateAgentNames[agent.agentType]} Agent.`,
    "Defend your own recommendation, challenge exactly one other agent, cite evidence from the provided evaluation, and assign a confidence score.",
    `Your challengeTarget must be ${debateAgentNames[challengeTarget]}.`,
    "Use direct investment-committee language for a Web3/RWA VC DAO.",
    "Return only the requested structured JSON shape.",
  ].join("\n");
}

export function buildSynthesisContext(
  projectName: string,
  agents: AgentOutput[],
  debateRounds: string
) {
  return [
    `Project: ${projectName}`,
    "Original agent evaluations:",
    ...agents.map(buildAgentSnapshot),
    "First debate round:",
    debateRounds,
  ].join("\n\n");
}

export const synthesisInstructions = [
  "You are the chair of the Casper Sentinel AI Committee Debate Engine.",
  "Generate exactly five rebuttals, one from each agent, then synthesize consensus.",
  "Rebuttals must sound like a serious autonomous investment DAO committee.",
  "Consensus must name agreement points, disagreement points, the dominant concern, the dominant opportunity, and a 0-100 consensus score.",
  "Do not produce a Casper transaction or proof payload.",
  "Return only the requested structured JSON shape.",
].join("\n");
