import "server-only";

import { zodTextFormat } from "openai/helpers/zod";

import { env } from "@/lib/env";

import { buildMockAgentOutput } from "./mock-data";
import {
  buildAgentInstructions,
  buildProjectContext,
  type AgentDefinition,
} from "./prompts";
import {
  agentOutputSchema,
  type AgentOutput,
  type EvaluationRequest,
} from "./schemas";
import { getOpenAIClient } from "./openai-client";

export type AgentRunMode = "openai" | "demo";

export type AgentRunResult = {
  mode: AgentRunMode;
  output: AgentOutput;
};

export async function runAgent(
  agent: AgentDefinition,
  input: EvaluationRequest
): Promise<AgentRunResult> {
  const client = getOpenAIClient();

  if (!client) {
    return {
      mode: "demo",
      output: buildMockAgentOutput(agent.type, input),
    };
  }

  try {
    const response = await client.responses.parse({
      model: env.OPENAI_MODEL,
      instructions: buildAgentInstructions(agent),
      input: [
        "Analyze the following project for the Casper Sentinel investment DAO.",
        "Return a complete assessment for your agent only.",
        buildProjectContext(input),
      ].join("\n\n"),
      max_output_tokens: 1800,
      text: {
        format: zodTextFormat(agentOutputSchema, `${agent.type.toLowerCase()}_agent_output`),
      },
    });

    const parsed = response.output_parsed;

    if (!parsed) {
      throw new Error(`${agent.name} did not return parseable output.`);
    }

    return {
      mode: "openai",
      output: agentOutputSchema.parse({
        ...parsed,
        agentType: agent.type,
      }),
    };
  } catch (error) {
    console.error(`${agent.name} failed; returning demo fallback.`, error);

    return {
      mode: "demo",
      output: buildMockAgentOutput(agent.type, input),
    };
  }
}
