import "server-only";

import { getAgentDefinition } from "./prompts";
import { runAgent } from "./runner";
import type { EvaluationRequest } from "./schemas";

const complianceAgent = getAgentDefinition("COMPLIANCE");

export async function runComplianceAgent(input: EvaluationRequest) {
  if (!complianceAgent) {
    throw new Error("Compliance Agent definition is missing.");
  }

  return runAgent(complianceAgent, input);
}
