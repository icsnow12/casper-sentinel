import { z } from "zod";

export const agentTypeSchema = z.enum([
  "TECHNICAL",
  "MARKET",
  "SECURITY",
  "COMPLIANCE",
  "TREASURY",
]);

export const recommendationSchema = z.enum([
  "STRONG_PASS",
  "PASS",
  "WATCHLIST",
  "DILIGENCE_REQUIRED",
  "INVEST_SMALL",
  "INVEST",
  "HIGH_CONVICTION_INVEST",
]);

export const evidenceSourceSchema = z.enum([
  "WHITEPAPER",
  "GITHUB",
  "TOKEN",
  "USER_INPUT",
  "MODEL_INFERENCE",
]);

export const agentEvidenceSchema = z.object({
  label: z.string().min(2),
  source: evidenceSourceSchema,
  excerpt: z.string().optional(),
  url: z.string().url().optional(),
});

export const agentOutputSchema = z.object({
  agentType: agentTypeSchema,
  summary: z.string().min(40),
  strengths: z.array(z.string().min(8)).min(2).max(6),
  concerns: z.array(z.string().min(8)).min(2).max(6),
  redFlags: z.array(z.string().min(8)).max(5),
  score: z.number().int().min(0).max(100),
  confidence: z.number().int().min(0).max(100),
  risk: z.number().int().min(0).max(100),
  recommendation: recommendationSchema,
  evidence: z.array(agentEvidenceSchema).min(2).max(6),
});

export const evaluationRequestSchema = z.object({
  projectId: z.string().min(1).optional(),
  projectName: z.string().min(2).max(120),
  whitepaper: z.string().max(50000).optional(),
  whitepaperText: z.string().max(50000).optional(),
  githubRepository: z.string().max(300).optional(),
  githubUrl: z.string().max(300).optional(),
  tokenInformation: z.string().max(10000).optional(),
  tokenSymbol: z.string().max(16).optional(),
  tokenAddress: z.string().max(128).optional(),
  tokenNetwork: z.string().max(64).optional(),
  category: z.string().max(64).optional(),
});

export const evaluationResponseSchema = z.object({
  evaluationId: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  mode: z.enum(["openai", "demo"]),
  generatedAt: z.string(),
  agents: z.array(agentOutputSchema).length(5),
});

export type AgentType = z.infer<typeof agentTypeSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type AgentEvidence = z.infer<typeof agentEvidenceSchema>;
export type AgentOutput = z.infer<typeof agentOutputSchema>;
export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>;
export type EvaluationResponse = z.infer<typeof evaluationResponseSchema>;
