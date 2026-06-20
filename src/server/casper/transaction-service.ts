import "server-only";

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

import { env } from "@/lib/env";

import {
  buildDemoTransactionHash,
  buildExplorerUrl,
  buildPreparedTransaction,
  CASPER_TESTNET,
} from "./payload";
import {
  casperResolutionQuerySchema,
  casperStatusResponseSchema,
  casperSubmitResponseSchema,
  type CasperPrepareRequest,
  type CasperPreparedTransaction,
  type CasperResolutionQuery,
  type CasperStatusResponse,
  type CasperSubmitRequest,
  type CasperSubmitResponse,
} from "./schemas";

const execFileAsync = promisify(execFile);
const RESOLUTIONS_DICTIONARY = "resolutions";
const DEFAULT_PAYMENT_AMOUNT = "3000000000";

type CasperRealModeConfig = {
  rpcUrl: string;
  contractHash: string;
  accountPublicKey: string;
  secretKeyPath: string;
};

function extractTransactionHash(response: unknown) {
  const value = response as {
    result?: {
      value?: {
        transaction_hash?: { Version1?: string } | string;
        deploy_hash?: string;
      };
      transaction_hash?: { Version1?: string } | string;
      deploy_hash?: string;
    };
  };

  const result = value.result;
  const transactionHash =
    typeof result?.value?.transaction_hash === "string"
      ? result.value.transaction_hash
      : result?.value?.transaction_hash?.Version1 ??
        (typeof result?.transaction_hash === "string"
          ? result.transaction_hash
          : result?.transaction_hash?.Version1);

  return transactionHash ?? result?.value?.deploy_hash ?? result?.deploy_hash;
}

function extractHashFromText(value: string) {
  return value.match(/[a-f0-9]{64}/i)?.[0]?.toLowerCase();
}

function contractHashForRpc(contractHash: string) {
  return contractHash.startsWith("hash-") ? contractHash : `hash-${contractHash}`;
}

function contractHashForCli(contractHash: string) {
  return contractHash.replace(/^hash-/, "");
}

