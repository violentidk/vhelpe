import mammoth from "mammoth";
import pdfParse from "pdf-parse";

function fileToBuffer(file: File): Promise<Buffer> {
  return file.arrayBuffer().then((ab) => Buffer.from(ab));
}

export async function extractThesisTextFromBuffer(
  buffer: Buffer,
  fileName: string,
): Promise<string> {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "pdf") {
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  if (extension === "docx") {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value;
  }

  throw new Error("Unsupported file type. Please upload PDF or DOCX.");
}

export async function extractThesisText(file: File): Promise<string> {
  const buffer = await fileToBuffer(file);
  return extractThesisTextFromBuffer(buffer, file.name);
}
