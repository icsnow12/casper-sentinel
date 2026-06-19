import "server-only";

import { getAgentDefinition } from "./prompts";
import { runAgent } from "./runner";
import type { EvaluationRequest } from "./schemas";

const treasuryAgent = getAgentDefinition("TREASURY");

export async function runTreasuryAgent(input: EvaluationRequest) {
  if (!treasuryAgent) {
    throw new Error("Treasury Agent definition is missing.");
  }

  return runAgent(treasuryAgent, input);
}
