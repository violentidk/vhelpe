import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ScoreCard } from "@/components/score-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: analysis }, { data: tasks }] = await Promise.all([
    supabase
      .from("thesis_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("planner_tasks")
      .select("id,status")
      .eq("user_id", user.id),
  ]);

  const scores = (analysis?.scores as Record<string, number> | null) ?? {
    formatting: 0,
    content: 0,
    competencies: 0,
    overall: 0,
  };

  const doneTasks = (tasks ?? []).filter((task) => task.status === "done").length;
  const taskProgress = tasks?.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const checklist = [
    { label: "Title page present", done: !(analysis?.missing_sections ?? []).includes("title page") },
    {
      label: "Technical implementation described",
      done: !(analysis?.missing_sections ?? []).includes("technical implementation"),
    },
    { label: "References section complete", done: !(analysis?.missing_sections ?? []).includes("references") },
    {
      label: "Competency evidence included",
      done: !(analysis?.competencies_missing ?? []).length,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ScoreCard title="Formatting Score" value={scores.formatting ?? 0} hint="Structure and style compliance" />
          <ScoreCard title="Content Score" value={scores.content ?? 0} hint="Analytical and technical quality" />
          <ScoreCard title="Competency Score" value={scores.competencies ?? 0} hint="Demonstrated competency coverage" />
          <ScoreCard title="Overall Readiness" value={scores.overall ?? 0} hint="Submission readiness estimate" />
          <ScoreCard title="Planner Progress" value={taskProgress} hint="Checklist and deadlines completion" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Latest Analysis</CardTitle>
              {analysis ? <Badge variant="success">Analyzed</Badge> : <Badge variant="warning">No upload yet</Badge>}
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="space-y-3">
                  <p className="text-sm">{analysis.summary}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                        Critical Issues
                      </p>
                      <ul className="space-y-1 text-sm">
                        {(analysis.critical_risks as string[]).slice(0, 4).map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 text-red-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                        Improvement Suggestions
                      </p>
                      <ul className="space-y-1 text-sm">
                        {(analysis.recommendations as string[]).slice(0, 4).map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Link href={`/analysis/${analysis.id}`}>
                    <Button variant="outline">Open full report</Button>
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Upload your first thesis draft to generate AI analysis.
                  </p>
                  <Link href="/upload">
                    <Button>Upload Thesis</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border p-2">
                  <span className="text-sm">{item.label}</span>
                  {item.done ? <Badge variant="success">Done</Badge> : <Badge variant="warning">Missing</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
