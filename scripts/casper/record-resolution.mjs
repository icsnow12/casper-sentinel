#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const DEFAULT_RPC_URL = "https://node.testnet.casper.network/rpc";
const DEFAULT_PAYMENT_AMOUNT = "3000000000";

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function required(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function normalizeContractHash(contractHash) {
  return contractHash.replace(/^hash-/, "");
}

function escapeSessionArg(value) {
  return String(value).replace(/'/g, "\\'");
}

function extractDeployHash(output) {
  return output.match(/[a-f0-9]{64}/i)?.[0]?.toLowerCase();
}

function parseFinalScore(value) {
  const finalScore = Number.parseInt(value, 10);

  if (!Number.isInteger(finalScore) || finalScore < 0 || finalScore > 100) {
    throw new Error("finalScore must be an integer from 0 to 100.");
  }

  return String(finalScore);
}

function assertDecisionHash(value) {
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error("decisionHash must be a 64-character SHA-256 hex string.");
  }

  return value.toLowerCase();
}

function runCasperClient(args) {
  const result = spawnSync("casper-client", args, {
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    throw new Error(
      `casper-client failed to start: ${result.error.message}. Install casper-client and ensure it is on PATH.`
    );
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status !== 0) {
    throw new Error(`casper-client exited with status ${result.status}.`);
  }

  const deployHash = extractDeployHash(`${result.stdout}\n${result.stderr}`);

  if (!deployHash) {
    throw new Error("casper-client output did not include a deploy hash.");
  }

  return deployHash;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const rpcUrl = args.rpcUrl ?? process.env.CASPER_TESTNET_RPC_URL ?? DEFAULT_RPC_URL;
  const contractHash = required(
    "CASPER_CONTRACT_HASH or --contractHash",
    args.contractHash ?? process.env.CASPER_CONTRACT_HASH
  );
  const secretKeyPath = required(
    "CASPER_SECRET_KEY_PATH or --secretKeyPath",
    args.secretKeyPath ?? process.env.CASPER_SECRET_KEY_PATH
  );
  const projectId = required("projectId", args.projectId);
  const proposalId = args.proposalId ?? projectId;
  const decisionHash = assertDecisionHash(required("decisionHash", args.decisionHash));
  const finalScore = parseFinalScore(required("finalScore", args.finalScore));
  const timestamp = args.timestamp ?? new Date().toISOString();
  const recommendation = args.recommendation ?? "DILIGENCE_REQUIRED";
  const paymentAmount =
    args.paymentAmount ?? process.env.CASPER_PAYMENT_AMOUNT ?? DEFAULT_PAYMENT_AMOUNT;

  if (!existsSync(secretKeyPath)) {
    throw new Error(`Secret key file does not exist: ${secretKeyPath}`);
  }

  const deployHash = runCasperClient([
    "put-deploy",
    "--node-address",
    rpcUrl,
    "--chain-name",
    "casper-test",
    "--secret-key",
    secretKeyPath,
    "--payment-amount",
    paymentAmount,
    "--session-hash",
    normalizeContractHash(contractHash),
    "--session-entry-point",
    "record_resolution",
    "--session-arg",
    `proposal_id:string='${escapeSessionArg(proposalId)}'`,
    "--session-arg",
    `project_id:string='${escapeSessionArg(projectId)}'`,
    "--session-arg",
    `decision_hash:string='${decisionHash}'`,
    "--session-arg",
    `final_score:u8='${finalScore}'`,
    "--session-arg",
    `recommendation:string='${escapeSessionArg(recommendation)}'`,
    "--session-arg",
    `timestamp:string='${escapeSessionArg(timestamp)}'`,
  ]);

  console.log("\nCasper Sentinel resolution recorded.");
  console.log(`Project ID: ${projectId}`);
  console.log(`Decision hash: ${decisionHash}`);
  console.log(`Final score: ${finalScore}`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Deploy hash: ${deployHash}`);
  console.log(`Explorer: https://testnet.cspr.live/transaction/${deployHash}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
