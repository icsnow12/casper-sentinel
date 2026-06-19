# Casper Integration

Casper Sentinel implements a hackathon-safe Casper Testnet recording layer.

## Goal

Record proof of a final DAO investment resolution without exposing private diligence materials on-chain.

## Canonical Payload

The on-chain payload contains:

- `projectId`
- `proposalId`
- `recommendation`
- `finalScore`
- `confidenceScore`
- `riskScore`
- `decisionHash`
- `timestamp`

The app computes a SHA-256 payload hash from a stable JSON representation.

## API Routes

Prepare payload:

```txt
POST /api/casper/prepare
```

Submit proof:

```txt
POST /api/casper/submit
```

Check proof status:

```txt
GET /api/casper/status?transactionHash=...&mode=DEMO
```

## Dual Mode

REAL mode:

- Expects a signed Casper transaction or deploy payload.
- Attempts JSON-RPC submission to Casper Testnet.
- Uses `CASPER_TESTNET_RPC_URL`.

DEMO mode:

- Requires no wallet.
- Requires no testnet funds.
- Creates a realistic 64-character transaction hash.
- Returns an explorer-style Testnet URL.
- Uses status `DEMO_RECORDED`.

## Wallet UI

The resolution page includes a Casper Wallet panel.

It shows:

- wallet connected or disconnected
- account public key
- network: Casper Testnet
- decision hash
- transaction hash
- proof status
- timestamp

The wallet connection follows Casper Wallet's injected provider pattern through `window.CasperWalletProvider`.

## Current Limitation

The app does not deploy or call a custom Casper smart contract yet. It prepares and submits proof payloads through a dual-mode adapter. This keeps the buildathon demo safe while preserving a clean path toward a production contract in a later phase.
