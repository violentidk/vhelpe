import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompetencyRadar } from "@/components/competency-radar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CompetencyItem } from "@/types/analysis";

export default async function CompetencyPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: analysis } = await supabase
    .from("thesis_analyses")
    .select("competency_breakdown,competencies_missing,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const competency = ((analysis?.competency_breakdown as CompetencyItem[]) ?? []).slice(0, 8);
  const missing = (analysis?.competencies_missing as string[] | null) ?? [];

  return (
    <AppShell>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Competency Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {competency.length ? (
              <CompetencyRadar data={competency} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Upload and analyze a thesis to generate competency mapping.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Competency Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {competency.map((item) => (
                <div key={item.name} className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">{item.name}</p>
                    <Badge variant={item.score >= 75 ? "success" : "warning"}>
                      {item.score}%
                    </Badge>
                  </div>
                  <Progress value={item.score} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Confidence: {item.confidence}% | {item.evidence}
                  </p>
                </div>
              ))}
              {!competency.length && (
                <p className="text-sm text-muted-foreground">No competency data yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Missing Competencies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {missing.map((item) => (
                <div key={item} className="rounded-lg border border-border p-2 text-sm">
                  {item}
                </div>
              ))}
              {!missing.length && (
                <Badge variant="success">No missing competency detected in latest analysis.</Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
