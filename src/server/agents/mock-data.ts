import type { AgentOutput, AgentType, EvaluationRequest } from "./schemas";

const templates: Record<AgentType, Omit<AgentOutput, "agentType">> = {
  TECHNICAL: {
    summary:
      "The technical profile shows a credible protocol concept with a clear Casper integration path, but the current materials need stronger implementation evidence before the DAO treats the project as production ready.",
    strengths: [
      "Architecture narrative is coherent and maps cleanly to Web3 infrastructure workflows.",
      "Repository and protocol scope suggest the team understands integration boundaries.",
      "Casper alignment creates a plausible execution environment for future on-chain records.",
    ],
    concerns: [
      "Repository maturity cannot yet prove sustained engineering velocity.",
      "Testing, deployment automation, and failure-mode documentation need more detail.",
      "The whitepaper should separate implemented components from roadmap claims.",
    ],
    redFlags: [
      "No independent production audit or formal verification evidence was provided.",
    ],
    score: 76,
    confidence: 72,
    risk: 44,
    recommendation: "DILIGENCE_REQUIRED",
    evidence: [
      {
        label: "Architecture claims require implementation proof",
        source: "WHITEPAPER",
        excerpt:
          "Project materials describe the system architecture but do not fully map it to tested releases.",
      },
      {
        label: "Repository supplied for engineering review",
        source: "GITHUB",
      },
      {
        label: "Casper integration path is technically plausible",
        source: "MODEL_INFERENCE",
      },
    ],
  },
  MARKET: {
    summary:
      "The market case is attractive for a Web3/RWA venture terminal, with visible demand for better diligence and governance workflows, though distribution and wedge clarity need sharpening.",
    strengths: [
      "Targets a concrete pain point for venture teams, DAOs, and Web3 treasury managers.",
      "RWA and DeFi diligence remain underserved by auditable agentic workflows.",
      "Casper ecosystem positioning gives the project a differentiated chain-native narrative.",
    ],
    concerns: [
      "Customer acquisition motion is not yet backed by named design partners.",
      "Competitive positioning versus analytics terminals and DAO tooling needs more precision.",
      "Revenue model assumptions need proof through pilots or signed LOIs.",
    ],
    redFlags: [],
    score: 82,
    confidence: 70,
    risk: 38,
    recommendation: "INVEST_SMALL",
    evidence: [
      {
        label: "Clear buyer pain in investment governance",
        source: "USER_INPUT",
      },
      {
        label: "Market wedge depends on workflow adoption",
        source: "MODEL_INFERENCE",
      },
      {
        label: "Category benefits from RWA and DeFi compliance pressure",
        source: "MODEL_INFERENCE",
      },
    ],
  },
  SECURITY: {
    summary:
      "Security posture is investable only with additional diligence. The project can be evaluated at the application and governance layer now, but smart-contract and custody risks need explicit controls.",
    strengths: [
      "Hash-only on-chain recording limits sensitive data exposure.",
      "DAO decision records can be audited without publishing full private diligence.",
      "The proposed architecture separates UI, agent runtime, persistence, and chain adapter concerns.",
    ],
    concerns: [
      "Smart contract upgrade authority and admin-key policy are not yet specified.",
      "No custody model, incident response process, or key rotation plan is documented.",
      "Dependency and prompt-injection threat models should be formalized before production.",
    ],
    redFlags: [
      "A Casper contract audit should be required before mainnet usage.",
      "Wallet signing flows must never expose private keys or raw secrets to the backend.",
    ],
    score: 69,
    confidence: 74,
    risk: 61,
    recommendation: "DILIGENCE_REQUIRED",
    evidence: [
      {
        label: "On-chain storage minimized to hashes",
        source: "WHITEPAPER",
      },
      {
        label: "Contract audit evidence missing",
        source: "USER_INPUT",
      },
      {
        label: "Security model requires wallet and contract review",
        source: "MODEL_INFERENCE",
      },
    ],
  },
  COMPLIANCE: {
    summary:
      "The compliance profile is manageable for a tooling company but becomes higher risk if the DAO presents recommendations as personalized investment advice or handles regulated RWA assets directly.",
    strengths: [
      "The product can frame outputs as diligence support rather than automatic financial advice.",
      "Hash anchoring avoids placing sensitive documents or personal data directly on-chain.",
      "RWA review can become a durable compliance differentiator if evidence standards are enforced.",
    ],
    concerns: [
      "Investment recommendation wording needs disclaimers and jurisdiction-aware controls.",
      "RWA projects require document provenance, asset custody, and counterparty checks.",
      "DAO governance could create accountability ambiguity without member policy controls.",
    ],
    redFlags: [
      "Do not permit sanctioned counterparties, opaque issuers, or unverifiable asset claims into the voting flow.",
    ],
    score: 71,
    confidence: 68,
    risk: 56,
    recommendation: "DILIGENCE_REQUIRED",
    evidence: [
      {
        label: "Investment language creates regulatory sensitivity",
        source: "MODEL_INFERENCE",
      },
      {
        label: "Hash-only records reduce data publication risk",
        source: "WHITEPAPER",
      },
      {
        label: "RWA diligence requires legal evidence",
        source: "USER_INPUT",
      },
    ],
  },
  TREASURY: {
    summary:
      "Treasury quality is promising but incomplete. The project needs explicit token supply, runway, unlock, and liquidity details before the DAO can size an investment confidently.",
    strengths: [
      "The proposal can support treasury governance through auditable decision records.",
      "Agent reputation and voting weights create a path to disciplined allocation.",
      "Casper anchoring gives the DAO a credible control surface for historical decisions.",
    ],
    concerns: [
      "Token supply, emissions, and vesting data are not yet sufficient for a full allocation view.",
      "Runway and burn assumptions need founder-provided financial detail.",
      "Liquidity assumptions should include market-maker dependency and lockup risk.",
    ],
    redFlags: [
      "Material insider unlocks would require an automatic vote-weight penalty or investment cap.",
    ],
    score: 74,
    confidence: 64,
    risk: 52,
    recommendation: "WATCHLIST",
    evidence: [
      {
        label: "Token details are not complete enough for full sizing",
        source: "TOKEN",
      },
      {
        label: "DAO decision discipline improves treasury process",
        source: "MODEL_INFERENCE",
      },
      {
        label: "Runway and unlock disclosures are required",
        source: "USER_INPUT",
      },
    ],
  },
};

export function buildMockAgentOutput(
  agentType: AgentType,
  input: EvaluationRequest
): AgentOutput {
  const template = templates[agentType];
  const repository = input.githubRepository ?? input.githubUrl;

  return {
    agentType,
    ...template,
    evidence: template.evidence.map((item) => ({
      ...item,
      url: item.source === "GITHUB" && repository ? repository : item.url,
    })),
  };
}

export function buildMockAgentOutputs(input: EvaluationRequest): AgentOutput[] {
  return (Object.keys(templates) as AgentType[]).map((agentType) =>
    buildMockAgentOutput(agentType, input)
  );
}
