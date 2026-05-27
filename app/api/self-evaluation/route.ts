import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { selfEvaluationSchema } from "@/lib/validation";

export const runtime = "nodejs";

const prompts = [
  "Is the problem clearly defined?",
  "Are competencies demonstrated?",
  "Are sources reliable?",
  "Is documentation complete?",
];

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const parsedBody = selfEvaluationSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Expected 4 questionnaire answers." }, { status: 400 });
    }
    const { answers } = parsedBody.data;

    const readiness = Math.round(
      (answers.reduce((total, value) => total + Number(value || 0), 0) / (4 * 5)) * 100,
    );
    const recommendation =
      readiness >= 80
        ? "Ready for submission with minor polishing."
        : readiness >= 60
          ? "Promising draft, but improve weak areas before submitting."
          : "Not ready yet. Focus on structure, competency evidence, and references.";

    const service = createServiceSupabaseClient();
    await service.from("self_evaluations").insert({
      user_id: user.id,
      prompts,
      answers,
      readiness_score: readiness,
      recommendation,
    });

    return NextResponse.json({
      readiness,
      recommendation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
