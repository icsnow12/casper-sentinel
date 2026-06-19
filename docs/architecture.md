# Casper Sentinel Architecture

Casper Sentinel is an autonomous VC DAO for Web3, DeFi, and RWA project evaluation.

## System Flow

```txt
Project Intake
-> Multi-Agent AI Diligence
-> Agent Voting
-> Committee Resolution
-> Decision Payload
-> SHA-256 Hash
-> Casper Testnet Proof
```

## Application Layers

Frontend:

- Next.js 15 App Router
- Tailwind CSS v4
- shadcn/ui
- Dark venture terminal interface
- Guided `/demo` judge flow

Server:

- API route handlers
- Zod validation
- OpenAI SDK agent runner
- Committee voting engine
- Casper recording adapter

Data:

- Prisma schema for DAO, project, agent, vote, reputation, resolution, and on-chain records
- SQLite intended for MVP persistence
- Demo mode currently avoids persistence for reliability

## Agent Engine

The agent engine is in `src/server/agents`.

Agents:

- Technical Agent
- Market Agent
- Security Agent
- Compliance Agent
- Treasury Agent

Each agent returns a structured Zod-validated output. If OpenAI credentials are unavailable, the engine returns realistic mock outputs.

## Committee Layer

The committee layer is in `src/server/committee`.

Responsibilities:

- Convert agent recommendations into formal votes
- Apply domain weights
- Apply demo trust scores
- Generate debate transcript
- Identify disagreements
- Produce final resolution
- Build decision payload
- Generate SHA-256 decision hash

Weighted scoring:

- Technical: 20%
- Market: 15%
- Security: 25%
- Compliance: 20%
- Treasury: 20%

## Casper Layer

The Casper layer is in `src/server/casper`.

Responsibilities:

- Build canonical Testnet payloads
- Generate payload hash
- Prepare signing message
- Attempt real RPC submission when signed payloads are supplied
- Fall back to demo proof when wallet/RPC is unavailable
- Return explorer-style proof URLs

The MVP keeps sensitive diligence off-chain and anchors only hashable decision data.
