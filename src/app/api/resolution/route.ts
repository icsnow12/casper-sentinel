import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { buildResolution } from "@/server/committee/resolution";
import { resolutionRequestSchema } from "@/server/committee/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = resolutionRequestSchema.parse(body);
    const resolution = await buildResolution(input);

    return NextResponse.json(resolution);
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
          error: "Invalid resolution request.",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Resolution route failed.", error);

    return NextResponse.json(
      { error: "Resolution generation failed. Please try again." },
      { status: 500 }
    );
  }
}
