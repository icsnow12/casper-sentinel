#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_RPC_URL = "https://node.testnet.casper.network/rpc";
const DEFAULT_WASM_PATH =
  "contracts/casper-sentinel-governance/target/wasm32-unknown-unknown/release/casper_sentinel_governance.wasm";
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

function extractDeployHash(output) {
  return output.match(/[a-f0-9]{64}/i)?.[0]?.toLowerCase();
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
  const secretKeyPath = required(
    "CASPER_SECRET_KEY_PATH or --secretKeyPath",
    args.secretKeyPath ?? process.env.CASPER_SECRET_KEY_PATH
  );
  const wasmPath = resolve(args.wasmPath ?? DEFAULT_WASM_PATH);
  const paymentAmount =
    args.paymentAmount ?? process.env.CASPER_PAYMENT_AMOUNT ?? DEFAULT_PAYMENT_AMOUNT;

  if (!existsSync(secretKeyPath)) {
    throw new Error(`Secret key file does not exist: ${secretKeyPath}`);
  }

  if (!existsSync(wasmPath)) {
    throw new Error(`Compiled contract WASM does not exist: ${wasmPath}`);
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
    "--session-path",
    wasmPath,
  ]);

  console.log("\nCasper Sentinel contract deploy submitted.");
  console.log(`Deploy hash: ${deployHash}`);
  console.log(`Explorer: https://testnet.cspr.live/transaction/${deployHash}`);
  console.log(
    "After execution, copy the named key casper_sentinel_governance_contract_hash into CASPER_CONTRACT_HASH."
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
