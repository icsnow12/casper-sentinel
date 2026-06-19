import "server-only";

import { getAgentDefinition } from "./prompts";
import { runAgent } from "./runner";
import type { EvaluationRequest } from "./schemas";

const securityAgent = getAgentDefinition("SECURITY");

export async function runSecurityAgent(input: EvaluationRequest) {
  if (!securityAgent) {
    throw new Error("Security Agent definition is missing.");
  }

  return runAgent(securityAgent, input);
}
