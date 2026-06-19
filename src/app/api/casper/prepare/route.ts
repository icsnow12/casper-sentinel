import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { buildPreparedTransaction } from "@/server/casper/payload";
import { casperPrepareRequestSchema } from "@/server/casper/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = casperPrepareRequestSchema.parse(body);

    return NextResponse.json(buildPreparedTransaction(input));
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid Casper prepare request.",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Casper prepare route failed.", error);

    return NextResponse.json(
      { error: "Casper payload preparation failed." },
      { status: 500 }
    );
  }
}
