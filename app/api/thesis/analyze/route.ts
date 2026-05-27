import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { extractThesisText } from "@/services/file-parser";
import { runThesisAnalysisPipeline } from "@/services/analysis-service";
import { getServerEnv } from "@/lib/env/server";

export const runtime = "nodejs";
export const maxDuration = 300;

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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const maxBytes = serverEnv.MAX_UPLOAD_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: `File exceeds ${serverEnv.MAX_UPLOAD_MB}MB limit.`,
        },
        { status: 413 },
      );
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(fileExtension || "")) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF or DOCX." },
        { status: 400 },
      );
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const text = await extractThesisText(file);
    if (text.trim().length < 250) {
      return NextResponse.json(
        { error: "Extracted thesis text is too short to analyze." },
        { status: 400 },
      );
    }

    const service = createServiceSupabaseClient();
    const bucket = serverEnv.SUPABASE_STORAGE_BUCKET;
    const path = `${user.id}/${Date.now()}-${safeFileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await service.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type || "application/octet-stream" });

    if (uploadError) {
      throw uploadError;
    }

    const { data: thesis, error: thesisError } = await service
      .from("theses")
      .insert({
        user_id: user.id,
        title: safeFileName.replace(/\.(pdf|docx)$/i, ""),
        file_name: safeFileName,
        file_path: path,
        mime_type: file.type,
        raw_text: text.slice(0, 500000),
      })
      .select("id")
      .single();

    if (thesisError || !thesis) {
      throw thesisError ?? new Error("Failed to save thesis metadata.");
    }

    const analysis = await runThesisAnalysisPipeline(text, {
      maxChunks: serverEnv.MAX_ANALYSIS_CHUNKS,
    });
    const now = new Date().toISOString();

    const { data: savedAnalysis, error: analysisError } = await service
      .from("thesis_analyses")
      .insert({
        thesis_id: thesis.id,
        user_id: user.id,
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
      user_id: user.id,
      version_label: `Analysis ${new Date().toLocaleString()}`,
      notes: `Auto-generated after upload (${analysis.chunkCount} chunk(s)).`,
    });

    return NextResponse.json({
      thesis_id: thesis.id,
      analysis_id: savedAnalysis.id,
      report: savedAnalysis,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
