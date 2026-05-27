import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { plannerTaskCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const service = createServiceSupabaseClient();
  const { data, error } = await service
    .from("planner_tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("deadline", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsedBody = plannerTaskCreateSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid task payload." }, { status: 400 });
  }
  const body = parsedBody.data;

  const service = createServiceSupabaseClient();
  const { data, error } = await service
    .from("planner_tasks")
    .insert({
      user_id: user.id,
      title: body.title,
      deadline: body.deadline,
      progress: body.progress ?? 0,
      status: body.status || "todo",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}
