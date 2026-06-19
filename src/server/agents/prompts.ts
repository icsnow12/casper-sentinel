import type { AgentType, EvaluationRequest } from "./schemas";

export type AgentDefinition = {
  type: AgentType;
  name: string;
  mission: string;
  focusAreas: string[];
};

export const agentDefinitions: AgentDefinition[] = [
  {
    type: "TECHNICAL",
    name: "Technical Agent",
    mission:
      "Evaluate the architecture, engineering maturity, protocol feasibility, repository quality, and implementation risk.",
    focusAreas: [
      "protocol architecture",
      "repository maturity",
      "developer velocity",
      "technical feasibility",
      "dependency and integration risk",
    ],
  },
  {
    type: "MARKET",
    name: "Market Agent",
    mission:
      "Evaluate market opportunity, competitive positioning, adoption potential, liquidity assumptions, and category timing.",
    focusAreas: [
      "target market",
      "competitive landscape",
      "go-to-market motion",
      "demand drivers",
      "ecosystem fit",
    ],
  },
  {
    type: "SECURITY",
    name: "Security Agent",
    mission:
      "Evaluate smart contract, custody, operational, dependency, and infrastructure security risks.",
    focusAreas: [
      "smart contract risk",
      "custody model",
      "admin key exposure",
      "audit readiness",
      "attack surface",
    ],
  },
  {
    type: "COMPLIANCE",
    name: "Compliance Agent",
    mission:
      "Evaluate regulatory, securities, AML, sanctions, disclosure, and RWA legal-structure risks.",
    focusAreas: [
      "securities indicators",
      "jurisdictional exposure",
      "KYC and AML posture",
      "RWA enforceability",
      "disclosure quality",
    ],
  },
  {
    type: "TREASURY",
    name: "Treasury Agent",
    mission:
      "Evaluate tokenomics, runway, emissions, unlock schedules, treasury concentration, and capital efficiency.",
    focusAreas: [
      "token supply design",
      "unlock and vesting risk",
      "treasury runway",
      "liquidity depth",
      "capital allocation discipline",
    ],
  },
];

export function getAgentDefinition(agentType: AgentType) {
  return agentDefinitions.find((agent) => agent.type === agentType);
}

export function buildProjectContext(input: EvaluationRequest) {
  const whitepaper = input.whitepaper ?? input.whitepaperText ?? "";
  const repository = input.githubRepository ?? input.githubUrl ?? "Not provided";
  const tokenFacts = [
    input.tokenInformation,
    input.tokenSymbol ? `Symbol: ${input.tokenSymbol}` : undefined,
    input.tokenAddress ? `Address: ${input.tokenAddress}` : undefined,
    input.tokenNetwork ? `Network: ${input.tokenNetwork}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    `Project name: ${input.projectName}`,
    `Category: ${input.category ?? "Unspecified"}`,
    `Repository: ${repository}`,
    `Token information:\n${tokenFacts || "Not provided"}`,
    `Whitepaper or memo:\n${whitepaper || "Not provided"}`,
  ].join("\n\n");
}

export function buildAgentInstructions(agent: AgentDefinition) {
  return [
    `You are the ${agent.name} for Casper Sentinel, an autonomous VC DAO evaluating Web3, DeFi, and RWA investments.`,
    agent.mission,
    "Return only the structured output requested by the schema.",
    "Do not invent external facts. When source material is thin, lower confidence and mark evidence as MODEL_INFERENCE.",
    "Use concise, investment-committee language. Scores are 0-100, where higher score is better, higher risk means more risk, and higher confidence means stronger confidence in the assessment.",
    `Focus areas: ${agent.focusAreas.join(", ")}.`,
  ].join("\n\n");
}
