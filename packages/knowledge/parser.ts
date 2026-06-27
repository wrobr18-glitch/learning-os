import pdf from "pdf-parse";

export interface PDFParsedResult {
  text: string;
  pages: string[];
}

export interface DocumentChunk {
  id: string;
  pdfName: string;
  content: string;
  pageNum: number;
}

/**
 * Parses text from a PDF Buffer page by page.
 * Note: pdf-parse does not natively return an array of pages,
 * so we use a custom pager split callback to extract text mapped to pages.
 */
export async function parsePdf(pdfBuffer: Buffer): Promise<PDFParsedResult> {
  const pages: string[] = [];

  const options = {
    pagerender: (pageData: any) => {
      return pageData.getTextContent().then((textContent: any) => {
        let lastY = -1;
        let text = "";
        for (const item of textContent.items) {
          if (lastY !== -1 && item.transform[5] !== lastY) {
            text += "\n";
          }
          text += item.str;
          lastY = item.transform[5];
        }
        pages.push(text);
        return text;
      });
    }
  };

  const parsed = await pdf(pdfBuffer, options);
  return {
    text: parsed.text,
    pages
  };
}

/**
 * Splits text into overlapping semantic chunks of specified character size.
 */
export function chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
  const chunks: string[] = [];
  let index = 0;

  const cleanText = text.replace(/\s+/g, " ").trim();

  while (index < cleanText.length) {
    const end = Math.min(index + chunkSize, cleanText.length);
    let chunk = cleanText.substring(index, end);

    // Try to break at a space boundary rather than cutting mid-word
    if (end < cleanText.length) {
      const lastSpace = chunk.lastIndexOf(" ");
      if (lastSpace > chunkSize * 0.7) {
        chunk = chunk.substring(0, lastSpace);
      }
    }

    chunks.push(chunk.trim());
    index += chunk.length - overlap;
    
    // Prevent infinite loops if overlap size is misconfigured
    if (chunk.length <= overlap) break;
  }

  return chunks;
}

/**
 * Maps parsed pages to document chunk objects with unique namespaced IDs
 */
export function createDocumentChunks(pdfName: string, pages: string[]): DocumentChunk[] {
  const docChunks: DocumentChunk[] = [];
  const normalizedPdfName = pdfName.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_").toLowerCase();

  pages.forEach((pageText, idx) => {
    const pageNum = idx + 1;
    const pageChunks = chunkText(pageText, 800, 150);
    
    pageChunks.forEach((chunkContent, chunkIdx) => {
      const chunkId = `doc.${normalizedPdfName}.p${pageNum}.c${chunkIdx + 1}`;
      docChunks.push({
        id: chunkId,
        pdfName,
        content: chunkContent,
        pageNum
      });
    });
  });

  return docChunks;
}
