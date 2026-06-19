import { NextResponse } from "next/server";

import { getCasperRecordingStatus } from "@/server/casper/transaction-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const transactionHash = url.searchParams.get("transactionHash");
  const mode = url.searchParams.get("mode") === "REAL" ? "REAL" : "DEMO";

  if (!transactionHash || !/^[a-f0-9]{64}$/.test(transactionHash)) {
    return NextResponse.json(
      { error: "A valid transactionHash query parameter is required." },
      { status: 400 }
    );
  }

  const status = await getCasperRecordingStatus(transactionHash, mode);

  return NextResponse.json(status);
}
