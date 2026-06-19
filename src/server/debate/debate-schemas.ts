import { z } from "zod";

import {
  agentOutputSchema,
  agentTypeSchema,
  recommendationSchema,
} from "@/server/agents/schemas";
import { agentVoteSchema } from "@/server/committee/schemas";

export const debateAgentNameSchema = z.enum([
  "Technical",
  "Market",
  "Security",
  "Compliance",
  "Treasury",
]);

export const debateStanceSchema = z.enum([
  "Approve",
  "Reject",
  "Diligence Required",
]);

export const debateRiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const debateRoundSchema = z.object({
  agentType: agentTypeSchema,
  agent: debateAgentNameSchema,
  stance: debateStanceSchema,
  confidence: z.number().int().min(0).max(100),
  challengeTarget: debateAgentNameSchema,
  argument: z.string().min(40),
  challenge: z.string().min(30),
  evidence: z.string().min(30),
  riskLevel: debateRiskLevelSchema,
});

export const debateRebuttalSchema = z.object({
  agentType: agentTypeSchema,
  agent: debateAgentNameSchema,
  responseTo: debateAgentNameSchema,
  rebuttal: z.string().min(30),
  resolution: z.string().min(30),
});

export const debateConsensusSchema = z.object({
  agreementPoints: z.array(z.string().min(12)).min(2).max(6),
  disagreementPoints: z.array(z.string().min(12)).min(2).max(6),
  finalConsensusScore: z.number().int().min(0).max(100),
  dominantConcern: z.string().min(12),
  dominantOpportunity: z.string().min(12),
});

export const debateFinalRecommendationSchema = z.enum([
  "APPROVE",
  "REJECT",
  "DILIGENCE_REQUIRED",
]);

export const debateScoreComponentsSchema = z.object({
  weightedVote: z.number().int().min(0).max(100),
  debateConsensus: z.number().int().min(0).max(100),
  agentConfidence: z.number().int().min(0).max(100),
  reputationTrust: z.number().int().min(0).max(100),
});

export const debateFinalScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  recommendation: debateFinalRecommendationSchema,
  reasoning: z.string().min(60),
  components: debateScoreComponentsSchema,
});

export const debateRequestSchema = z.object({
  projectId: z.string().min(1),
  projectName: z.string().min(2).max(120).optional(),
  agents: z.array(agentOutputSchema).length(5).optional(),
});

export const debateSynthesisSchema = z.object({
  rebuttals: z.array(debateRebuttalSchema).length(5),
  consensus: debateConsensusSchema,
});

export const debateOutputSchema = z.object({
  debateId: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  mode: z.enum(["openai", "demo"]),
  generatedAt: z.string(),
  debateRounds: z.array(debateRoundSchema).length(5),
  rebuttals: z.array(debateRebuttalSchema).length(5),
  consensus: debateConsensusSchema,
  finalScore: debateFinalScoreSchema,
  votes: z.array(agentVoteSchema).length(5),
  preliminaryRecommendation: recommendationSchema,
});

export type DebateAgentName = z.infer<typeof debateAgentNameSchema>;
export type DebateStance = z.infer<typeof debateStanceSchema>;
export type DebateRiskLevel = z.infer<typeof debateRiskLevelSchema>;
export type DebateRound = z.infer<typeof debateRoundSchema>;
export type DebateRebuttal = z.infer<typeof debateRebuttalSchema>;
export type DebateConsensus = z.infer<typeof debateConsensusSchema>;
export type DebateFinalRecommendation = z.infer<
  typeof debateFinalRecommendationSchema
>;
export type DebateFinalScore = z.infer<typeof debateFinalScoreSchema>;
export type DebateRequest = z.infer<typeof debateRequestSchema>;
export type DebateSynthesis = z.infer<typeof debateSynthesisSchema>;
export type DebateOutput = z.infer<typeof debateOutputSchema>;
