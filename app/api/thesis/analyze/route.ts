import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { extractThesisText, extractThesisTextFromBuffer } from "@/services/file-parser";
import { runThesisAnalysisPipeline } from "@/services/analysis-service";
import { getServerEnv } from "@/lib/env/server";
import { thesisAnalyzeStorageSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 300;

interface PreparedThesisInput {
  safeFileName: string;
  storagePath: string;
  mimeType: string | null;
  text: string;
}

function getSafeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function assertSupportedFile(fileName: string) {
  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  if (!["pdf", "docx"].includes(fileExtension || "")) {
    throw new Error("Unsupported file type. Use PDF or DOCX.");
  }
}

async function persistAnalysis(
  userId: string,
  thesisInput: PreparedThesisInput,
  maxAnalysisChunks: number,
) {
  const service = createServiceSupabaseClient();

  const { data: thesis, error: thesisError } = await service
    .from("theses")
    .insert({
      user_id: userId,
      title: thesisInput.safeFileName.replace(/\.(pdf|docx)$/i, ""),
      file_name: thesisInput.safeFileName,
      file_path: thesisInput.storagePath,
      mime_type: thesisInput.mimeType,
      raw_text: thesisInput.text.slice(0, 500000),
    })
    .select("id")
    .single();

  if (thesisError || !thesis) {
    throw thesisError ?? new Error("Failed to save thesis metadata.");
  }

  const analysis = await runThesisAnalysisPipeline(thesisInput.text, {
    maxChunks: maxAnalysisChunks,
  });
  const now = new Date().toISOString();

  const { data: savedAnalysis, error: analysisError } = await service
    .from("thesis_analyses")
    .insert({
      thesis_id: thesis.id,
      user_id: userId,
      summary: analysis.report.summary,
      scores: analysis.report.scores,
      issues: analysis.report.issues,
      missing_sections: analysis.report.missing_sections,
      recommendations: analysis.report.recommendations,
      competencies_missing: analysis.report.competencies_missing,
      critical_risks: analysis.report.critical_risks,
      competency_breakdown: analysis.competency,
      chunk_count: analysis.chunkCount,
      analyzed_at: now,
    })
    .select("id, thesis_id, summary, scores, issues, missing_sections, recommendations, competencies_missing, critical_risks, competency_breakdown, created_at")
    .single();

  if (analysisError || !savedAnalysis) {
    throw analysisError ?? new Error("Failed to save analysis.");
  }

  await service.from("thesis_versions").insert({
    thesis_id: thesis.id,
    analysis_id: savedAnalysis.id,
    user_id: userId,
    version_label: `Analysis ${new Date().toLocaleString()}`,
    notes: `Auto-generated after upload (${analysis.chunkCount} chunk(s)).`,
  });

  return { thesisId: thesis.id, analysisId: savedAnalysis.id, report: savedAnalysis };
}

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

    const maxBytes = serverEnv.MAX_UPLOAD_MB * 1024 * 1024;
    const service = createServiceSupabaseClient();
    const bucket = serverEnv.SUPABASE_STORAGE_BUCKET;
    const contentType = request.headers.get("content-type") || "";

    let thesisInput: PreparedThesisInput | null = null;

    if (contentType.includes("application/json")) {
      const parsedPayload = thesisAnalyzeStorageSchema.safeParse(await request.json());
      if (!parsedPayload.success) {
        return NextResponse.json({ error: "Invalid analysis payload." }, { status: 400 });
      }

      const { storagePath, fileName, mimeType } = parsedPayload.data;
      if (!storagePath.startsWith(`${user.id}/`)) {
        return NextResponse.json({ error: "Invalid storage path." }, { status: 403 });
      }

      const safeFileName = getSafeFileName(fileName);
      assertSupportedFile(safeFileName);

      const { data: storedFile, error: downloadError } = await service.storage
        .from(bucket)
        .download(storagePath);
      if (downloadError || !storedFile) {
        throw downloadError ?? new Error("Failed to download uploaded file.");
      }

      if (storedFile.size > maxBytes) {
        return NextResponse.json(
          {
            error: `File exceeds ${serverEnv.MAX_UPLOAD_MB}MB limit.`,
          },
          { status: 413 },
        );
      }

      const text = await extractThesisTextFromBuffer(
        Buffer.from(await storedFile.arrayBuffer()),
        safeFileName,
      );
      if (text.trim().length < 250) {
        return NextResponse.json(
          { error: "Extracted thesis text is too short to analyze." },
          { status: 400 },
        );
      }

      thesisInput = {
        safeFileName,
        storagePath,
        mimeType: mimeType ?? null,
        text,
      };
    } else {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "File is required." }, { status: 400 });
      }

      if (file.size > maxBytes) {
        return NextResponse.json(
          {
            error: `File exceeds ${serverEnv.MAX_UPLOAD_MB}MB limit.`,
          },
          { status: 413 },
        );
      }

      const safeFileName = getSafeFileName(file.name);
      assertSupportedFile(safeFileName);

      const text = await extractThesisText(file);
      if (text.trim().length < 250) {
        return NextResponse.json(
          { error: "Extracted thesis text is too short to analyze." },
          { status: 400 },
        );
      }

      const storagePath = `${user.id}/${Date.now()}-${safeFileName}`;
      const { error: uploadError } = await service.storage
        .from(bucket)
        .upload(storagePath, Buffer.from(await file.arrayBuffer()), {
          contentType: file.type || "application/octet-stream",
        });

      if (uploadError) {
        throw uploadError;
      }

      thesisInput = {
        safeFileName,
        storagePath,
        mimeType: file.type || null,
        text,
      };
    }

    if (!thesisInput) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const persisted = await persistAnalysis(user.id, thesisInput, serverEnv.MAX_ANALYSIS_CHUNKS);

    return NextResponse.json({
      thesis_id: persisted.thesisId,
      analysis_id: persisted.analysisId,
      report: persisted.report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
