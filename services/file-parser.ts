import mammoth from "mammoth";
import pdfParse from "pdf-parse";

function fileToBuffer(file: File): Promise<Buffer> {
  return file.arrayBuffer().then((ab) => Buffer.from(ab));
}

export async function extractThesisText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const buffer = await fileToBuffer(file);

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
