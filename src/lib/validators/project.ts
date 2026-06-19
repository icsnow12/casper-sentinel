import { z } from "zod";

export const projectSubmissionSchema = z.object({
  projectName: z.string().min(2).max(120),
  website: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  whitepaperText: z.string().min(20).max(50000),
  tokenSymbol: z.string().max(16).optional().or(z.literal("")),
  tokenAddress: z.string().max(128).optional().or(z.literal("")),
  tokenNetwork: z.string().max(64).optional().or(z.literal("")),
  category: z.enum(["WEB3", "DEFI", "RWA", "INFRASTRUCTURE", "GAMING", "AI"]),
});

export type ProjectSubmissionInput = z.infer<typeof projectSubmissionSchema>;
