import fs from "node:fs";
import path from "node:path";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import type { ProjectsReport } from "@/lib/export/projects-report";
import {
  buildProjectsPdfDefinition,
  PDF_FONT_FAMILY,
  type PdfDocumentDefinition,
} from "@/lib/export/projects-pdf-definition";

// Mini-Sprint 55 — server-side PDF rendering with pdfmake (declared as
// "pdfmake": "0.3.11").
//
// pdfmake API used here (pdfmake 0.3.x server-side docs,
// https://pdfmake.github.io/docs/0.3/getting-started/server-side/):
//   const pdfmake = require("pdfmake");
//   pdfmake.addFonts(fonts);
//   pdfmake.createPdf(documentDefinition).getBuffer()  // Promise<Buffer>
// NOT VERIFIED IN THIS ENVIRONMENT: the package could not be installed
// here (no network), so none of this has been compiled or executed against
// the real library yet — see the Mini-Sprint 55 report.
//
// Font: Carlito Regular/Bold (SIL OFL 1.1) bundled in assets/fonts/ with its
// license. It contains á é í ó ú ü ñ (and the capitals), checked with
// fontTools against the exact files shipped. pdfmake receives absolute file
// paths and embeds the font in the PDF; nothing is fetched from any
// external service.

type PdfMakeFontFiles = {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
};

type PdfMakeServer = {
  addFonts(fonts: Record<string, PdfMakeFontFiles>): void;
  createPdf(documentDefinition: PdfDocumentDefinition): {
    getBuffer(): Promise<Buffer>;
  };
};

let fontsRegistered = false;

function loadPdfMake(): PdfMakeServer {
  // Plain CommonJS require: pdfmake 0.3's documented Node usage is
  // require("pdfmake"), and requiring it here avoids depending on type
  // declarations that could not be inspected without installing the package.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const loaded = require("pdfmake");
  const pdfmake: PdfMakeServer = loaded.default ?? loaded;

  if (!fontsRegistered) {
    const fontDir = path.join(process.cwd(), "assets", "fonts");
    const regular = path.join(fontDir, "Carlito-Regular.ttf");
    const bold = path.join(fontDir, "Carlito-Bold.ttf");
    if (!fs.existsSync(regular) || !fs.existsSync(bold)) {
      throw new Error("PDF font files not found");
    }
    // The report only uses regular and bold; italic slots point at the
    // same files so every style key pdfmake looks up is defined.
    pdfmake.addFonts({
      [PDF_FONT_FAMILY]: {
        normal: regular,
        bold,
        italics: regular,
        bolditalics: bold,
      },
    });
    fontsRegistered = true;
  }

  return pdfmake;
}

export async function renderProjectsPdf(
  report: ProjectsReport,
  messages: Messages,
  locale: Locale,
): Promise<Buffer> {
  const pdfmake = loadPdfMake();
  const definition = buildProjectsPdfDefinition(report, messages, locale, new Date());
  return pdfmake.createPdf(definition).getBuffer();
}
