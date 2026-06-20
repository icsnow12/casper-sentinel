import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4.1-mini"),
  CASPER_TESTNET_RPC_URL: z
    .string()
    .url()
    .default("https://node.testnet.casper.network/rpc"),
  CASPER_CONTRACT_HASH: z.string().min(1).optional(),
  CASPER_ACCOUNT_PUBLIC_KEY: z.string().min(1).optional(),
  CASPER_SECRET_KEY_PATH: z.string().min(1).optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  CASPER_TESTNET_RPC_URL: process.env.CASPER_TESTNET_RPC_URL,
  CASPER_CONTRACT_HASH: process.env.CASPER_CONTRACT_HASH,
  CASPER_ACCOUNT_PUBLIC_KEY: process.env.CASPER_ACCOUNT_PUBLIC_KEY,
  CASPER_SECRET_KEY_PATH: process.env.CASPER_SECRET_KEY_PATH,
});

export const isDemoMode = !env.OPENAI_API_KEY;
