import { NextResponse } from "next/server";
import { z } from "zod";

import { classifyIdea } from "@/lib/project-blueprint/classifier";

const bodySchema = z.object({
  ideaText: z.string().min(20).max(4000),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please describe the idea in a short paragraph." },
        { status: 400 },
      );
    }

    const result = await classifyIdea(parsed.data.ideaText);
    return NextResponse.json(result);
  } catch (error) {
    console.error("classify failed", error);
    return NextResponse.json(
      { error: "Unable to classify the idea right now." },
      { status: 500 },
    );
  }
}
