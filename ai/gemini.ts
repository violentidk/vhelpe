import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import {
  ANALYSIS_JSON_SCHEMA,
  VIKK_REQUIREMENTS,
  VIKK_SYSTEM_PROMPT,
} from "@/ai/system-prompt";
import type { AnalysisJson, CompetencyItem } from "@/types/analysis";
import { getServerEnv } from "@/lib/env/server";

const analysisSchema = z.object({
  summary: z.string(),
  scores: z.object({
    formatting: z.number(),
    content: z.number(),
    competencies: z.number(),
    overall: z.number(),
  }),
  issues: z.array(z.string()),
  missing_sections: z.array(z.string()),
  recommendations: z.array(z.string()),
  competencies_missing: z.array(z.string()),
  critical_risks: z.array(z.string()),
});

const competencySchema = z.object({
  competencies: z.array(
    z.object({
      name: z.string(),
      score: z.number(),
      confidence: z.number(),
      evidence: z.string(),
    }),
  ),
});

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function extractJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Gemini response did not contain JSON.");
    }

    return JSON.parse(match[0]);
  }
}

function getModel() {
  const serverEnv = getServerEnv();
  const client = new GoogleGenerativeAI(serverEnv.GEMINI_API_KEY);
  return client.getGenerativeModel({ model: "gemini-1.5-flash" });
}

async function generateTextWithRetry(prompt: string): Promise<string> {
  const model = getModel();
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;

      const delay = 500 * attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Gemini request failed.");
}

export async function analyzeChunk(chunk: string, chunkIndex: number): Promise<string> {
  const prompt = `${VIKK_SYSTEM_PROMPT}

${VIKK_REQUIREMENTS}

Analyze ONLY this thesis chunk #${chunkIndex + 1}. Return a compact section summary with:
- observed sections in this chunk
- strengths
- weaknesses
- possible requirement gaps

No markdown, plain text only.

CHUNK:
${chunk}`;

  return generateTextWithRetry(prompt);
}

export async function aggregateFinalAnalysis(
  chunkSummaries: string[],
): Promise<{ report: AnalysisJson; competency: CompetencyItem[] }> {
  const combinedPrompt = `${VIKK_SYSTEM_PROMPT}

${VIKK_REQUIREMENTS}

You are given chunk-level analysis summaries from one thesis.
Create a final evaluation report across the whole thesis.

Return ONLY valid JSON using this exact schema:
${ANALYSIS_JSON_SCHEMA}

CHUNK SUMMARIES:
${chunkSummaries.map((c, i) => `[Chunk ${i + 1}]\n${c}`).join("\n\n")}`;

  const rawJson = await generateTextWithRetry(combinedPrompt);
  const parsed = analysisSchema.parse(extractJson(rawJson));

  const report: AnalysisJson = {
    ...parsed,
    scores: {
      formatting: clampScore(parsed.scores.formatting),
      content: clampScore(parsed.scores.content),
      competencies: clampScore(parsed.scores.competencies),
      overall: clampScore(parsed.scores.overall),
    },
  };

  const competencyPrompt = `${VIKK_SYSTEM_PROMPT}

From the same thesis analysis, build competency scoring list for IT systems specialist.
Return JSON only with this shape:
{
  "competencies": [
    { "name": "string", "score": 0, "confidence": 0, "evidence": "string" }
  ]
}
Rules:
- score range 0-100
- confidence range 0-100
- include 6-8 competencies

Input:
${JSON.stringify(report)}`;

  const competencyRaw = await generateTextWithRetry(competencyPrompt);
  const parsedCompetency = competencySchema.parse(extractJson(competencyRaw));

  const competency = parsedCompetency.competencies.map((item) => ({
    ...item,
    score: clampScore(item.score),
    confidence: clampScore(item.confidence),
  }));

  return { report, competency };
}
