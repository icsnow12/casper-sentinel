import {
  BadgeCheck,
  Banknote,
  Boxes,
  BrainCircuit,
  FileCheck2,
  Gavel,
  LockKeyhole,
  ShieldCheck,
  TrendingUp,
  Vote,
} from "lucide-react";

export const daoStats = [
  {
    label: "DAO capital watched",
    value: "$42.8M",
    delta: "+18.4%",
    tone: "text-emerald-300",
  },
  {
    label: "Active proposals",
    value: "12",
    delta: "4 in review",
    tone: "text-sky-300",
  },
  {
    label: "Agent trust median",
    value: "84%",
    delta: "+6 pts",
    tone: "text-amber-200",
  },
  {
    label: "Casper records",
    value: "128",
    delta: "testnet",
    tone: "text-rose-200",
  },
];

export const marketplaceAgents = [
  {
    name: "Technical Agent",
    category: "Protocol",
    trust: 91,
    weight: "1.28x",
    status: "Enabled",
    icon: BrainCircuit,
  },
  {
    name: "Security Agent",
    category: "Risk",
    trust: 94,
    weight: "1.42x",
    status: "Enabled",
    icon: ShieldCheck,
  },
  {
    name: "Compliance Agent",
    category: "RWA",
    trust: 82,
    weight: "1.10x",
    status: "Enabled",
    icon: FileCheck2,
  },
  {
    name: "Treasury Agent",
    category: "Token",
    trust: 78,
    weight: "0.96x",
    status: "Enabled",
    icon: Banknote,
  },
  {
    name: "Governance Agent",
    category: "DAO",
    trust: 73,
    weight: "0.88x",
    status: "Disabled",
    icon: Gavel,
  },
];

export const recentProposals = [
  {
    project: "Harbor RWA Credit",
    category: "RWA",
    stage: "Agent voting",
    score: 78,
    risk: "Medium",
    recommendation: "Invest small",
  },
  {
    project: "ZK Vault Router",
    category: "DeFi",
    stage: "DAO review",
    score: 64,
    risk: "High",
    recommendation: "Diligence required",
  },
  {
    project: "CasperPay Rails",
    category: "Infrastructure",
    stage: "On-chain pending",
    score: 86,
    risk: "Low",
    recommendation: "Invest",
  },
];

export const submissionSteps = [
  {
    title: "Project intake",
    description: "Capture whitepaper, repository, token, and RWA context.",
    icon: Boxes,
  },
  {
    title: "Agent marketplace",
    description: "Select the enabled DAO agents that will evaluate and vote.",
    icon: BadgeCheck,
  },
  {
    title: "Weighted vote",
    description: "Reputation-adjusted agent votes become a DAO resolution.",
    icon: Vote,
  },
  {
    title: "Casper record",
    description: "Final proposal and decision hashes are anchored on testnet.",
    icon: LockKeyhole,
  },
];

export const landingSignals = [
  { label: "Technical", value: 88, color: "bg-emerald-300" },
  { label: "Security", value: 74, color: "bg-sky-300" },
  { label: "Market", value: 81, color: "bg-amber-200" },
  { label: "Compliance", value: 69, color: "bg-rose-300" },
  { label: "Treasury", value: 77, color: "bg-violet-300" },
];

export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: TrendingUp },
  { label: "New proposal", href: "/projects/new", icon: Vote },
  { label: "Marketplace", href: "/dashboard#marketplace", icon: BadgeCheck },
  { label: "Governance", href: "/dashboard#governance", icon: Gavel },
];
