import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { mentorRequestSchema } from "@/lib/validation";
import { getServerEnv } from "@/lib/env/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const serverEnv = getServerEnv();
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const parsedBody = mentorRequestSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    }
    const { message } = parsedBody.data;

    const service = createServiceSupabaseClient();
    const { data: latestAnalysis } = await service
      .from("thesis_analyses")
      .select("summary, recommendations, issues, missing_sections")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const model = new GoogleGenerativeAI(serverEnv.GEMINI_API_KEY).getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `You are an AI thesis mentor for VIKK students.
Keep response practical, short, and actionable.

Latest thesis analysis context (if available):
${JSON.stringify(latestAnalysis ?? null)}

Student question:
${message}`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();

    await service.from("mentor_messages").insert({
      user_id: user.id,
      role: "user",
      content: message,
    });
    await service.from("mentor_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: answer,
    });

    return NextResponse.json({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
