import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { runCommittee } from "@/server/committee/committee-agent";
import { committeeRequestSchema } from "@/server/committee/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = committeeRequestSchema.parse(body);
    const committee = await runCommittee(input);

    return NextResponse.json(committee);
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
          error: "Invalid committee request.",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Committee route failed.", error);

    return NextResponse.json(
      { error: "Committee generation failed. Please try again." },
      { status: 500 }
    );
  }
}
