import { DEFAULT_CANVAS_SETTINGS } from "../domain/diagramDefaults";

export type ExportBounds = { width: number; height: number };
export type PdfPageImage = { imageBytes: Uint8Array; pageWidth: number; pageHeight: number; imageWidth: number; imageHeight: number };

export function svgToPngBlob(svg: string, bounds: ExportBounds, background = DEFAULT_CANVAS_SETTINGS.background) {
  return new Promise<Blob>((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const image = new Image();
    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bounds.width * scale));
      canvas.height = Math.max(1, Math.round(bounds.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas is unavailable"));
        return;
      }
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("PNG export failed"));
        }
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG render failed"));
    };
    image.src = url;
  });
}

export async function svgToPdfBlob(svg: string, bounds: ExportBounds, background = DEFAULT_CANVAS_SETTINGS.background) {
  const page = await svgToPdfPageImage(svg, bounds, background);
  return buildImagesPdfBlob([page]);
}

export function svgToPdfPageImage(svg: string, bounds: ExportBounds, background = DEFAULT_CANVAS_SETTINGS.background) {
  return new Promise<PdfPageImage>((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const image = new Image();
    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bounds.width * scale));
      canvas.height = Math.max(1, Math.round(bounds.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas is unavailable"));
        return;
      }
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        async (jpeg) => {
          URL.revokeObjectURL(url);
          if (!jpeg) {
            reject(new Error("PDF image render failed"));
            return;
          }
          const jpegBytes = new Uint8Array(await jpeg.arrayBuffer());
          resolve({ imageBytes: jpegBytes, pageWidth: bounds.width, pageHeight: bounds.height, imageWidth: canvas.width, imageHeight: canvas.height });
        },
        "image/jpeg",
        0.92
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG render failed"));
    };
    image.src = url;
  });
}

export function buildImagesPdfBlob(pages: PdfPageImage[]) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let offset = 0;
  const pushText = (value: string) => {
    const bytes = encoder.encode(value);
    chunks.push(bytes);
    offset += bytes.length;
  };
  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };
  const object = (id: number, body: () => void) => {
    offsets[id] = offset;
    pushText(`${id} 0 obj\n`);
    body();
    pushText("\nendobj\n");
  };

  pushText("%PDF-1.4\n% Structra\n");
  object(1, () => pushText("<< /Type /Catalog /Pages 2 0 R >>"));
  const pageIds = pages.map((_, index) => 3 + index * 3);
  object(2, () => pushText(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`));
  pages.forEach((page, index) => {
    const pageId = 3 + index * 3;
    const imageId = pageId + 1;
    const contentId = pageId + 2;
    const imageName = `Im${index}`;
    object(pageId, () =>
      pushText(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${formatPdfNumber(page.pageWidth)} ${formatPdfNumber(page.pageHeight)}] /Resources << /XObject << /${imageName} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`
      )
    );
    object(imageId, () => {
      pushText(`<< /Type /XObject /Subtype /Image /Width ${page.imageWidth} /Height ${page.imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.imageBytes.length} >>\nstream\n`);
      pushBytes(page.imageBytes);
      pushText("\nendstream");
    });
    const content = `q\n${formatPdfNumber(page.pageWidth)} 0 0 ${formatPdfNumber(page.pageHeight)} 0 0 cm\n/${imageName} Do\nQ\n`;
    object(contentId, () => pushText(`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream`));
  });

  const xrefOffset = offset;
  const objectCount = 2 + pages.length * 3;
  pushText(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`);
  for (let index = 1; index <= objectCount; index += 1) {
    pushText(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
  }
  pushText(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const pdf = new Uint8Array(size);
  let cursor = 0;
  chunks.forEach((chunk) => {
    pdf.set(chunk, cursor);
    cursor += chunk.length;
  });
  return new Blob([pdf], { type: "application/pdf" });
}

function formatPdfNumber(value: number) {
  return String(Math.max(1, Math.round(value * 100) / 100));
}
