import { z } from "zod";

import {
  agentOutputSchema,
  agentTypeSchema,
  recommendationSchema,
} from "@/server/agents/schemas";

export const committeeSpeakerSchema = z.union([
  agentTypeSchema,
  z.literal("COMMITTEE"),
]);

export const debateTranscriptItemSchema = z.object({
  speaker: committeeSpeakerSchema,
  title: z.string().min(2),
  message: z.string().min(20),
  stance: z.enum(["supportive", "cautious", "opposed", "moderating"]),
});

export const disagreementSchema = z.object({
  topic: z.string().min(4),
  agents: z.array(agentTypeSchema).min(2),
  severity: z.enum(["low", "medium", "high"]),
  summary: z.string().min(20),
});

export const agentVoteSchema = z.object({
  agentType: agentTypeSchema,
  agentName: z.string(),
  vote: recommendationSchema,
  voteValue: z.number().int().min(0).max(100),
  baseWeight: z.number().min(0).max(1),
  trustScore: z.number().int().min(0).max(100),
  reputationMultiplier: z.number().min(0).max(2),
  finalWeight: z.number().min(0).max(1),
  normalizedWeight: z.number().min(0).max(1),
  score: z.number().int().min(0).max(100),
  confidence: z.number().int().min(0).max(100),
  risk: z.number().int().min(0).max(100),
  rationale: z.string().min(20),
});

export const committeeRequestSchema = z.object({
  projectId: z.string().min(1).optional(),
  projectName: z.string().min(2).max(120).default("Casper Sentinel Demo"),
  agents: z.array(agentOutputSchema).length(5).optional(),
});

export const committeeOutputSchema = z.object({
  committeeId: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  mode: z.enum(["openai", "demo"]),
  generatedAt: z.string(),
  debateTranscript: z.array(debateTranscriptItemSchema).min(5),
  disagreements: z.array(disagreementSchema),
  votes: z.array(agentVoteSchema).length(5),
  weightedScore: z.number().int().min(0).max(100),
  weightedConfidence: z.number().int().min(0).max(100),
  weightedRisk: z.number().int().min(0).max(100),
  preliminaryRecommendation: recommendationSchema,
  summary: z.string().min(40),
});

export const decisionPayloadSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  committeeId: z.string(),
  finalRecommendation: recommendationSchema,
  finalScore: z.number().int().min(0).max(100),
  confidenceScore: z.number().int().min(0).max(100),
  riskScore: z.number().int().min(0).max(100),
  agentVotes: z.array(agentVoteSchema),
  generatedAt: z.string(),
  casperStatus: z.literal("READY_FOR_TESTNET_RECORDING"),
});

export const finalResolutionSchema = z.object({
  resolutionId: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  committeeId: z.string(),
  mode: z.enum(["openai", "demo"]),
  generatedAt: z.string(),
  finalRecommendation: recommendationSchema,
  finalScore: z.number().int().min(0).max(100),
  confidenceScore: z.number().int().min(0).max(100),
  riskScore: z.number().int().min(0).max(100),
  investmentMemo: z.string().min(80),
  conditionsPrecedent: z.array(z.string().min(10)).min(3),
  decisionPayload: decisionPayloadSchema,
  decisionHash: z.string().regex(/^[a-f0-9]{64}$/),
  casperStatus: z.literal("READY_FOR_TESTNET_RECORDING"),
});

export const resolutionRequestSchema = z.object({
  projectId: z.string().min(1).optional(),
  projectName: z.string().min(2).max(120).default("Casper Sentinel Demo"),
  agents: z.array(agentOutputSchema).length(5).optional(),
  committee: committeeOutputSchema.optional(),
});

export type CommitteeSpeaker = z.infer<typeof committeeSpeakerSchema>;
export type DebateTranscriptItem = z.infer<typeof debateTranscriptItemSchema>;
export type Disagreement = z.infer<typeof disagreementSchema>;
export type AgentVote = z.infer<typeof agentVoteSchema>;
export type CommitteeRequest = z.infer<typeof committeeRequestSchema>;
export type CommitteeOutput = z.infer<typeof committeeOutputSchema>;
export type DecisionPayload = z.infer<typeof decisionPayloadSchema>;
export type FinalResolution = z.infer<typeof finalResolutionSchema>;
export type ResolutionRequest = z.infer<typeof resolutionRequestSchema>;
