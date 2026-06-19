import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { casperSubmitRequestSchema } from "@/server/casper/schemas";
import { submitCasperRecording } from "@/server/casper/transaction-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = casperSubmitRequestSchema.parse(body);
    const result = await submitCasperRecording(input);

    return NextResponse.json(result);
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
          error: "Invalid Casper submit request.",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Casper submit route failed.", error);

    return NextResponse.json(
      { error: "Casper recording submission failed." },
      { status: 500 }
    );
  }
}
