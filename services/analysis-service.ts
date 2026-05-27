import { chunkTextByParagraphs } from "@/ai/chunker";
import { aggregateFinalAnalysis, analyzeChunk } from "@/ai/gemini";

interface PipelineOptions {
  maxChunks?: number;
}

export async function runThesisAnalysisPipeline(
  thesisText: string,
  options: PipelineOptions = {},
) {
  const chunks = chunkTextByParagraphs(thesisText, 10000);
  if (!chunks.length) {
    throw new Error("Could not extract enough text from file.");
  }
  if (options.maxChunks && chunks.length > options.maxChunks) {
    throw new Error(
      `Thesis is too large for one analysis run (${chunks.length} chunks). Reduce content size or split the document.`,
    );
  }

  const chunkSummaries: string[] = [];
  for (const chunk of chunks) {
    // Keep order deterministic to improve consistency of final synthesis.
    // For very large documents you can move to controlled parallelism.
    const summary = await analyzeChunk(chunk.text, chunk.index);
    chunkSummaries.push(summary);
  }

  const { report, competency } = await aggregateFinalAnalysis(chunkSummaries);

  return {
    chunkCount: chunks.length,
    chunkSummaries,
    report,
    competency,
  };
}
