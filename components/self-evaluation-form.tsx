"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const questions = [
  "Is the problem clearly defined?",
  "Are competencies demonstrated?",
  "Are sources reliable?",
  "Is documentation complete?",
];

export function SelfEvaluationForm() {
  const [answers, setAnswers] = useState<number[]>([3, 3, 3, 3]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ readiness: number; recommendation: string } | null>(
    null,
  );

  const submit = async () => {
    setLoading(true);
    const response = await fetch("/api/self-evaluation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      setResult(data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Self-Evaluation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question, index) => (
          <div key={question}>
            <p className="mb-2 text-sm font-medium">{question}</p>
            <input
              type="range"
              min={1}
              max={5}
              value={answers[index]}
              onChange={(e) => {
                const updated = [...answers];
                updated[index] = Number(e.target.value);
                setAnswers(updated);
              }}
              className="w-full"
            />
          </div>
        ))}
        <Button onClick={submit} disabled={loading}>
          {loading ? "Evaluating..." : "Calculate Readiness"}
        </Button>
        {result && (
          <div className="rounded-xl border border-border p-3">
            <p className="mb-2 text-sm font-semibold">Readiness Score: {result.readiness}%</p>
            <Progress value={result.readiness} />
            <p className="mt-2 text-sm text-muted-foreground">{result.recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
