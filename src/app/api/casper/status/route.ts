import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NETWORK = "Casper Testnet";
const CHAIN_NAME = "casper-test";
const EXPLORER_BASE_URL = "https://testnet.cspr.live/transaction";

function buildExplorerUrl(transactionHash: string) {
  return `${EXPLORER_BASE_URL}/${transactionHash}`;
}

function hasRealCasperStatusConfig() {
  return Boolean(
    process.env.CASPER_CONTRACT_HASH &&
      process.env.CASPER_ACCOUNT_PUBLIC_KEY &&
      process.env.CASPER_SECRET_KEY_PATH
  );
}

function demoProofStatus(transactionHash: string, contractHash?: string | null) {
  return {
    mode: "DEMO",
    network: NETWORK,
    chainName: CHAIN_NAME,
    contractHash: contractHash ?? undefined,
    status: "DEMO_PROOF",
    transactionHash,
    explorerUrl: buildExplorerUrl(transactionHash),
    checkedAt: new Date().toISOString(),
    message:
      "Demo proof mode is active. No Casper Testnet confirmation is claimed.",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const transactionHash = url.searchParams.get("transactionHash");
  const requestedMode = url.searchParams.get("mode") === "REAL" ? "REAL" : "DEMO";
  const contractHash =
    url.searchParams.get("contractHash") ?? process.env.CASPER_CONTRACT_HASH;

  if (!transactionHash || !/^[a-f0-9]{64}$/.test(transactionHash)) {
    return NextResponse.json(
      { error: "A valid transactionHash query parameter is required." },
      { status: 400 }
    );
  }

  if (requestedMode !== "REAL" || !hasRealCasperStatusConfig()) {
    return NextResponse.json(demoProofStatus(transactionHash, contractHash));
  }

  try {
    const { getCasperRecordingStatus } = await import(
      "@/server/casper/transaction-service"
    );
    const status = await getCasperRecordingStatus(
      transactionHash,
      "REAL",
      contractHash ?? undefined
    );

    return NextResponse.json(status);
  } catch (error) {
    console.error(
      "Casper status real-mode check failed; returning demo proof status.",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(demoProofStatus(transactionHash, contractHash));
  }
}
