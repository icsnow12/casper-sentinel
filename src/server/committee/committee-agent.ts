import "server-only";

import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { env } from "@/lib/env";
import { buildMockAgentOutputs } from "@/server/agents/mock-data";
import type { AgentOutput } from "@/server/agents/schemas";
import { getOpenAIClient } from "@/server/agents/openai-client";

import {
  applyRiskCaps,
  buildAgentVotes,
  buildDemoDebateTranscript,
  calculateWeightedMetrics,
  identifyDisagreements,
  recommendationFromScore,
} from "./voting";
import {
  committeeOutputSchema,
  debateTranscriptItemSchema,
  disagreementSchema,
  type CommitteeOutput,
  type CommitteeRequest,
} from "./schemas";

const committeeNarrativeSchema = z.object({
  debateTranscript: z.array(debateTranscriptItemSchema).min(5),
  disagreements: z.array(disagreementSchema),
  summary: z.string().min(40),
});

function projectIdFor(input: CommitteeRequest) {
  return (
    input.projectId ??
    input.projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") ??
    "casper-sentinel-demo"
  );
}

function agentsFor(input: CommitteeRequest): AgentOutput[] {
  return (
    input.agents ??
    buildMockAgentOutputs({
      projectId: projectIdFor(input),
      projectName: input.projectName,
      category: "RWA",
      githubRepository: "https://github.com/casper-sentinel/demo-project",
      tokenSymbol: "CSPR",
      tokenNetwork: "Casper Testnet",
      whitepaper:
        "Demo committee review for Casper Sentinel autonomous VC DAO governance.",
    })
  );
}

function buildCommitteeContext(projectName: string, agents: AgentOutput[]) {
  return [
    `Project: ${projectName}`,
    "Agent outputs:",
    ...agents.map((agent) =>
      [
        `Agent: ${agent.agentType}`,
        `Summary: ${agent.summary}`,
        `Score: ${agent.score}`,
        `Confidence: ${agent.confidence}`,
        `Risk: ${agent.risk}`,
        `Recommendation: ${agent.recommendation}`,
        `Strengths: ${agent.strengths.join("; ")}`,
        `Concerns: ${agent.concerns.join("; ")}`,
        `Red flags: ${agent.redFlags.length ? agent.redFlags.join("; ") : "None"}`,
      ].join("\n")
    ),
  ].join("\n\n");
}

async function buildOpenAINarrative(projectName: string, agents: AgentOutput[]) {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  try {
    const response = await client.responses.parse({
      model: env.OPENAI_MODEL,
      instructions: [
        "You are the Investment Committee Agent for Casper Sentinel, an autonomous VC DAO.",
        "Create a concise debate transcript and identify material disagreements between five agent outputs.",
        "Do not create a final resolution or decision hash. Do not alter formal votes or numeric weights.",
        "Return only the requested structured output.",
      ].join("\n"),
      input: buildCommitteeContext(projectName, agents),
      max_output_tokens: 2200,
      text: {
        format: zodTextFormat(
          committeeNarrativeSchema,
          "committee_narrative"
        ),
      },
    });

    return response.output_parsed;
  } catch (error) {
    console.error("Committee Agent narrative failed; using demo narrative.", error);
    return null;
  }
}

export async function runCommittee(
  input: CommitteeRequest
): Promise<CommitteeOutput> {
  const projectId = projectIdFor(input);
  const agents = agentsFor(input);
  const votes = buildAgentVotes(agents);
  const metrics = calculateWeightedMetrics(votes);
  const preliminaryRecommendation = applyRiskCaps(
    recommendationFromScore(metrics.weightedScore),
    agents
  );
  const openAINarrative = await buildOpenAINarrative(input.projectName, agents);
  const debateTranscript =
    openAINarrative?.debateTranscript ??
    buildDemoDebateTranscript(agents, votes);
  const disagreements =
    openAINarrative?.disagreements ?? identifyDisagreements(agents);

  return committeeOutputSchema.parse({
    committeeId: `committee_${crypto.randomUUID()}`,
    projectId,
    projectName: input.projectName,
    mode: openAINarrative ? "openai" : "demo",
    generatedAt: new Date().toISOString(),
    debateTranscript,
    disagreements,
    votes,
    weightedScore: metrics.weightedScore,
    weightedConfidence: metrics.weightedConfidence,
    weightedRisk: metrics.weightedRisk,
    preliminaryRecommendation,
    summary:
      openAINarrative?.summary ??
      `The committee weights security highest and applies reputation-aware voting across all five agents. The resulting score is ${metrics.weightedScore}, with confidence ${metrics.weightedConfidence} and risk ${metrics.weightedRisk}, producing a preliminary ${preliminaryRecommendation} recommendation.`,
  });
}
