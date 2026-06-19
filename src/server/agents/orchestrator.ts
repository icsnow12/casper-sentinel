import "server-only";

import { runComplianceAgent } from "./compliance-agent";
import { runMarketAgent } from "./market-agent";
import { runSecurityAgent } from "./security-agent";
import { runTechnicalAgent } from "./technical-agent";
import { runTreasuryAgent } from "./treasury-agent";
import {
  evaluationResponseSchema,
  type EvaluationRequest,
  type EvaluationResponse,
} from "./schemas";

const demoProjectId = "demo-project-casper-sentinel";

export async function runEvaluation(
  input: EvaluationRequest
): Promise<EvaluationResponse> {
  const normalizedInput = {
    ...input,
    projectId: input.projectId ?? demoProjectId,
  };

  const results = await Promise.all([
    runTechnicalAgent(normalizedInput),
    runMarketAgent(normalizedInput),
    runSecurityAgent(normalizedInput),
    runComplianceAgent(normalizedInput),
    runTreasuryAgent(normalizedInput),
  ]);

  const mode = results.every((result) => result.mode === "openai")
    ? "openai"
    : "demo";

  return evaluationResponseSchema.parse({
    evaluationId: `eval_${crypto.randomUUID()}`,
    projectId: normalizedInput.projectId,
    projectName: normalizedInput.projectName,
    mode,
    generatedAt: new Date().toISOString(),
    agents: results.map((result) => result.output),
  });
}