function escapeSessionArg(value: string) {
  return value.replace(/'/g, "\\'");
}

export function getCasperRealModeConfig(): CasperRealModeConfig | null {
  const contractHash = env.CASPER_CONTRACT_HASH;
  const accountPublicKey = env.CASPER_ACCOUNT_PUBLIC_KEY;
  const secretKeyPath = env.CASPER_SECRET_KEY_PATH;

  if (!contractHash || !accountPublicKey || !secretKeyPath) {
    return null;
  }

  if (!existsSync(secretKeyPath)) {
    return null;
  }

  return {
    rpcUrl: env.CASPER_TESTNET_RPC_URL,
    contractHash,
    accountPublicKey,
    secretKeyPath,
  };
}

export function prepareDeploy(input: CasperPrepareRequest): CasperPreparedTransaction {
  const config = getCasperRealModeConfig();

  return buildPreparedTransaction(
    input,
    config ? "REAL" : "DEMO",
    config?.contractHash
  );
}

async function submitSignedDeploy(input: CasperSubmitRequest) {
  const signedTransaction = input.signedTransaction ?? input.signedDeploy;

  if (!signedTransaction || input.forceDemo) {
    return null;
  }

  const method = input.signedTransaction
    ? "account_put_transaction"
    : "account_put_deploy";
  const paramName = input.signedTransaction ? "transaction" : "deploy";

  const response = await fetch(env.CASPER_TESTNET_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params: [
        {
          name: paramName,
          value: signedTransaction,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Casper RPC returned HTTP ${response.status}.`);
  }

  const json = await response.json();

  if (json.error) {
    throw new Error(json.error.message ?? "Casper RPC returned an error.");
  }

  const transactionHash = extractTransactionHash(json);

  if (!transactionHash) {
    throw new Error("Casper RPC response did not include a transaction hash.");
  }

  return transactionHash;
}

function buildCasperClientArgs(prepared: CasperPreparedTransaction, config: CasperRealModeConfig) {
  const payload = prepared.payload;

  return [
    "put-deploy",
    "--node-address",
    config.rpcUrl,
    "--chain-name",
    CASPER_TESTNET.chainName,
    "--secret-key",
    config.secretKeyPath,
    "--payment-amount",
    DEFAULT_PAYMENT_AMOUNT,
    "--session-hash",
    contractHashForCli(config.contractHash),
    "--session-entry-point",
    "record_resolution",
    "--session-arg",
    `proposal_id:string='${escapeSessionArg(payload.proposalId)}'`,
    "--session-arg",
    `project_id:string='${escapeSessionArg(payload.projectId)}'`,
    "--session-arg",
    `decision_hash:string='${payload.decisionHash}'`,
    "--session-arg",
    `final_score:u8='${payload.finalScore}'`,
    "--session-arg",
    `recommendation:string='${payload.recommendation}'`,
    "--session-arg",
    `timestamp:string='${escapeSessionArg(payload.timestamp)}'`,
  ];
}

export async function submitDeploy(input: CasperSubmitRequest) {
  if (input.forceDemo) {
    return null;
  }

  const signedHash = await submitSignedDeploy(input);

  if (signedHash) {
    return {
      deployHash: signedHash,
      contractHash: input.prepared.contractHash,
      accountPublicKey: input.accountPublicKey,
      message: "Signed Casper deploy submitted to Testnet RPC.",
    };
  }

  const config = getCasperRealModeConfig();

  if (!config || input.prepared.mode !== "REAL") {
    return null;
  }

  const args = buildCasperClientArgs(input.prepared, config);
  const { stdout, stderr } = await execFileAsync("casper-client", args, {
    timeout: 120000,
    maxBuffer: 1024 * 1024,
  });
  const deployHash = extractHashFromText(`${stdout}\n${stderr}`);

  if (!deployHash) {
    throw new Error("casper-client did not return a deploy hash.");
  }

  return {
    deployHash,
    contractHash: config.contractHash,
    accountPublicKey: config.accountPublicKey,
    message:
      "Real Testnet mode active: record_resolution deploy submitted through casper-client.",
  };
}

export async function submitCasperRecording(
  input: CasperSubmitRequest
): Promise<CasperSubmitResponse> {
  const submittedAt = new Date().toISOString();

  try {
    const realDeploy = await submitDeploy(input);

    if (realDeploy) {
      return casperSubmitResponseSchema.parse({
        mode: "REAL",
        network: CASPER_TESTNET.network,
        chainName: CASPER_TESTNET.chainName,
        contractHash: realDeploy.contractHash,
        status: "SUBMITTED",
        transactionHash: realDeploy.deployHash,
        deployHash: realDeploy.deployHash,
        explorerUrl: buildExplorerUrl(realDeploy.deployHash),
        payloadHash: input.prepared.payloadHash,
        decisionHash: input.prepared.payload.decisionHash,
        accountPublicKey: realDeploy.accountPublicKey,
        submittedAt,
        message: realDeploy.message,
      });
    }
  } catch (error) {
    console.error(
      "Real Casper submission failed; falling back to demo proof mode.",
      error instanceof Error ? error.message : error
    );
  }

  const transactionHash = buildDemoTransactionHash({
    payloadHash: input.prepared.payloadHash,
    decisionHash: input.prepared.payload.decisionHash,
    accountPublicKey: input.accountPublicKey ?? "demo-wallet-not-connected",
    submittedAt,
  });

  return casperSubmitResponseSchema.parse({
    mode: "DEMO",
    network: CASPER_TESTNET.network,
    chainName: CASPER_TESTNET.chainName,
    contractHash: input.prepared.contractHash,
    status: "DEMO_RECORDED",
    transactionHash,
    explorerUrl: buildExplorerUrl(transactionHash),
    payloadHash: input.prepared.payloadHash,
    decisionHash: input.prepared.payload.decisionHash,
    accountPublicKey: input.accountPublicKey,
    submittedAt,
    confirmedAt: submittedAt,
    message:
      "Demo proof mode: no Casper Testnet deploy was submitted. Configure contract hash, account public key, secret-key path, and casper-client to enable real testnet recording.",
  });
}

export async function getCasperRecordingStatus(
  transactionHash: string,
  mode: "REAL" | "DEMO" = "DEMO",
  contractHash?: string
): Promise<CasperStatusResponse> {
  const checkedAt = new Date().toISOString();

  if (mode === "DEMO") {
    return casperStatusResponseSchema.parse({
      mode: "DEMO",
      network: CASPER_TESTNET.network,
      chainName: CASPER_TESTNET.chainName,
      contractHash,
      status: "DEMO_PROOF",
      transactionHash,
      explorerUrl: buildExplorerUrl(transactionHash),
      checkedAt,
      message:
        "Demo proof is available. No Casper Testnet confirmation is claimed.",
    });
  }

  try {
    const deploy = await rpcCall<{
      result?: { execution_results?: unknown[] };
    }>("info_get_deploy", [
      {
        deploy_hash: transactionHash,
      },
    ]);
    const executionResults = deploy.result?.execution_results;
    const confirmed = Array.isArray(executionResults) && executionResults.length > 0;

    return casperStatusResponseSchema.parse({
      mode: "REAL",
      network: CASPER_TESTNET.network,
      chainName: CASPER_TESTNET.chainName,
      contractHash,
      status: confirmed ? "CONFIRMED" : "SUBMITTED",
      transactionHash,
      explorerUrl: buildExplorerUrl(transactionHash),
      checkedAt,
      message: confirmed
        ? "Casper Testnet deploy has execution results. Verify details in the explorer."
        : "Casper Testnet deploy was submitted and is awaiting execution results.",
    });
  } catch (error) {
    return casperStatusResponseSchema.parse({
      mode: "REAL",
      network: CASPER_TESTNET.network,
      chainName: CASPER_TESTNET.chainName,
      contractHash,
      status: "SUBMITTED",
      transactionHash,
      explorerUrl: buildExplorerUrl(transactionHash),
      checkedAt,
      message:
        error instanceof Error
          ? `Deploy submitted, but status lookup is not confirmed yet: ${error.message}`
          : "Deploy submitted, but status lookup is not confirmed yet.",
    });
  }
}
async function rpcCall<T>(method: string, params: unknown): Promise<T> {
  const response = await fetch(env.CASPER_TESTNET_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Casper RPC returned HTTP ${response.status}.`);
  }

  const json = await response.json();

  if (json.error) {
    throw new Error(json.error.message ?? "Casper RPC returned an error.");
  }

  return json as T;
}

export async function queryResolution(
  proposalId: string
): Promise<CasperResolutionQuery> {
  const checkedAt = new Date().toISOString();
  const config = getCasperRealModeConfig();

  if (!config) {
    return casperResolutionQuerySchema.parse({
      mode: "DEMO",
      network: CASPER_TESTNET.network,
      chainName: CASPER_TESTNET.chainName,
      proposalId,
      exists: false,
      checkedAt,
      message:
        "Demo proof mode is active. Configure real Casper env variables to query contract state.",
    });
  }

  try {
    const stateRoot = await rpcCall<{ result: { state_root_hash: string } }>(
      "chain_get_state_root_hash",
      []
    );
    const dictionary = await rpcCall<{
      result: { stored_value?: { CLValue?: { parsed?: unknown } } };
    }>("state_get_dictionary_item", {
      state_root_hash: stateRoot.result.state_root_hash,
      dictionary_identifier: {
        ContractNamedKey: {
          key: contractHashForRpc(config.contractHash),
          dictionary_name: RESOLUTIONS_DICTIONARY,
          dictionary_item_key: proposalId,
        },
      },
    });
    const parsed = dictionary.result.stored_value?.CLValue?.parsed;
    const resolution = typeof parsed === "string" ? parsed : JSON.stringify(parsed);

    return casperResolutionQuerySchema.parse({
      mode: "REAL",
      network: CASPER_TESTNET.network,
      chainName: CASPER_TESTNET.chainName,
      contractHash: config.contractHash,
      proposalId,
      exists: Boolean(resolution),
      resolution,
      checkedAt,
      message: "Resolution queried from Casper Testnet contract dictionary.",
    });
  } catch (error) {
    return casperResolutionQuerySchema.parse({
      mode: "REAL",
      network: CASPER_TESTNET.network,
      chainName: CASPER_TESTNET.chainName,
      contractHash: config.contractHash,
      proposalId,
      exists: false,
      checkedAt,
      message:
        error instanceof Error
          ? `Resolution not found or query failed: ${error.message}`
          : "Resolution not found or query failed.",
    });
  }
}

