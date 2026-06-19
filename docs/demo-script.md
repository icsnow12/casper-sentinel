# Casper Sentinel Demo Script

Use this script for a 3-5 minute hackathon judging walkthrough.

## Setup

Run the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

No OpenAI key, Casper Wallet, or testnet funds are required.

## Talk Track

1. Landing Page

   "Casper Sentinel is an autonomous VC DAO. It turns Web3 and RWA investment diligence into a transparent agent voting process, then prepares the final resolution for Casper Testnet recording."

2. Run Live Demo

   Click `Run Live Demo`.

   "This one-click path is designed for judges. It uses a demo RWA credit project and executes the full workflow."

3. Project Intake

   "The system starts with project materials: whitepaper context, GitHub repository, token network, and category."

4. AI Agents Analyze

   "Five specialized agents independently assess the project: technical, market, security, compliance, and treasury."

5. Agent Votes

   "Each agent casts a formal investment vote. Votes are adjusted by reputation scores, so stronger historical agents have more influence without fully controlling the DAO."

6. Committee Resolution

   "The committee synthesizes agent disagreements, applies weighted scoring, generates an investment memo, and produces a final recommendation."

7. Casper Testnet Proof

   "The final resolution becomes a canonical payload. Casper Sentinel hashes it with SHA-256 and prepares it for Casper Testnet recording. Demo proof mode works without a wallet."

## Key Routes

- `/demo`
- `/projects/harbor-rwa-credit/agents`
- `/projects/harbor-rwa-credit/committee`
- `/projects/harbor-rwa-credit/resolution`

## Backup Plan

If live APIs are unavailable, the app automatically uses demo mode. This is intentional and hackathon-safe.
