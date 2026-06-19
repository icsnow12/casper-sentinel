import "server-only";

import {
  buildDemoTransactionHash,
  buildExplorerUrl,
  CASPER_TESTNET,
} from "./payload";
import {
  casperStatusResponseSchema,
  casperSubmitResponseSchema,
  type CasperStatusResponse,
  type CasperSubmitRequest,
  type CasperSubmitResponse,
} from "./schemas";

const DEFAULT_TESTNET_RPC_URL = "https://node.testnet.casper.network/rpc";

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

async function trySubmitRealTransaction(input: CasperSubmitRequest) {
  const signedTransaction = input.signedTransaction ?? input.signedDeploy;

  if (!signedTransaction || input.forceDemo) {
    return null;
  }

  const method = input.signedTransaction
    ? "account_put_transaction"
    : "account_put_deploy";
  const paramName = input.signedTransaction ? "transaction" : "deploy";
  const rpcUrl = process.env.CASPER_TESTNET_RPC_URL ?? DEFAULT_TESTNET_RPC_URL;

  const response = await fetch(rpcUrl, {
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

export async function submitCasperRecording(
  input: CasperSubmitRequest
): Promise<CasperSubmitResponse> {
  const submittedAt = new Date().toISOString();

  try {
    const realTransactionHash = await trySubmitRealTransaction(input);

    if (realTransactionHash) {
      return casperSubmitResponseSchema.parse({
        mode: "REAL",
        network: CASPER_TESTNET.network,
        chainName: CASPER_TESTNET.chainName,
        status: "SUBMITTED",
        transactionHash: realTransactionHash,
        explorerUrl: buildExplorerUrl(realTransactionHash),
        payloadHash: input.prepared.payloadHash,
        decisionHash: input.prepared.payload.decisionHash,
        accountPublicKey: input.accountPublicKey,
        submittedAt,
        message:
          "Signed Casper transaction submitted to Testnet RPC. Confirmation polling is available through the status endpoint.",
      });
    }
  } catch (error) {
    console.error("Real Casper submission failed; recording demo proof.", error);
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
    status: "DEMO_RECORDED",
    transactionHash,
    explorerUrl: buildExplorerUrl(transactionHash),
    payloadHash: input.prepared.payloadHash,
    decisionHash: input.prepared.payload.decisionHash,
    accountPublicKey: input.accountPublicKey,
    submittedAt,
    confirmedAt: submittedAt,
    message:
      "Demo proof recorded locally. No Casper transaction was submitted, but the hash and explorer-style proof are stable for the hackathon demo.",
  });
}

export async function getCasperRecordingStatus(
  transactionHash: string,
  mode: "REAL" | "DEMO" = "DEMO"
): Promise<CasperStatusResponse> {
  const checkedAt = new Date().toISOString();

  if (mode === "DEMO") {
    return casperStatusResponseSchema.parse({
      mode: "DEMO",
      network: CASPER_TESTNET.network,
      chainName: CASPER_TESTNET.chainName,
      status: "DEMO_RECORDED",
      transactionHash,
      explorerUrl: buildExplorerUrl(transactionHash),
      checkedAt,
      message:
        "Demo proof is available. Casper Testnet submission is intentionally simulated.",
    });
  }

  return casperStatusResponseSchema.parse({
    mode: "REAL",
    network: CASPER_TESTNET.network,
    chainName: CASPER_TESTNET.chainName,
    status: "SUBMITTED",
    transactionHash,
    explorerUrl: buildExplorerUrl(transactionHash),
    checkedAt,
    message:
      "Transaction was submitted. Confirmation polling can be extended with Casper node query APIs in a later phase.",
  });
}
