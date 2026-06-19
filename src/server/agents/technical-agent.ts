import "server-only";

import { getAgentDefinition } from "./prompts";
import { runAgent } from "./runner";
import type { EvaluationRequest } from "./schemas";

const technicalAgent = getAgentDefinition("TECHNICAL");

export async function runTechnicalAgent(input: EvaluationRequest) {
  if (!technicalAgent) {
    throw new Error("Technical Agent definition is missing.");
  }

  return runAgent(technicalAgent, input);
}
