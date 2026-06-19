import { z } from "zod";

export const casperRecordingStatusSchema = z.enum([
  "READY_FOR_TESTNET_RECORDING",
  "WALLET_REQUIRED",
  "SIGNATURE_PENDING",
  "SUBMITTED",
  "CONFIRMED",
  "FAILED",
  "DEMO_RECORDED",
]);

export const casperNetworkSchema = z.literal("Casper Testnet");

export const casperRecommendationSchema = z.enum([
  "STRONG_PASS",
  "PASS",
  "WATCHLIST",
  "DILIGENCE_REQUIRED",
  "INVEST_SMALL",
  "INVEST",
  "HIGH_CONVICTION_INVEST",
]);

export const casperOnchainPayloadSchema = z.object({
  projectId: z.string().min(1),
  proposalId: z.string().min(1),
  recommendation: casperRecommendationSchema,
  finalScore: z.number().int().min(0).max(100),
  confidenceScore: z.number().int().min(0).max(100),
  riskScore: z.number().int().min(0).max(100),
  decisionHash: z.string().regex(/^[a-f0-9]{64}$/),
  timestamp: z.string().min(1),
});

export const casperPrepareRequestSchema = z.object({
  projectId: z.string().min(1),
  proposalId: z.string().min(1).optional(),
  recommendation: casperRecommendationSchema,
  finalScore: z.number().int().min(0).max(100),
  confidenceScore: z.number().int().min(0).max(100),
  riskScore: z.number().int().min(0).max(100),
  decisionHash: z.string().regex(/^[a-f0-9]{64}$/),
  timestamp: z.string().min(1).optional(),
});

export const casperPreparedTransactionSchema = z.object({
  mode: z.enum(["REAL", "DEMO"]),
  network: casperNetworkSchema,
  chainName: z.literal("casper-test"),
  payload: casperOnchainPayloadSchema,
  payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
  status: casperRecordingStatusSchema,
  signingMessage: z.string(),
  preparedAt: z.string().min(1),
});

export const casperSubmitRequestSchema = z.object({
  prepared: casperPreparedTransactionSchema,
  accountPublicKey: z.string().min(10).optional(),
  signedTransaction: z.unknown().optional(),
  signedDeploy: z.unknown().optional(),
  signature: z.unknown().optional(),
  forceDemo: z.boolean().optional(),
});

export const casperSubmitResponseSchema = z.object({
  mode: z.enum(["REAL", "DEMO"]),
  network: casperNetworkSchema,
  chainName: z.literal("casper-test"),
  status: casperRecordingStatusSchema,
  transactionHash: z.string().regex(/^[a-f0-9]{64}$/),
  deployHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  explorerUrl: z.string().url(),
  payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
  decisionHash: z.string().regex(/^[a-f0-9]{64}$/),
  accountPublicKey: z.string().optional(),
  submittedAt: z.string().min(1),
  confirmedAt: z.string().min(1).optional(),
  message: z.string(),
});

export const casperStatusResponseSchema = z.object({
  mode: z.enum(["REAL", "DEMO"]),
  network: casperNetworkSchema,
  chainName: z.literal("casper-test"),
  status: casperRecordingStatusSchema,
  transactionHash: z.string().regex(/^[a-f0-9]{64}$/),
  explorerUrl: z.string().url(),
  checkedAt: z.string().min(1),
  message: z.string(),
});

export type CasperRecordingStatus = z.infer<typeof casperRecordingStatusSchema>;
export type CasperOnchainPayload = z.infer<typeof casperOnchainPayloadSchema>;
export type CasperPrepareRequest = z.infer<typeof casperPrepareRequestSchema>;
export type CasperPreparedTransaction = z.infer<
  typeof casperPreparedTransactionSchema
>;
export type CasperSubmitRequest = z.infer<typeof casperSubmitRequestSchema>;
export type CasperSubmitResponse = z.infer<typeof casperSubmitResponseSchema>;
export type CasperStatusResponse = z.infer<typeof casperStatusResponseSchema>;
