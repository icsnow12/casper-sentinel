import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { runEvaluation } from "@/server/agents/orchestrator";
import { evaluationRequestSchema } from "@/server/agents/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = evaluationRequestSchema.parse(body);
    const evaluation = await runEvaluation(input);

    return NextResponse.json(evaluation);
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
          error: "Invalid evaluation request.",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Evaluation route failed.", error);

    return NextResponse.json(
      { error: "Evaluation failed. Please try again." },
      { status: 500 }
    );
  }
}
