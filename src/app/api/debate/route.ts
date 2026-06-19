import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { runDebate } from "@/server/debate/debate-orchestrator";
import { debateRequestSchema } from "@/server/debate/debate-schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = debateRequestSchema.parse(body);
    const debate = await runDebate(input);

    return NextResponse.json(debate);
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
          error: "Invalid debate request.",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Debate route failed.", error);

    return NextResponse.json(
      { error: "Debate generation failed. Please try again." },
      { status: 500 }
    );
  }
}
