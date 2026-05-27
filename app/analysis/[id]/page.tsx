import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MentorChat } from "@/components/mentor-chat";
import { PdfExportButton } from "@/components/pdf-export-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: analysis } = await supabase
    .from("thesis_analyses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!analysis) notFound();

  const scores = analysis.scores as Record<string, number>;

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xl">Analysis Report</h2>
          <PdfExportButton />
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Summary</CardTitle>
            <Badge variant={scores.overall >= 75 ? "success" : "warning"}>
              Readiness {scores.overall}%
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{analysis.summary}</p>
            <div className="mt-4 grid gap-2 text-sm md:grid-cols-4">
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">Formatting</p>
                <p className="text-2xl font-semibold">{scores.formatting}%</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">Content</p>
                <p className="text-2xl font-semibold">{scores.content}%</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">Competencies</p>
                <p className="text-2xl font-semibold">{scores.competencies}%</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">Overall</p>
                <p className="text-2xl font-semibold">{scores.overall}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Detected Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {(analysis.issues as string[]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Missing Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {(analysis.missing_sections as string[]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {(analysis.recommendations as string[]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Critical Risks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {(analysis.critical_risks as string[]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <MentorChat />
      </div>
    </AppShell>
  );
}
