# Phase 7B Real Casper Testnet Deploy Hash

This runbook produces a real Casper Testnet deploy hash for Casper Sentinel.

The transaction path uses the minimal governance recorder contract in:

```txt
contracts/casper-sentinel-governance
```

The real `record_resolution` deploy records:

- `project_id`
- `decision_hash`
- `final_score`
- `timestamp`

It also stores `proposal_id`, `recommendation`, and `recorded_by` so the record is queryable and auditable.

## 1. Install Tools

### Windows: use WSL2 Ubuntu

As of June 2026, native Windows `cargo install casper-client` can fail in
`casper-types` with Unix-only APIs such as `std::os::unix::fs::OpenOptionsExt`.
This is not a Visual Studio C++ tools problem. Use WSL2 Ubuntu and Casper's
Debian package repository for the working client path.

From Windows PowerShell:

```powershell
wsl --install -d Ubuntu-22.04
```

Restart if Windows asks you to, then open Ubuntu and run:

```bash
sudo apt update
sudo apt install -y curl ca-certificates gnupg jq build-essential pkg-config openssl libssl-dev

sudo mkdir -m 0755 -p /etc/apt/keyrings/
sudo curl -fsSL https://repo.casper.network/casper-repo-pubkey.gpg \
  --output /etc/apt/keyrings/casper-repo-pubkey.gpg

echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/casper-repo-pubkey.gpg] https://repo.casper.network/releases jammy main" \
  | sudo tee /etc/apt/sources.list.d/casper.list

sudo apt update
sudo apt install -y casper-client jq
casper-client --version
casper-client get-state-root-hash --node-address https://node.testnet.casper.network/rpc
```

If you want the app's `Submit real Testnet deploy` button to use this client,
run the Next.js dev server inside WSL as well. A Windows-hosted Next.js process
will not find the Linux `casper-client` binary.

Install Rust inside WSL:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustup target add wasm32-unknown-unknown
```

### Linux/macOS from source

Casper docs also list the crates.io install path:

```bash
cargo install casper-client
casper-client --version
```

Use this on supported Unix-like environments. On native Windows, use the WSL2
path above.

## 2. Compile Contract

From the repository root:

```bash
cd "/mnt/g/黑客松参赛作品/casper-sentinel/contracts/casper-sentinel-governance"
cargo build --release --target wasm32-unknown-unknown
cd -
```

The compiled WASM should exist at:

```txt
contracts/casper-sentinel-governance/target/wasm32-unknown-unknown/release/casper_sentinel_governance.wasm
```

## 3. Deploy Contract To Testnet

Use a funded Casper Testnet secret key. Do not commit this key.

```bash
export CASPER_TESTNET_RPC_URL="https://node.testnet.casper.network/rpc"
export CASPER_SECRET_KEY_PATH="$HOME/casper-keys/secret_key.pem"

casper-client put-deploy \
  --node-address "$CASPER_TESTNET_RPC_URL" \
  --chain-name casper-test \
  --secret-key "$CASPER_SECRET_KEY_PATH" \
  --payment-amount 3000000000 \
  --session-path "/mnt/g/黑客松参赛作品/casper-sentinel/contracts/casper-sentinel-governance/target/wasm32-unknown-unknown/release/casper_sentinel_governance.wasm"
```

The script prints:

```txt
Deploy hash: <64-character-hex-deploy-hash>
Explorer: https://testnet.cspr.live/transaction/<deploy-hash>
```

Open the explorer link and wait for execution. After it executes, copy the named key:

```txt
casper_sentinel_governance_contract_hash
```

Set that value as:

```bash
export CASPER_CONTRACT_HASH="hash-..."
```

## 4. Call record_resolution

Use a unique `projectId` or `proposalId`. The contract rejects duplicate proposal IDs.

```bash
export CASPER_TESTNET_RPC_URL="https://node.testnet.casper.network/rpc"
export CASPER_SECRET_KEY_PATH="$HOME/casper-keys/secret_key.pem"
export CASPER_CONTRACT_HASH="hash-..."
export CONTRACT_HASH_NO_PREFIX="${CASPER_CONTRACT_HASH#hash-}"

casper-client put-deploy \
  --node-address "$CASPER_TESTNET_RPC_URL" \
  --chain-name casper-test \
  --secret-key "$CASPER_SECRET_KEY_PATH" \
  --payment-amount 3000000000 \
  --session-hash "$CONTRACT_HASH_NO_PREFIX" \
  --session-entry-point record_resolution \
  --session-arg "proposal_id:string='harbor-rwa-credit-2026-06-20'" \
  --session-arg "project_id:string='harbor-rwa-credit'" \
  --session-arg "decision_hash:string='0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'" \
  --session-arg "final_score:u8='74'" \
  --session-arg "recommendation:string='DILIGENCE_REQUIRED'" \
  --session-arg "timestamp:string='2026-06-20T00:00:00.000Z'"
```

The script prints the real `record_resolution` deploy hash:

```txt
Deploy hash: <64-character-hex-deploy-hash>
Explorer: https://testnet.cspr.live/transaction/<deploy-hash>
```

## 5. Verify On Explorer

Open:

```txt
https://testnet.cspr.live/transaction/<deploy-hash>
```

Look for:

- network: Casper Testnet
- status: success / executed
- entry point: `record_resolution`
- contract hash: your `CASPER_CONTRACT_HASH`

## 6. Paste Deploy Hash In The App

The app normally captures the deploy hash automatically when you click `Submit real Testnet deploy` on:

```txt
/projects/<projectId>/resolution
```

If you generated the hash manually with the script, use it as the deploy hash shown in the Casper proof panel and verify it through the explorer link:

```txt
https://testnet.cspr.live/transaction/<deploy-hash>
```

## Demo Fallback

For Vercel demo mode, leave these unset:

```txt
CASPER_CONTRACT_HASH
CASPER_ACCOUNT_PUBLIC_KEY
CASPER_SECRET_KEY_PATH
```

The app will stay in demo proof mode and will not claim real on-chain confirmation.
