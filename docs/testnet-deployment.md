# Casper Testnet Deployment

Casper Sentinel keeps demo mode reliable while adding a real Casper Testnet deploy path for final resolution records.

For the shortest deploy-hash runbook, see docs/phase-7b-real-deploy.md.

## Successful Testnet Deployment

The Casper Sentinel governance contract was successfully deployed to Casper Testnet. This is a real public transaction, not a generated demo proof.

- Status: `Success`
- Deploy hash: `3b9a6bccffbc4d1a9972973cb469c038be903a4c452abf1d38136e803b9cfce6`
- Explorer: [View the transaction on Testnet CSPR.live](https://testnet.cspr.live/transaction/3b9a6bccffbc4d1a9972973cb469c038be903a4c452abf1d38136e803b9cfce6)
- Transaction payment: `100 CSPR`
- Consumed gas: `65.29352 CSPR`
- Charged amount: `73.97014 CSPR`
- Caller: `02034b5cccf5c4276ce33c7deddb067392530e2b115862c3a179f55f9349fa45cd22`

No private key or seed phrase is stored or documented in this repository.

## Why A Contract Is Needed

A native Casper transfer can create a deploy hash, but it cannot store the full resolution payload in queryable contract state. Phase 7A therefore uses a minimal resolution-recorder contract, not a DAO treasury contract.

Contract path:

```txt
contracts/casper-sentinel-governance
```

## Compile

```bash
rustup target add wasm32-unknown-unknown
cd contracts/casper-sentinel-governance
cargo build --release --target wasm32-unknown-unknown
```

## Deploy Contract

```bash
casper-client put-deploy \
  --node-address https://node.testnet.casper.network/rpc \
  --chain-name casper-test \
  --secret-key /absolute/path/to/secret_key.pem \
  --payment-amount 100000000000 \
  --session-path target/wasm32-unknown-unknown/release/casper_sentinel_governance.wasm
```

Find the named key `casper_sentinel_governance_contract_hash` and set it as `CASPER_CONTRACT_HASH`.

## Env Vars

```bash
CASPER_TESTNET_RPC_URL="https://node.testnet.casper.network/rpc"
CASPER_CONTRACT_HASH="hash-..."
CASPER_ACCOUNT_PUBLIC_KEY="01..."
CASPER_SECRET_KEY_PATH="/absolute/path/to/secret_key.pem"
```

If any real-mode variable is missing, the app returns demo proof mode.

## App Flow

1. Start the app with real-mode env vars.
2. Open `/projects/harbor-rwa-credit/resolution`.
3. Scroll to `Casper Testnet recording`.
4. Optional: connect Casper Wallet to display the active wallet key.
5. Click `Submit real Testnet deploy`.
6. The API calls `record_resolution`.
7. The panel shows deploy hash, explorer link, network, and confirmation status.

## Manual record_resolution

```bash
casper-client put-deploy \
  --node-address https://node.testnet.casper.network/rpc \
  --chain-name casper-test \
  --secret-key /absolute/path/to/secret_key.pem \
  --payment-amount 3000000000 \
  --session-hash <contract-hash-without-hash-prefix> \
  --session-entry-point record_resolution \
  --session-arg "proposal_id:string='harbor-rwa-credit'" \
  --session-arg "project_id:string='harbor-rwa-credit'" \
  --session-arg "decision_hash:string='<64-char-sha256>'" \
  --session-arg "final_score:u8='74'" \
  --session-arg "recommendation:string='DILIGENCE_REQUIRED'" \
  --session-arg "timestamp:string='2026-06-19T00:00:00.000Z'"
```

## Query

Use `state_get_dictionary_item` with dictionary name `resolutions` and key `proposal_id`. The server helper `queryResolution()` is in `src/server/casper/transaction-service.ts`.

## Limitations

- The browser wallet is not used to create a deploy in Phase 7A; no Casper JS SDK is installed. Real deploys use `casper-client` plus `CASPER_SECRET_KEY_PATH`.
- Do not put private keys or seed phrases in the repo.
- Keep Vercel in demo proof mode unless you have a secure server-side signer.
- Confirmation is conservative: `SUBMITTED` means RPC accepted the deploy; `CONFIRMED` appears only after execution results are returned.

