import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { extractFromPdf, extractFromImage, extractFromText, type ExtractedDocument } from "./document-extract";

/** Routes an uploaded file to the right raw-text/vision extraction path based on its name/type. */
export async function parseUploadedFile(fileName: string, buffer: Buffer, mimeType: string): Promise<ExtractedDocument> {
  const ext = fileName.toLowerCase().split(".").pop() || "";

  if (ext === "pdf" || mimeType === "application/pdf") {
    return extractFromPdf(buffer);
  }

  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext) || mimeType.startsWith("image/")) {
    const normalizedType = mimeType.startsWith("image/") ? mimeType : `image/${ext === "jpg" ? "jpeg" : ext}`;
    return extractFromImage(buffer, normalizedType);
  }

  if (ext === "docx" || mimeType.includes("wordprocessingml")) {
    const { value: text } = await mammoth.extractRawText({ buffer });
    return extractFromText(text);
  }

  if (["xlsx", "xls", "csv"].includes(ext) || mimeType.includes("spreadsheetml") || mimeType === "text/csv") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const text = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      return `--- Sheet: ${name} ---\n${XLSX.utils.sheet_to_csv(sheet)}`;
    }).join("\n\n");
    return extractFromText(text);
  }

  if (ext === "txt" || mimeType === "text/plain") {
    return extractFromText(buffer.toString("utf-8"));
  }

  throw new Error(`Unsupported file type: ${fileName}. Use PDF, Word (.docx), Excel (.xlsx/.csv), or an image.`);
}
