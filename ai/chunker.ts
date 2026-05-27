export interface TextChunk {
  index: number;
  text: string;
}

export function chunkTextByParagraphs(
  text: string,
  maxChunkLength = 12000,
): TextChunk[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const chunks: TextChunk[] = [];
  let current = "";
  let index = 0;

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length > maxChunkLength && current.length) {
      chunks.push({ index, text: current });
      index += 1;
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current.length) {
    chunks.push({ index, text: current });
  }

  return chunks;
}
