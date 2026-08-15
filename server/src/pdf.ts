import PDFDocument from "pdfkit";

export interface PdfSection {
  heading: string;
  lines: string[];
}

export function renderTextPdf(params: {
  titulo: string;
  subtitulo?: string;
  secoes: PdfSection[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).fillColor("#0D1326").text(params.titulo);
    if (params.subtitulo) {
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor("#4A46F2").text(params.subtitulo);
    }
    doc.moveDown(1.2);

    for (const secao of params.secoes) {
      doc.fontSize(13).fillColor("#0D1326").text(secao.heading);
      doc.moveDown(0.4);
      doc.fontSize(11).fillColor("#1d2740");
      for (const line of secao.lines) {
        doc.text(`•  ${line}`, { indent: 4 });
        doc.moveDown(0.2);
      }
      doc.moveDown(0.8);
    }

    doc.end();
  });
}
