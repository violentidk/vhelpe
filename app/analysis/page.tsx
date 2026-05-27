import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AnalysisListPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("thesis_analyses")
    .select("id,summary,scores,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <AppShell>
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(data ?? []).map((item) => {
            const score = (item.scores as Record<string, number>)?.overall ?? 0;
            return (
              <Link
                key={item.id}
                href={`/analysis/${item.id}`}
                className="block rounded-xl border border-border p-3 transition hover:bg-muted/50"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">Analysis {new Date(item.created_at).toLocaleString()}</p>
                  <Badge variant={score >= 75 ? "success" : "warning"}>{score}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.summary}</p>
              </Link>
            );
          })}
          {!data?.length && <p className="text-sm text-muted-foreground">No analysis yet.</p>}
        </CardContent>
      </Card>
    </AppShell>
  );
}
