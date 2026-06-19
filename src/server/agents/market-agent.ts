import "server-only";

import { getAgentDefinition } from "./prompts";
import { runAgent } from "./runner";
import type { EvaluationRequest } from "./schemas";

const marketAgent = getAgentDefinition("MARKET");

export async function runMarketAgent(input: EvaluationRequest) {
  if (!marketAgent) {
    throw new Error("Market Agent definition is missing.");
  }

  return runAgent(marketAgent, input);
}
