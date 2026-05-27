import Link from "next/link";
import { ArrowRight, FileSearch2, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-atmosphere p-6 md:p-10">
      <main className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              VIKK AI Platform
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-5xl">
              VIKK Exam Thesis Assistant
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-lg text-muted-foreground">
            ChatGPT-style thesis assistant for VIKK IT-susteemide nooremspetsialisti
            students. Upload PDF or DOCX, get AI evaluation, competency coverage, readiness
            score, and a concrete improvement roadmap.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch2 className="h-4 w-4 text-primary" /> Smart Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Chunk-based AI processing checks structure, formatting, missing sections,
              sources, and technical depth.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Competency Mapping
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Radar charts and confidence scores highlight which competencies are covered and
              what still needs evidence.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Mentor
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Ask for chapter-level improvement ideas, stronger arguments, and submission
              readiness guidance.
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <Link href="/register">
            <Button size="lg">
              Start Thesis Analysis <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
