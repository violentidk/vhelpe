import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SelfEvaluationForm } from "@/components/self-evaluation-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: versions }, { data: evaluations }] = await Promise.all([
    supabase
      .from("thesis_versions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("self_evaluations")
      .select("readiness_score,recommendation,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  return (
    <AppShell>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Email: </span>
              {user.email}
            </p>
            <p>
              <span className="text-muted-foreground">User ID: </span>
              {user.id}
            </p>
            {evaluations && (
              <div className="rounded-xl border border-border p-3">
                <p className="font-medium">Latest Self-Evaluation</p>
                <p className="text-sm text-muted-foreground">
                  Readiness: {evaluations.readiness_score}%
                </p>
                <p className="text-xs text-muted-foreground">{evaluations.recommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(versions ?? []).map((version) => (
              <div key={version.id} className="rounded-lg border border-border p-2 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <p>{version.version_label}</p>
                  <Badge variant="outline">
                    {new Date(version.created_at).toLocaleDateString()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{version.notes ?? "No notes"}</p>
              </div>
            ))}
            {!versions?.length && (
              <p className="text-sm text-muted-foreground">
                Version entries appear after thesis analyses.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <SelfEvaluationForm />
        </div>
      </div>
    </AppShell>
  );
}
